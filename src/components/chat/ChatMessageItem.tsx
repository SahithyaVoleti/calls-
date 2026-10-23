import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { type ChatMessage } from '../../types';
import { Avatar } from '../ui/Avatar';
import { CheckCheck, Clock } from 'lucide-react';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const { currentUser } = useAuth();
  const isSelf = message.senderId === currentUser?.uid;

  // Format time (e.g. 2:45 PM)
  const formatTime = (ts: any) => {
    if (!ts) return 'Just now';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex items-end gap-2.5 my-2.5 ${isSelf ? 'justify-end' : 'justify-start'}`}>
      {!isSelf && (
        <Avatar
          src={message.senderAvatar}
          name={message.senderName}
          size="sm"
          className="mb-1 shrink-0"
        />
      )}

      <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
        {!isSelf && (
          <span className="text-[11px] text-slate-400 font-medium ml-1 mb-1">
            {message.senderName}
          </span>
        )}

        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-md select-text ${
            isSelf
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-xs'
              : 'bg-navy-800 text-slate-100 border border-slate-700/80 rounded-bl-xs'
          }`}
        >
          {message.text}
        </div>

        {/* Timestamp and delivery checkmark */}
        <div className={`flex items-center gap-1 text-[10px] text-slate-500 mt-1 ${isSelf ? 'mr-1' : 'ml-1'}`}>
          <span>{formatTime(message.timestamp)}</span>
          {isSelf && (
            <span>
              {message.status === 'sending' ? (
                <Clock className="w-2.5 h-2.5 text-slate-500 animate-spin" />
              ) : (
                <CheckCheck className="w-3 h-3 text-violet-300" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
