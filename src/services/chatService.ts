import {
  collection,
  doc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { type ChatMessage } from '../types';

export const PRIMARY_CONVERSATION_ID = 'primary';

export class ChatService {
  /**
   * Ensure conversation container document exists
   */
  public async ensureConversationExists(): Promise<void> {
    try {
      const convRef = doc(db, 'conversations', PRIMARY_CONVERSATION_ID);
      await setDoc(
        convRef,
        {
          id: PRIMARY_CONVERSATION_ID,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      // Handled silently or caught during message send
    }
  }

  /**
   * Send a new message to the shared conversation
   */
  public async sendMessage(params: {
    senderId: string;
    senderEmail: string;
    senderName: string;
    senderAvatar?: string;
    text: string;
  }): Promise<string> {
    const trimmed = params.text.trim();
    if (!trimmed) {
      throw new Error('Message cannot be empty');
    }
    if (trimmed.length > 2500) {
      throw new Error('Message exceeds maximum length of 2500 characters');
    }

    const messagesCol = collection(db, 'conversations', PRIMARY_CONVERSATION_ID, 'messages');
    const docRef = await addDoc(messagesCol, {
      conversationId: PRIMARY_CONVERSATION_ID,
      senderId: params.senderId,
      senderEmail: params.senderEmail.toLowerCase(),
      senderName: params.senderName,
      senderAvatar: params.senderAvatar || '',
      text: trimmed,
      timestamp: serverTimestamp(),
      status: 'sent',
    });

    // Update conversation metadata
    try {
      const convRef = doc(db, 'conversations', PRIMARY_CONVERSATION_ID);
      await setDoc(
        convRef,
        {
          lastMessageText: trimmed.slice(0, 80),
          lastMessageSender: params.senderName,
          lastMessageTimestamp: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[ChatService] Failed updating conversation metadata:', err);
    }

    return docRef.id;
  }

  /**
   * Subscribe to real-time chat messages
   */
  public subscribeToMessages(
    onMessages: (messages: ChatMessage[]) => void,
    maxMessages: number = 100
  ): Unsubscribe {
    const messagesCol = collection(db, 'conversations', PRIMARY_CONVERSATION_ID, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'), limit(maxMessages));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          messages.push({
            id: docSnap.id,
            conversationId: PRIMARY_CONVERSATION_ID,
            senderId: data.senderId,
            senderEmail: data.senderEmail,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            text: data.text,
            timestamp: data.timestamp,
            status: data.status || 'sent',
          });
        });
        onMessages(messages);
      },
      (error) => {
        console.error('[ChatService] Error listening to messages:', error);
      }
    );
  }
}

export const chatService = new ChatService();
