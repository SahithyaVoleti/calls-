import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  type Unsubscribe,
  addDoc,
  getDoc,
} from 'firebase/firestore';
import { db, isLiveFirebase } from './firebase';
import { mockBackend } from './mockBackend';
import { type CallSession, type CallType, type IceCandidatePayload } from '../types';

export class SignalingService {
  private activeMockCalls: Map<string, CallSession> = new Map();

  /**
   * Create a new call session document
   */
  public async createCall(params: {
    callerId: string;
    callerEmail: string;
    callerName: string;
    callerAvatar?: string;
    receiverId: string;
    receiverEmail: string;
    receiverName: string;
    type: CallType;
    offer: { type: 'offer'; sdp: string };
  }): Promise<string> {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const session: CallSession = {
      id: callId,
      callerId: params.callerId,
      callerEmail: params.callerEmail.toLowerCase(),
      callerName: params.callerName,
      callerAvatar: params.callerAvatar || '',
      receiverId: params.receiverId,
      receiverEmail: params.receiverEmail.toLowerCase(),
      receiverName: params.receiverName,
      type: params.type,
      status: 'ringing',
      offer: params.offer,
      createdAt: Date.now(),
    };

    if (!isLiveFirebase || !db) {
      this.activeMockCalls.set(callId, session);
      mockBackend.broadcastCall('new_call', session);
      return callId;
    }

    const callDocRef = doc(db, 'calls', callId);
    await setDoc(callDocRef, {
      ...params,
      status: 'ringing',
      createdAt: serverTimestamp(),
    });

    return callId;
  }

  /**
   * Listen to an active call session document
   */
  public listenToCall(
    callId: string,
    onUpdate: (session: CallSession) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    if (!isLiveFirebase || !db) {
      return mockBackend.listenToCallDoc(callId, onUpdate);
    }

    const callDocRef = doc(db, 'calls', callId);
    return onSnapshot(
      callDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onUpdate({
            id: snapshot.id,
            ...data,
          } as CallSession);
        }
      },
      (error) => {
        console.error('[Signaling] Error in call snapshot:', error);
        if (onError) onError(error);
      }
    );
  }

  /**
   * Listen for incoming calls for the current user
   */
  public listenForIncomingCalls(
    userEmail: string,
    onIncomingCall: (call: CallSession) => void
  ): Unsubscribe {
    if (!isLiveFirebase || !db) {
      return mockBackend.listenForIncomingCalls(userEmail, onIncomingCall);
    }

    const normalizedEmail = userEmail.trim().toLowerCase();
    const callsRef = collection(db, 'calls');
    const q = query(
      callsRef,
      where('receiverEmail', '==', normalizedEmail),
      where('status', '==', 'ringing')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const now = Date.now();
            let isStale = false;
            if (data.createdAt?.toMillis) {
              const createdMs = data.createdAt.toMillis();
              if (now - createdMs > 75000) {
                isStale = true;
              }
            }

            if (!isStale) {
              onIncomingCall({
                id: change.doc.id,
                ...data,
              } as CallSession);
            }
          }
        });
      },
      (error) => {
        console.warn('[Signaling] listenForIncomingCalls error:', error);
      }
    );
  }

  /**
   * Accept an incoming call by providing an answer SDP
   */
  public async answerCall(callId: string, answer: { type: 'answer'; sdp: string }): Promise<void> {
    if (!isLiveFirebase || !db) {
      const call = this.activeMockCalls.get(callId) || { id: callId } as CallSession;
      call.answer = answer;
      call.status = 'connected';
      this.activeMockCalls.set(callId, call);
      mockBackend.broadcastCall('call_update', call);
      return;
    }

    const callDocRef = doc(db, 'calls', callId);
    await updateDoc(callDocRef, {
      answer,
      status: 'connected',
      connectedAt: serverTimestamp(),
    });
  }

  /**
   * Decline an incoming call
   */
  public async declineCall(callId: string, reason: 'declined' | 'busy' = 'declined'): Promise<void> {
    if (!isLiveFirebase || !db) {
      const call = this.activeMockCalls.get(callId) || { id: callId } as CallSession;
      call.status = reason;
      this.activeMockCalls.set(callId, call);
      mockBackend.broadcastCall('call_update', call);
      return;
    }

    const callDocRef = doc(db, 'calls', callId);
    await updateDoc(callDocRef, {
      status: reason,
      endedAt: serverTimestamp(),
    });
  }

  /**
   * Mark call as ended
   */
  public async endCall(callId: string): Promise<void> {
    if (!isLiveFirebase || !db) {
      const call = this.activeMockCalls.get(callId) || { id: callId } as CallSession;
      call.status = 'ended';
      this.activeMockCalls.set(callId, call);
      mockBackend.broadcastCall('call_update', call);
      return;
    }

    try {
      const callDocRef = doc(db, 'calls', callId);
      const snapshot = await getDoc(callDocRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.status !== 'ended' && data.status !== 'declined') {
          await updateDoc(callDocRef, {
            status: 'ended',
            endedAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      console.warn('[Signaling] endCall error:', err);
    }
  }

  /**
   * Push an ICE candidate to the call
   */
  public async sendIceCandidate(
    callId: string,
    role: 'caller' | 'receiver',
    candidate: RTCIceCandidate
  ): Promise<void> {
    if (!isLiveFirebase || !db) {
      mockBackend.broadcastCandidate(callId, role, candidate);
      return;
    }

    const subcollectionName = role === 'caller' ? 'callerCandidates' : 'receiverCandidates';
    const candidatesCol = collection(db, 'calls', callId, subcollectionName);

    const payload: IceCandidatePayload = {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
      timestamp: Date.now(),
    };

    await addDoc(candidatesCol, payload);
  }

  /**
   * Listen to peer's ICE candidates
   */
  public listenToPeerCandidates(
    callId: string,
    peerRole: 'caller' | 'receiver',
    onCandidate: (candidateInit: RTCIceCandidateInit) => void
  ): Unsubscribe {
    if (!isLiveFirebase || !db) {
      return mockBackend.listenToPeerCandidates(callId, peerRole, onCandidate);
    }

    const subcollectionName = peerRole === 'caller' ? 'callerCandidates' : 'receiverCandidates';
    const candidatesCol = collection(db, 'calls', callId, subcollectionName);

    return onSnapshot(candidatesCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data() as IceCandidatePayload;
          onCandidate({
            candidate: data.candidate,
            sdpMid: data.sdpMid,
            sdpMLineIndex: data.sdpMLineIndex,
          });
        }
      });
    });
  }
}

export const signalingService = new SignalingService();
