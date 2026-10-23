/**
 * Sound Service powered by Web Audio API
 * Generates clear, pleasant synthesized tones for calling, ringing, connected, ended, and messages
 * without requiring external audio assets or risking 404/CORS issues.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private ringbackInterval: any = null;
  private incomingInterval: any = null;

  private getAudioContext(): AudioContext | null {
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch (e) {
      console.warn('[SoundService] AudioContext not available:', e);
      return null;
    }
  }

  /**
   * Play an outgoing ringback tone (repeating standard 440Hz + 480Hz dual tone)
   */
  public startRingback(): void {
    this.stopAll();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const playPulse = () => {
      try {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now);

        // Gentle envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.08);
        gain.gain.setValueAtTime(0.08, now + 1.6);
        gain.gain.linearRampToValueAtTime(0, now + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.8);
        osc2.stop(now + 1.8);
      } catch (err) {
        console.warn('[SoundService] Ringback pulse failed:', err);
      }
    };

    playPulse();
    this.ringbackInterval = setInterval(playPulse, 4000);
  }

  /**
   * Play incoming call ringtone (melodic chime pattern repeating every 3s)
   */
  public startIncomingRing(): void {
    this.stopAll();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const playMelody = () => {
      try {
        const notes = [
          { freq: 523.25, time: 0.0, dur: 0.15 }, // C5
          { freq: 659.25, time: 0.18, dur: 0.15 }, // E5
          { freq: 783.99, time: 0.36, dur: 0.18 }, // G5
          { freq: 1046.5, time: 0.58, dur: 0.4 },  // C6
          { freq: 783.99, time: 1.1, dur: 0.15 },  // G5
          { freq: 1046.5, time: 1.3, dur: 0.4 },   // C6
        ];

        const now = ctx.currentTime;
        notes.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + time);

          gain.gain.setValueAtTime(0, now + time);
          gain.gain.linearRampToValueAtTime(0.12, now + time + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + time);
          osc.stop(now + time + dur + 0.05);
        });
      } catch (err) {
        console.warn('[SoundService] Incoming ring melody failed:', err);
      }
    };

    playMelody();
    this.incomingInterval = setInterval(playMelody, 2800);
  }

  /**
   * Play ascending chime when call connects
   */
  public playConnectedChime(): void {
    this.stopAll();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (err) {
      console.warn('[SoundService] Connected chime failed:', err);
    }
  }

  /**
   * Play descending chime when call ends
   */
  public playEndedChime(): void {
    this.stopAll();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [783.99, 659.25, 523.25]; // G5, E5, C5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.32);
      });
    } catch (err) {
      console.warn('[SoundService] Ended chime failed:', err);
    }
  }

  /**
   * Play soft pop/ding for incoming messages
   */
  public playMessageDing(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.08); // E6

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (err) {
      console.warn('[SoundService] Message ding failed:', err);
    }
  }

  /**
   * Stop any continuous tones (incoming ring or outgoing ringback)
   */
  public stopAll(): void {
    if (this.ringbackInterval) {
      clearInterval(this.ringbackInterval);
      this.ringbackInterval = null;
    }
    if (this.incomingInterval) {
      clearInterval(this.incomingInterval);
      this.incomingInterval = null;
    }
  }
}

export const soundService = new SoundService();
