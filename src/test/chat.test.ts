import { describe, it, expect } from 'vitest';
import { chatService } from '../services/chatService';

describe('Chat Message Validation & Logic', () => {
  it('throws an error if attempting to send an empty or whitespace message', async () => {
    await expect(
      chatService.sendMessage({
        senderId: 'user1',
        senderEmail: 'alice@example.com',
        senderName: 'Alice',
        text: '   ',
      })
    ).rejects.toThrow('Message cannot be empty');
  });

  it('throws an error if message exceeds 2500 character limit', async () => {
    const hugeText = 'a'.repeat(2501);
    await expect(
      chatService.sendMessage({
        senderId: 'user1',
        senderEmail: 'alice@example.com',
        senderName: 'Alice',
        text: hugeText,
      })
    ).rejects.toThrow('Message exceeds maximum length of 2500 characters');
  });
});
