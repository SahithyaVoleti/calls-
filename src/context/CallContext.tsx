import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { usePresence } from './PresenceContext';
import { WebRTCManager } from '../services/webrtcService';
import { signalingService } from '../services/signalingService';
import { soundService } from '../services/soundService';
import { presenceService } from '../services/presenceService';
import { type CallSession, type CallStatus, type CallType, type CallControlsState } from '../types';

interface CallContextType {
  activeCall: CallSession | null;
  incomingCall: CallSession | null;
  callStatus: CallStatus;
  callType: CallType;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  formattedDuration: string;
  controlsState: CallControlsState;
  connectionState: RTCPeerConnectionState;
  errorMessage: string | null;
  startCall: (type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  switchToAudioOnly: () => void;
  toggleInCallChat: () => void;
  clearError: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, isAuthorized, partnerEmail } = useAuth();
  const { partnerProfile, isPartnerInCall } = usePresence();

  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType>('video');

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [controlsState, setControlsState] = useState<CallControlsState>({
    isMicMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    isAudioOnly: false,
    isChatOpen: false,
  });

  const [callDuration, setCallDuration] = useState(0);

  // Refs for tracking mutable state inside callbacks
  const rtcManagerRef = useRef<WebRTCManager>(new WebRTCManager());
  const activeCallRef = useRef<CallSession | null>(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const durationTimerRef = useRef<any>(null);
  const outgoingTimeoutRef = useRef<any>(null);
  const unsubscribeCallRef = useRef<(() => void) | null>(null);
  const unsubscribePeerCandidatesRef = useRef<(() => void) | null>(null);

  // Format call duration helper (MM:SS or HH:MM:SS)
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  /**
   * Reset all call media, peer connection, and state
   */
  const cleanupCall = useCallback(() => {
    soundService.stopAll();

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (outgoingTimeoutRef.current) {
      clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }

    if (unsubscribeCallRef.current) {
      unsubscribeCallRef.current();
      unsubscribeCallRef.current = null;
    }
    if (unsubscribePeerCandidatesRef.current) {
      unsubscribePeerCandidatesRef.current();
      unsubscribePeerCandidatesRef.current = null;
    }

    if (rtcManagerRef.current) {
      rtcManagerRef.current.cleanup();
    }

    if (currentUser?.uid) {
      presenceService.setOnlineStatus(currentUser.uid, true, false, null);
    }

    setActiveCall(null);
    setIncomingCall(null);
    setLocalStream(null);
    setRemoteStream(null);
    setCallDuration(0);
    setConnectionState('new');
    setControlsState({
      isMicMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      isAudioOnly: false,
      isChatOpen: false,
    });
  }, [currentUser]);

  /**
   * Listen for incoming calls
   */
  useEffect(() => {
    if (!currentUser?.email || !isAuthorized) return;

    const unsubscribe = signalingService.listenForIncomingCalls(currentUser.email, (call) => {
      // If we are currently in an active call, automatically decline with 'busy'
      if (activeCallRef.current) {
        signalingService.declineCall(call.id, 'busy');
        return;
      }

      setIncomingCall(call);
      setCallType(call.type);
      setCallStatus('incoming_ringing');
      soundService.startIncomingRing();
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, isAuthorized]);

  /**
   * Cleanup on tab unload
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeCallRef.current?.id) {
        signalingService.endCall(activeCallRef.current.id);
      }
      cleanupCall();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cleanupCall]);

  /**
   * Start a new call (voice or video)
   */
  const startCall = async (type: CallType): Promise<void> => {
    if (!currentUser || !partnerEmail) {
      setErrorMessage('Cannot start call: Partner information is missing.');
      return;
    }

    if (isPartnerInCall) {
      setErrorMessage('Your partner is currently busy in another call.');
      return;
    }

    cleanupCall();
    setErrorMessage(null);
    setCallType(type);
    setCallStatus('outgoing_calling');
    soundService.startRingback();

    try {
      const manager = rtcManagerRef.current!;

      // 1. Acquire media stream (audio-only or audio+video)
      const stream = await manager.getMediaStream(type);
      setLocalStream(stream);

      // 2. Set WebRTC callbacks
      manager.setCallbacks({
        onRemoteStream: (rStream) => {
          setRemoteStream(new MediaStream(rStream.getTracks()));
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          if (state === 'connected') {
            soundService.stopAll();
            soundService.playConnectedChime();
            setCallStatus('connected');
          } else if (state === 'failed' || state === 'closed') {
            soundService.stopAll();
            soundService.playEndedChime();
            setCallStatus('ended');
            setTimeout(cleanupCall, 1800);
          }
        },
        onIceCandidate: (candidate) => {
          if (activeCallRef.current?.id) {
            signalingService.sendIceCandidate(activeCallRef.current.id, 'caller', candidate);
          }
        },
      });

      // 3. Create peer connection & offer
      const pc = manager.createPeerConnection();
      const offer = await manager.createOffer();

      // 4. Create Firestore session document
      const callId = await signalingService.createCall({
        callerId: currentUser.uid,
        callerEmail: currentUser.email || '',
        callerName: userProfile?.displayName || currentUser.displayName || 'Authorized User',
        callerAvatar: userProfile?.photoURL || currentUser.photoURL || undefined,
        receiverId: partnerProfile?.uid || 'partner',
        receiverEmail: partnerEmail,
        receiverName: partnerProfile?.displayName || partnerEmail,
        type,
        offer: {
          type: 'offer',
          sdp: offer.sdp || '',
        },
      });

      const session: CallSession = {
        id: callId,
        callerId: currentUser.uid,
        callerEmail: currentUser.email || '',
        callerName: userProfile?.displayName || currentUser.displayName || 'Authorized User',
        callerAvatar: userProfile?.photoURL || currentUser.photoURL || undefined,
        receiverId: partnerProfile?.uid || 'partner',
        receiverEmail: partnerEmail,
        receiverName: partnerProfile?.displayName || partnerEmail,
        type,
        status: 'ringing',
        createdAt: null,
      };

      setActiveCall(session);
      presenceService.setOnlineStatus(currentUser.uid, true, true, callId);

      // 5. 45-second unanswered timeout
      outgoingTimeoutRef.current = setTimeout(async () => {
        if (callStatus === 'outgoing_calling') {
          soundService.stopAll();
          soundService.playEndedChime();
          setCallStatus('missed');
          setErrorMessage('Partner did not answer.');
          await signalingService.endCall(callId);
          setTimeout(cleanupCall, 2500);
        }
      }, 45000);

      // 6. Listen for answer and ICE candidates
      unsubscribeCallRef.current = signalingService.listenToCall(callId, async (updatedSession) => {
        if (updatedSession.status === 'declined') {
          soundService.stopAll();
          soundService.playEndedChime();
          setCallStatus('declined');
          setErrorMessage('Call was declined.');
          setTimeout(cleanupCall, 2000);
        } else if (updatedSession.status === 'busy') {
          soundService.stopAll();
          soundService.playEndedChime();
          setCallStatus('busy');
          setErrorMessage('Partner is busy.');
          setTimeout(cleanupCall, 2000);
        } else if (updatedSession.status === 'ended') {
          soundService.stopAll();
          soundService.playEndedChime();
          setCallStatus('ended');
          setTimeout(cleanupCall, 1800);
        } else if (updatedSession.answer && !pc.currentRemoteDescription) {
          clearTimeout(outgoingTimeoutRef.current);
          soundService.stopAll();
          await manager.setRemoteAnswer(updatedSession.answer);
          setCallStatus('connected');
          soundService.playConnectedChime();

          // Start informational duration timer
          setCallDuration(0);
          durationTimerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        }
      });

      unsubscribePeerCandidatesRef.current = signalingService.listenToPeerCandidates(
        callId,
        'receiver',
        (candidate) => {
          manager.addIceCandidate(candidate);
        }
      );
    } catch (err: any) {
      soundService.stopAll();
      console.error('[CallContext] Error starting call:', err);
      let message = 'Unable to start call.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Device access permission was denied. Please allow microphone/camera access.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'Microphone or camera not found on this device.';
      }
      setErrorMessage(message);
      setCallStatus('failed');
      cleanupCall();
    }
  };

  /**
   * Accept an incoming call
   */
  const acceptCall = async (): Promise<void> => {
    if (!incomingCall || !currentUser) return;
    soundService.stopAll();

    const call = incomingCall;
    setIncomingCall(null);
    setActiveCall(call);
    setCallStatus('connecting');

    try {
      const manager = rtcManagerRef.current!;

      // 1. Acquire media stream matching call type
      const stream = await manager.getMediaStream(call.type);
      setLocalStream(stream);

      // 2. Set callbacks
      manager.setCallbacks({
        onRemoteStream: (rStream) => {
          setRemoteStream(new MediaStream(rStream.getTracks()));
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          if (state === 'connected') {
            soundService.playConnectedChime();
            setCallStatus('connected');
          } else if (state === 'failed' || state === 'closed') {
            soundService.playEndedChime();
            setCallStatus('ended');
            setTimeout(cleanupCall, 1800);
          }
        },
        onIceCandidate: (candidate) => {
          signalingService.sendIceCandidate(call.id, 'receiver', candidate);
        },
      });

      // 3. Create peer connection
      manager.createPeerConnection();

      // 4. Create answer from caller's offer
      if (!call.offer) throw new Error('Missing call offer');
      const answer = await manager.createAnswer(call.offer);

      // 5. Update Firestore with answer
      await signalingService.answerCall(call.id, {
        type: 'answer',
        sdp: answer.sdp || '',
      });

      presenceService.setOnlineStatus(currentUser.uid, true, true, call.id);

      // 6. Listen for ICE candidates from caller
      unsubscribePeerCandidatesRef.current = signalingService.listenToPeerCandidates(
        call.id,
        'caller',
        (candidate) => {
          manager.addIceCandidate(candidate);
        }
      );

      // 7. Listen for session state changes (e.g. caller hangs up)
      unsubscribeCallRef.current = signalingService.listenToCall(call.id, (updatedSession) => {
        if (updatedSession.status === 'ended') {
          soundService.stopAll();
          soundService.playEndedChime();
          setCallStatus('ended');
          setTimeout(cleanupCall, 1800);
        }
      });

      // 8. Start call duration timer
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      soundService.stopAll();
      console.error('[CallContext] Error accepting call:', err);
      let message = 'Failed to connect call.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Device permission was denied.';
      }
      setErrorMessage(message);
      setCallStatus('failed');
      cleanupCall();
    }
  };

  /**
   * Decline incoming call
   */
  const declineCall = async (): Promise<void> => {
    soundService.stopAll();
    if (incomingCall) {
      await signalingService.declineCall(incomingCall.id, 'declined');
      setIncomingCall(null);
    }
    setCallStatus('idle');
  };

  /**
   * End active call from either side
   */
  const endCall = async (): Promise<void> => {
    soundService.stopAll();
    soundService.playEndedChime();

    if (activeCall?.id) {
      await signalingService.endCall(activeCall.id);
    }

    setCallStatus('ended');
    setTimeout(cleanupCall, 1200);
  };

  /**
   * Microphone toggle
   */
  const toggleMic = () => {
    const isMuted = !rtcManagerRef.current?.toggleMicrophone();
    setControlsState((prev) => ({ ...prev, isMicMuted: isMuted }));
  };

  /**
   * Camera toggle
   */
  const toggleCamera = () => {
    const isOff = !rtcManagerRef.current?.toggleCamera();
    setControlsState((prev) => ({ ...prev, isCameraOff: isOff }));
  };

  /**
   * Screen sharing toggle
   */
  const toggleScreenShare = async () => {
    const isSharing = await rtcManagerRef.current?.toggleScreenShare();
    setControlsState((prev) => ({ ...prev, isScreenSharing: Boolean(isSharing) }));
  };

  /**
   * Switch to audio-only mode
   */
  const switchToAudioOnly = () => {
    rtcManagerRef.current?.switchToAudioOnly();
    setControlsState((prev) => ({
      ...prev,
      isAudioOnly: true,
      isCameraOff: true,
      isScreenSharing: false,
    }));
  };

  /**
   * Toggle in-call chat panel
   */
  const toggleInCallChat = () => {
    setControlsState((prev) => ({ ...prev, isChatOpen: !prev.isChatOpen }));
  };

  const clearError = () => {
    setErrorMessage(null);
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        callStatus,
        callType,
        localStream,
        remoteStream,
        callDuration,
        formattedDuration: formatDuration(callDuration),
        controlsState,
        connectionState,
        errorMessage,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMic,
        toggleCamera,
        toggleScreenShare,
        switchToAudioOnly,
        toggleInCallChat,
        clearError,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
