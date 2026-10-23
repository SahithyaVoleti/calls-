import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = 'Write a message... (Enter to send, Shift+Enter for new line)',
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || disabled) return;

    try {
      setIsSending(true);
      await onSendMessage(trimmed);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('[ChatInput] Send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex items-end gap-2 p-3 bg-navy-900/90 border-t border-slate-800/80 rounded-b-2xl">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSending}
          rows={1}
          maxLength={2500}
          className="w-full bg-navy-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none max-h-36 leading-relaxed transition-all"
        />
        {text.length > 2000 && (
          <span className="absolute bottom-1 right-2 text-[10px] text-amber-400 font-mono">
            {2500 - text.length}
          </span>
        )}
      </div>

      <button
        onClick={handleSend}
        disabled={!text.trim() || isSending || disabled}
        className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-600/30 transition-all shrink-0 active:scale-95"
        title="Send Message"
      >
        {isSending ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};
