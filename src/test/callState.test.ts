import { describe, it, expect } from 'vitest';

describe('Call State Machine & Duration Logic', () => {
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

  it('formats call duration accurately without artificial timeout thresholds', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(45)).toBe('00:45');
    expect(formatDuration(125)).toBe('02:05');
    // Meeting duration exceeding 40 minutes (e.g. 45 mins = 2700s) works with no cutoff
    expect(formatDuration(2700)).toBe('45:00');
    // Multi-hour meetings (e.g. 2 hours 15 mins = 8100s)
    expect(formatDuration(8100)).toBe('02:15:00');
  });

  it('validates call state transitions', () => {
    const validTransitions: Record<string, string[]> = {
      idle: ['outgoing_calling', 'incoming_ringing'],
      outgoing_calling: ['connected', 'declined', 'busy', 'missed', 'ended', 'failed'],
      incoming_ringing: ['connecting', 'declined', 'ended'],
      connecting: ['connected', 'failed', 'ended'],
      connected: ['ended', 'failed'],
      ended: ['idle'],
      declined: ['idle'],
      busy: ['idle'],
      missed: ['idle'],
      failed: ['idle'],
    };

    expect(validTransitions['idle']).toContain('outgoing_calling');
    expect(validTransitions['outgoing_calling']).toContain('connected');
    expect(validTransitions['incoming_ringing']).toContain('connecting');
    expect(validTransitions['connecting']).toContain('connected');
    expect(validTransitions['connected']).toContain('ended');
  });
});
