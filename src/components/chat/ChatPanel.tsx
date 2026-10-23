import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { usePresence } from '../../context/PresenceContext';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import { ArrowDown, MessageSquare, ShieldCheck, X } from 'lucide-react';

interface ChatPanelProps {
  onClose?: () => void;
  isDrawer?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onClose, isDrawer = false }) => {
  const { messages, loadingMessages, sendMessage, markAsRead } = useChat();
  const { partnerDisplayName, isPartnerOnline } = usePresence();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [userIsScrolledUp, setUserIsScrolledUp] = useState(false);

  // Mark messages read when panel is visible
  useEffect(() => {
    markAsRead();
  }, [markAsRead, messages.length]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
      setUserIsScrolledUp(false);
      setShowScrollBottom(false);
    }
  };

  // Scroll to bottom on initial load or new message (if not scrolled up)
  useEffect(() => {
    if (!userIsScrolledUp) {
      scrollToBottom('auto');
    } else {
      setShowScrollBottom(true);
    }
  }, [messages.length, userIsScrolledUp]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom > 100) {
      setUserIsScrolledUp(true);
      setShowScrollBottom(true);
    } else {
      setUserIsScrolledUp(false);
      setShowScrollBottom(false);
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-navy-900 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden ${
        isDrawer ? 'max-w-md w-full' : 'w-full'
      }`}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-navy-950/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            {isPartnerOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-navy-950" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              {partnerDisplayName}
            </h3>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Private Channel
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1 relative"
      >
        {loadingMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading message history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Private & Persistent</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              This space is exclusively shared between you and {partnerDisplayName}. Messages are stored
              securely in Firestore.
            </p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessageItem key={msg.id} message={msg} />)
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-20 right-6 px-3 py-1.5 rounded-full bg-violet-600 text-white text-xs font-medium shadow-lg shadow-violet-600/40 flex items-center gap-1.5 hover:bg-violet-500 transition-all animate-in fade-in zoom-in-90"
        >
          <span>New messages</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Chat Input */}
      <ChatInput onSendMessage={sendMessage} />
    </div>
  );
};
