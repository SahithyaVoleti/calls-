export type CallType = 'video' | 'voice';

export type CallStatus =
  | 'idle'
  | 'outgoing_calling'
  | 'incoming_ringing'
  | 'connecting'
  | 'connected'
  | 'declined'
  | 'busy'
  | 'missed'
  | 'ended'
  | 'failed';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isOnline?: boolean;
  lastSeen?: any;
  inCall?: boolean;
  activeCallId?: string | null;
  updatedAt?: any;
}

export interface CallSession {
  id: string;
  callerId: string;
  callerEmail: string;
  callerName: string;
  callerAvatar?: string;
  receiverId: string;
  receiverEmail: string;
  receiverName: string;
  type: CallType;
  status: 'ringing' | 'connected' | 'declined' | 'busy' | 'missed' | 'ended';
  createdAt: any;
  connectedAt?: any;
  endedAt?: any;
  offer?: {
    type: 'offer';
    sdp: string;
  };
  answer?: {
    type: 'answer';
    sdp: string;
  };
}

export interface IceCandidatePayload {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  timestamp?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: any;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  localTempId?: string;
}

export interface CallControlsState {
  isMicMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isAudioOnly: boolean;
  isChatOpen: boolean;
}

export interface MediaDeviceSummary {
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  selectedAudioInputId: string;
  selectedVideoInputId: string;
  selectedAudioOutputId: string;
}

export interface AllowlistEntry {
  email: string;
  role: 'owner' | 'member';
  addedAt?: any;
}
