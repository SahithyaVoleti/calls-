import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { chatService } from '../services/chatService';
import { soundService } from '../services/soundService';
import { type ChatMessage } from '../types';

interface ChatContextType {
  messages: ChatMessage[];
  loadingMessages: boolean;
  unreadCount: number;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  markAsRead: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, isAuthorized } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isChatOpenRef = useRef(isChatOpen);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  useEffect(() => {
    if (!currentUser || !isAuthorized) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    initialLoadRef.current = true;

    // Ensure conversation doc exists
    chatService.ensureConversationExists();

    const unsubscribe = chatService.subscribeToMessages((newMessages) => {
      setMessages(newMessages);
      setLoadingMessages(false);

      // Play sound and increment unread badge if message is from partner
      if (!initialLoadRef.current && newMessages.length > 0) {
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.senderId !== currentUser.uid) {
          soundService.playMessageDing();
          if (!isChatOpenRef.current) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      }
      initialLoadRef.current = false;
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, isAuthorized]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const sendMessage = async (text: string): Promise<void> => {
    if (!currentUser) throw new Error('Not logged in');

    await chatService.sendMessage({
      senderId: currentUser.uid,
      senderEmail: currentUser.email || '',
      senderName: userProfile?.displayName || currentUser.displayName || 'Authorized User',
      senderAvatar: userProfile?.photoURL || currentUser.photoURL || undefined,
      text,
    });
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        loadingMessages,
        unreadCount,
        isChatOpen,
        setIsChatOpen: (open) => {
          setIsChatOpen(open);
          if (open) setUnreadCount(0);
        },
        sendMessage,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
