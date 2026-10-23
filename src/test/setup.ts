import '@testing-library/jest-dom';

// WebRTC mock polyfills for Node/JSDOM testing environment
class MockMediaStreamTrack {
  public kind: string;
  public id: string;
  public enabled = true;
  public readyState = 'live';

  constructor(kind: string = 'audio') {
    this.kind = kind;
    this.id = `track-${Math.random()}`;
  }

  stop() {
    this.readyState = 'ended';
  }
}

class MockMediaStream {
  private tracks: MockMediaStreamTrack[] = [];

  constructor(tracks: MockMediaStreamTrack[] = []) {
    this.tracks = [...tracks];
  }

  getTracks() {
    return this.tracks;
  }

  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === 'audio');
  }

  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === 'video');
  }

  addTrack(track: MockMediaStreamTrack) {
    this.tracks.push(track);
  }

  removeTrack(track: MockMediaStreamTrack) {
    this.tracks = this.tracks.filter((t) => t.id !== track.id);
  }
}

if (typeof globalThis.MediaStream === 'undefined') {
  (globalThis as any).MediaStream = MockMediaStream;
}

if (typeof (globalThis as any).MediaStreamTrack === 'undefined') {
  (globalThis as any).MediaStreamTrack = MockMediaStreamTrack;
}

if (typeof (globalThis as any).RTCPeerConnection === 'undefined') {
  (globalThis as any).RTCPeerConnection = class MockRTCPeerConnection {
    close() {}
    addTrack() {}
    createOffer() {
      return Promise.resolve({ type: 'offer', sdp: 'mock-sdp' });
    }
    createAnswer() {
      return Promise.resolve({ type: 'answer', sdp: 'mock-sdp' });
    }
    setLocalDescription() {
      return Promise.resolve();
    }
    setRemoteDescription() {
      return Promise.resolve();
    }
    addIceCandidate() {
      return Promise.resolve();
    }
    getSenders() {
      return [];
    }
  };
}

if (typeof (globalThis as any).RTCSessionDescription === 'undefined') {
  (globalThis as any).RTCSessionDescription = class MockRTCSessionDescription {
    public init: any;
    constructor(init: any) {
      this.init = init;
      Object.assign(this, init);
    }
  };
}

if (typeof (globalThis as any).RTCIceCandidate === 'undefined') {
  (globalThis as any).RTCIceCandidate = class MockRTCIceCandidate {
    public init: any;
    constructor(init: any) {
      this.init = init;
      Object.assign(this, init);
    }
  };
}
