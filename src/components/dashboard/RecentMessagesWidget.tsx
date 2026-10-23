import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';

export const RecentMessagesWidget: React.FC = () => {
  const { messages, loadingMessages, setIsChatOpen } = useChat();
  const { currentUser } = useAuth();

  const recent = messages.slice(-4).reverse();

  const formatTime = (ts: any) => {
    if (!ts) return 'Just now';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Recent Messages</h3>
              <p className="text-[11px] text-slate-400">Private synchronized history</p>
            </div>
          </div>

          <button
            onClick={() => setIsChatOpen(true)}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Open Chat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message Items */}
        <div className="space-y-3 mt-3">
          {loadingMessages ? (
            <div className="space-y-2 py-4">
              <div className="h-10 bg-navy-800/60 rounded-xl animate-pulse" />
              <div className="h-10 bg-navy-800/60 rounded-xl animate-pulse" />
            </div>
          ) : recent.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <span>No messages sent yet. Say hello!</span>
            </div>
          ) : (
            recent.map((msg) => {
              const isSelf = msg.senderId === currentUser?.uid;
              return (
                <div
                  key={msg.id}
                  onClick={() => setIsChatOpen(true)}
                  className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <Avatar
                    src={msg.senderAvatar}
                    name={msg.senderName}
                    size="sm"
                    className="shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-violet-300 transition-colors">
                        {isSelf ? 'You' : msg.senderName}
                      </span>
                      <span className="text-[10px] text-slate-500">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/80 mt-4 flex items-center justify-between text-[11px] text-slate-500">
        <span>Persistent Cloud Firestore</span>
        <button
          onClick={() => setIsChatOpen(true)}
          className="text-violet-400 hover:underline font-medium"
        >
          View all messages
        </button>
      </div>
    </Card>
  );
};
