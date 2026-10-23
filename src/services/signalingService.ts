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
import { db } from './firebase';
import { type CallSession, type CallType, type IceCandidatePayload } from '../types';

export class SignalingService {
  /**
   * Create a new call session document in Firestore
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
    const callDocRef = doc(collection(db, 'calls'));
    const callId = callDocRef.id;

    await setDoc(callDocRef, {
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
            // Stale check: only accept calls initiated in the last 75 seconds
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
      console.warn('[Signaling] endCall error (possibly already ended):', err);
    }
  }

  /**
   * Push an ICE candidate to the call's candidate subcollection
   */
  public async sendIceCandidate(
    callId: string,
    role: 'caller' | 'receiver',
    candidate: RTCIceCandidate
  ): Promise<void> {
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
