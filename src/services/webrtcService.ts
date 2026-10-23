import { type CallType } from '../types';

export interface RTCConfigOptions {
  turnUrl?: string;
  turnUsername?: string;
  turnCredential?: string;
}

export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrl) {
    const urls = turnUrl.split(',').map((u: string) => u.trim());
    if (turnUsername && turnCredential) {
      servers.push({
        urls,
        username: turnUsername,
        credential: turnCredential,
      });
    } else {
      servers.push({ urls });
    }
  }

  return servers;
}

export class WebRTCManager {
  public pc: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private screenStream: MediaStream | null = null;
  private cameraTrackBackup: MediaStreamTrack | null = null;

  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  private onIceCandidateCallback: ((candidate: RTCIceCandidate) => void) | null = null;

  constructor() {
    this.remoteStream = new MediaStream();
  }

  public setCallbacks(callbacks: {
    onRemoteStream?: (stream: MediaStream) => void;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onIceCandidate?: (candidate: RTCIceCandidate) => void;
  }) {
    if (callbacks.onRemoteStream) this.onRemoteStreamCallback = callbacks.onRemoteStream;
    if (callbacks.onConnectionStateChange) this.onConnectionStateChangeCallback = callbacks.onConnectionStateChange;
    if (callbacks.onIceCandidate) this.onIceCandidateCallback = callbacks.onIceCandidate;
  }

  /**
   * Acquire user media with accurate constraints
   * In voice-only calls, video MUST be false so no camera permission is prompted.
   */
  public async getMediaStream(callType: CallType, audioDeviceId?: string, videoDeviceId?: string): Promise<MediaStream> {
    const audioConstraints: boolean | MediaTrackConstraints = audioDeviceId
      ? { deviceId: { exact: audioDeviceId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      : { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

    const videoConstraints: boolean | MediaTrackConstraints = callType === 'video'
      ? (videoDeviceId
          ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { max: 30 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { max: 30 }, facingMode: 'user' })
      : false;

    const constraints: MediaStreamConstraints = {
      audio: audioConstraints,
      video: videoConstraints,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (err: any) {
      console.error('[WebRTC] getUserMedia failed with constraints:', constraints, err);
      throw err;
    }
  }

  /**
   * Initialize RTCPeerConnection and bind event handlers
   */
  public createPeerConnection(): RTCPeerConnection {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    const iceServers = getIceServers();
    const config: RTCConfiguration = {
      iceServers,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };

    const pc = new RTCPeerConnection(config);
    this.pc = pc;
    this.remoteStream = new MediaStream();
    this.pendingCandidates = [];

    // Handle remote tracks
    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (this.remoteStream && !this.remoteStream.getTracks().some((t) => t.id === track.id)) {
          this.remoteStream.addTrack(track);
        }
      });
      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Handle ICE candidates generated locally
    pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      if (this.onConnectionStateChangeCallback && pc) {
        this.onConnectionStateChangeCallback(pc.connectionState);
      }
    };

    // Attach local media tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    return pc;
  }

  /**
   * Create WebRTC offer
   */
  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('PeerConnection not initialized');
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  /**
   * Handle incoming offer and create answer
   */
  public async createAnswer(offerSdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('PeerConnection not initialized');
    await this.pc.setRemoteDescription(new RTCSessionDescription(offerSdp));

    // Flush any pending ICE candidates queued before remote description was set
    await this.flushPendingCandidates();

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * Set remote answer on caller side
   */
  public async setRemoteAnswer(answerSdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) throw new Error('PeerConnection not initialized');
    if (this.pc.signalingState !== 'stable') {
      await this.pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
      await this.flushPendingCandidates();
    }
  }

  /**
   * Add incoming ICE candidate or queue if remote description is not ready
   */
  public async addIceCandidate(candidateInit: RTCIceCandidateInit): Promise<void> {
    if (!this.pc || !this.pc.remoteDescription || !this.pc.remoteDescription.type) {
      this.pendingCandidates.push(candidateInit);
      return;
    }

    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
    } catch (e) {
      console.warn('[WebRTC] Error adding ICE candidate:', e);
    }
  }

  private async flushPendingCandidates(): Promise<void> {
    if (!this.pc || !this.pc.remoteDescription) return;
    const candidates = [...this.pendingCandidates];
    this.pendingCandidates = [];

    for (const cand of candidates) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.warn('[WebRTC] Error flushing candidate:', err);
      }
    }
  }

  /**
   * Mute / Unmute microphone
   */
  public toggleMicrophone(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) return false;

    const newState = enabled !== undefined ? enabled : !audioTrack.enabled;
    audioTrack.enabled = newState;
    return newState;
  }

  /**
   * Enable / Disable camera video
   */
  public toggleCamera(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return false;

    const newState = enabled !== undefined ? enabled : !videoTrack.enabled;
    videoTrack.enabled = newState;
    return newState;
  }

  /**
   * Switch to audio-only mode by disabling video track
   */
  public switchToAudioOnly(): void {
    if (!this.localStream) return;
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = false;
      track.stop();
      this.localStream?.removeTrack(track);
    });

    if (this.pc) {
      const senders = this.pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (videoSender) {
        try {
          this.pc.removeTrack(videoSender);
        } catch (e) {
          console.warn('[WebRTC] Failed removing video sender track:', e);
        }
      }
    }
  }

  /**
   * Toggle Screen Sharing
   */
  public async toggleScreenShare(): Promise<boolean> {
    if (!this.pc) return false;

    // If currently screen sharing, revert back to camera
    if (this.screenStream) {
      this.stopScreenShare();
      return false;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      this.screenStream = screenStream;
      const screenVideoTrack = screenStream.getVideoTracks()[0];

      // Replace current video track in RTCPeerConnection sender
      const videoSender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
      if (videoSender) {
        this.cameraTrackBackup = videoSender.track;
        await videoSender.replaceTrack(screenVideoTrack);
      }

      // Handle user clicking native browser "Stop sharing" button
      screenVideoTrack.onended = () => {
        this.stopScreenShare();
      };

      return true;
    } catch (err) {
      console.warn('[WebRTC] Screen share cancelled or rejected:', err);
      return false;
    }
  }

  private async stopScreenShare(): Promise<void> {
    if (!this.screenStream) return;
    this.screenStream.getTracks().forEach((t) => t.stop());
    this.screenStream = null;

    if (this.pc && this.cameraTrackBackup) {
      const videoSender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(this.cameraTrackBackup);
      }
    }
    this.cameraTrackBackup = null;
  }

  /**
   * Full cleanup of media streams and peer connection
   */
  public cleanup(): void {
    this.stopScreenShare();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.remoteStream = null;
    }

    if (this.pc) {
      try {
        this.pc.close();
      } catch (e) {
        console.warn('[WebRTC] Error closing peer connection:', e);
      }
      this.pc = null;
    }

    this.pendingCandidates = [];
  }
}
