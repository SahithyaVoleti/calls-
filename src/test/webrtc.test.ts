import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebRTCManager, getIceServers } from '../services/webrtcService';

describe('WebRTC Manager & Constraints Verification', () => {
  let manager: WebRTCManager;

  beforeEach(() => {
    manager = new WebRTCManager();
    vi.restoreAllMocks();
  });

  it('configures default Google STUN servers', () => {
    const servers = getIceServers();
    expect(servers.length).toBeGreaterThanOrEqual(1);
    const urls = servers.map((s) => s.urls).flat();
    expect(urls.some((u) => u.includes('stun.l.google.com'))).toBe(true);
  });

  it('guarantees voice calls DO NOT request camera permission (video constraint is false)', async () => {
    const mockAudioTrack = { kind: 'audio', stop: vi.fn(), enabled: true, id: 'a1' };
    const mockStream = {
      getTracks: () => [mockAudioTrack],
      getAudioTracks: () => [mockAudioTrack],
      getVideoTracks: () => [],
    };

    let requestedConstraints: any = null;
    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockImplementation((constraints) => {
          requestedConstraints = constraints;
          return Promise.resolve(mockStream);
        }),
      },
    });

    await manager.getMediaStream('voice');

    // Video MUST be explicitly false
    expect(requestedConstraints).toBeDefined();
    expect(requestedConstraints.video).toBe(false);
    expect(requestedConstraints.audio).toBeTruthy();
  });

  it('requests video when callType is video', async () => {
    const mockAudioTrack = { kind: 'audio', stop: vi.fn(), enabled: true, id: 'a1' };
    const mockVideoTrack = { kind: 'video', stop: vi.fn(), enabled: true, id: 'v1' };
    const mockStream = {
      getTracks: () => [mockAudioTrack, mockVideoTrack],
      getAudioTracks: () => [mockAudioTrack],
      getVideoTracks: () => [mockVideoTrack],
    };

    let requestedConstraints: any = null;
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockImplementation((constraints) => {
          requestedConstraints = constraints;
          return Promise.resolve(mockStream);
        }),
      },
    });

    await manager.getMediaStream('video');

    expect(requestedConstraints).toBeDefined();
    expect(requestedConstraints.video).toBeTruthy();
    expect(requestedConstraints.audio).toBeTruthy();
  });

  it('stops all media tracks and closes RTCPeerConnection upon cleanup', async () => {
    const stopAudio = vi.fn();
    const stopVideo = vi.fn();
    const mockAudioTrack = { kind: 'audio', stop: stopAudio, enabled: true, id: 'a1' };
    const mockVideoTrack = { kind: 'video', stop: stopVideo, enabled: true, id: 'v1' };

    const mockStream = {
      getTracks: () => [mockAudioTrack, mockVideoTrack],
      getAudioTracks: () => [mockAudioTrack],
      getVideoTracks: () => [mockVideoTrack],
    };

    manager.localStream = mockStream as any;

    const closePC = vi.fn();
    manager.pc = {
      close: closePC,
    } as any;

    manager.cleanup();

    expect(stopAudio).toHaveBeenCalledTimes(1);
    expect(stopVideo).toHaveBeenCalledTimes(1);
    expect(closePC).toHaveBeenCalledTimes(1);
    expect(manager.localStream).toBeNull();
    expect(manager.pc).toBeNull();
  });
});
