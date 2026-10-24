import { type UserProfile, type CallSession, type ChatMessage } from '../types';

/**
 * Mock Backend Provider for Local Demo Mode
 * Uses native browser BroadcastChannel and storage to synchronize real-time
 * WebRTC signaling, chat messages, and presence across multiple tabs or windows
 * on the same machine without requiring a live Firebase API key.
 */

const PRESENCE_CHANNEL = 'together_presence_channel';
const CALL_CHANNEL = 'together_call_channel';
const CHAT_CHANNEL = 'together_chat_channel';

class MockBackendService {
  private presenceBc: BroadcastChannel | null = null;
  private callBc: BroadcastChannel | null = null;
  private chatBc: BroadcastChannel | null = null;

  private authListeners: ((user: any) => void)[] = [];
  private partnerListeners: ((partner: UserProfile | null) => void)[] = [];
  private incomingCallListeners: ((call: CallSession) => void)[] = [];
  private callDocListeners: Map<string, (call: CallSession) => void> = new Map();
  private candidateListeners: Map<string, (candidate: RTCIceCandidateInit) => void> = new Map();
  private chatListeners: ((messages: ChatMessage[]) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.presenceBc = new BroadcastChannel(PRESENCE_CHANNEL);
        this.callBc = new BroadcastChannel(CALL_CHANNEL);
        this.chatBc = new BroadcastChannel(CHAT_CHANNEL);

        this.initPresenceListener();
        this.initCallListener();
        this.initChatListener();
      } catch (e) {
        console.warn('[MockBackend] BroadcastChannel unavailable:', e);
      }
    }
  }

  // ==========================================
  // Auth & Session
  // ==========================================

  public getCurrentSessionUser(): any {
    const raw = sessionStorage.getItem('togetherspace_mock_user');
    return raw ? JSON.parse(raw) : null;
  }

  public onAuthStateChanged(callback: (user: any) => void): () => void {
    this.authListeners.push(callback);
    // Initial emit
    callback(this.getCurrentSessionUser());
    return () => {
      this.authListeners = this.authListeners.filter((cb) => cb !== callback);
    };
  }

  public mockSignUp(params: { email: string; displayName: string; photoURL?: string }): any {
    const user = {
      uid: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: params.email.toLowerCase(),
      displayName: params.displayName,
      photoURL: params.photoURL || '',
      emailVerified: true,
    };
    sessionStorage.setItem('togetherspace_mock_user', JSON.stringify(user));
    this.saveUserProfile(user);
    this.broadcastPresence(user.email, true);
    this.authListeners.forEach((cb) => cb(user));
    return user;
  }

  public mockLogin(email: string): any {
    const normalized = email.toLowerCase();
    const storedProfile = this.getUserProfileByEmail(normalized);
    const user = {
      uid: storedProfile?.uid || `mock_${Date.now()}`,
      email: normalized,
      displayName: storedProfile?.displayName || (normalized.startsWith('alice') ? 'Alice' : 'Bob'),
      photoURL: storedProfile?.photoURL || '',
      emailVerified: true,
    };
    sessionStorage.setItem('togetherspace_mock_user', JSON.stringify(user));
    this.saveUserProfile(user);
    this.broadcastPresence(user.email, true);
    this.authListeners.forEach((cb) => cb(user));
    return user;
  }

  public mockLogout(): void {
    const current = this.getCurrentSessionUser();
    if (current?.email) {
      this.broadcastPresence(current.email, false);
    }
    sessionStorage.removeItem('togetherspace_mock_user');
    this.authListeners.forEach((cb) => cb(null));
  }

  public saveUserProfile(user: any): void {
    const all = this.getAllUserProfiles();
    all[user.email] = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isOnline: true,
      lastSeen: Date.now(),
    };
    localStorage.setItem('togetherspace_mock_profiles', JSON.stringify(all));
  }

  public getUserProfileByEmail(email: string): UserProfile | null {
    const all = this.getAllUserProfiles();
    return all[email.toLowerCase()] || null;
  }

  private getAllUserProfiles(): Record<string, UserProfile> {
    const raw = localStorage.getItem('togetherspace_mock_profiles');
    return raw ? JSON.parse(raw) : {};
  }

  // ==========================================
  // Presence
  // ==========================================

  private initPresenceListener(): void {
    if (!this.presenceBc) return;
    this.presenceBc.onmessage = (event) => {
      const { type, email, isOnline, inCall, activeCallId } = event.data || {};
      if (type === 'presence_update') {
        const currentUser = this.getCurrentSessionUser();
        // If the update is about our partner, update partner profile
        const all = this.getAllUserProfiles();
        if (all[email]) {
          all[email].isOnline = isOnline;
          all[email].inCall = Boolean(inCall);
          all[email].activeCallId = activeCallId || null;
          all[email].lastSeen = Date.now();
          localStorage.setItem('togetherspace_mock_profiles', JSON.stringify(all));

          if (currentUser?.email && currentUser.email !== email) {
            this.partnerListeners.forEach((cb) => cb(all[email]));
          }
        }
      } else if (type === 'presence_query') {
        // Reply with current status
        const currentUser = this.getCurrentSessionUser();
        if (currentUser) {
          this.broadcastPresence(currentUser.email, true);
        }
      }
    };
  }

  public broadcastPresence(email: string, isOnline: boolean, inCall: boolean = false, activeCallId: string | null = null): void {
    if (this.presenceBc) {
      this.presenceBc.postMessage({
        type: 'presence_update',
        email: email.toLowerCase(),
        isOnline,
        inCall,
        activeCallId,
      });
    }
  }

  public queryPresence(): void {
    if (this.presenceBc) {
      this.presenceBc.postMessage({ type: 'presence_query' });
    }
  }

  public listenToPartner(partnerEmail: string, callback: (partner: UserProfile | null) => void): () => void {
    this.partnerListeners.push(callback);
    const existing = this.getUserProfileByEmail(partnerEmail);
    callback(existing);
    this.queryPresence();

    return () => {
      this.partnerListeners = this.partnerListeners.filter((cb) => cb !== callback);
    };
  }

  // ==========================================
  // Calls & WebRTC Signaling
  // ==========================================

  private initCallListener(): void {
    if (!this.callBc) return;
    this.callBc.onmessage = (event) => {
      const { action, call, callId, candidate, peerRole } = event.data || {};
      const currentUser = this.getCurrentSessionUser();

      if (action === 'new_call' && call) {
        if (currentUser && currentUser.email === call.receiverEmail && call.status === 'ringing') {
          this.incomingCallListeners.forEach((cb) => cb(call));
        }
      } else if (action === 'call_update' && call) {
        const cb = this.callDocListeners.get(call.id);
        if (cb) cb(call);
      } else if (action === 'ice_candidate') {
        const key = `${callId}_${peerRole}`;
        const cb = this.candidateListeners.get(key);
        if (cb && candidate) cb(candidate);
      }
    };
  }

  public listenForIncomingCalls(_userEmail: string, callback: (call: CallSession) => void): () => void {
    this.incomingCallListeners.push(callback);
    return () => {
      this.incomingCallListeners = this.incomingCallListeners.filter((cb) => cb !== callback);
    };
  }

  public listenToCallDoc(callId: string, callback: (call: CallSession) => void): () => void {
    this.callDocListeners.set(callId, callback);
    return () => {
      this.callDocListeners.delete(callId);
    };
  }

  public listenToPeerCandidates(callId: string, peerRole: 'caller' | 'receiver', callback: (cand: RTCIceCandidateInit) => void): () => void {
    const key = `${callId}_${peerRole}`;
    this.candidateListeners.set(key, callback);
    return () => {
      this.candidateListeners.delete(key);
    };
  }

  public broadcastCall(action: string, call: any): void {
    if (this.callBc) {
      this.callBc.postMessage({ action, call });
    }
  }

  public broadcastCandidate(callId: string, peerRole: 'caller' | 'receiver', candidate: RTCIceCandidate): void {
    if (this.callBc) {
      this.callBc.postMessage({
        action: 'ice_candidate',
        callId,
        peerRole,
        candidate: {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        },
      });
    }
  }

  // ==========================================
  // Real-Time Chat
  // ==========================================

  private initChatListener(): void {
    if (!this.chatBc) return;
    this.chatBc.onmessage = (event) => {
      const { type } = event.data || {};
      if (type === 'new_message') {
        const messages = this.getStoredMessages();
        this.chatListeners.forEach((cb) => cb(messages));
      }
    };
  }

  public getStoredMessages(): ChatMessage[] {
    const raw = localStorage.getItem('togetherspace_mock_chat');
    return raw ? JSON.parse(raw) : [];
  }

  public sendMockMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): void {
    const messages = this.getStoredMessages();
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    messages.push(newMsg);
    localStorage.setItem('togetherspace_mock_chat', JSON.stringify(messages));

    if (this.chatBc) {
      this.chatBc.postMessage({ type: 'new_message' });
    }
    this.chatListeners.forEach((cb) => cb(messages));
  }

  public subscribeToMessages(callback: (messages: ChatMessage[]) => void): () => void {
    this.chatListeners.push(callback);
    callback(this.getStoredMessages());
    return () => {
      this.chatListeners = this.chatListeners.filter((cb) => cb !== callback);
    };
  }
}

export const mockBackend = new MockBackendService();
