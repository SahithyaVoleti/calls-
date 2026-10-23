import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MessageSquare,
  Volume2,
} from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { useChat } from '../../context/ChatContext';

export const CallControls: React.FC = () => {
  const {
    callType,
    controlsState,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    switchToAudioOnly,
    toggleInCallChat,
    endCall,
  } = useCall();

  const { unreadCount } = useChat();
  const isVideo = callType === 'video' && !controlsState.isAudioOnly;

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl glass-panel border border-white/10 shadow-2xl backdrop-blur-xl">
      {/* Microphone Toggle */}
      <button
        onClick={toggleMic}
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
          controlsState.isMicMuted
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
            : 'bg-navy-800 text-slate-200 border border-slate-700 hover:bg-navy-750 hover:text-white'
        }`}
        title={controlsState.isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
      >
        {controlsState.isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Camera Toggle (Video Call Only) */}
      {callType === 'video' && (
        <button
          onClick={toggleCamera}
          disabled={controlsState.isAudioOnly}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            controlsState.isCameraOff || controlsState.isAudioOnly
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-navy-800 text-slate-200 border border-slate-700 hover:bg-navy-750 hover:text-white'
          } ${controlsState.isAudioOnly ? 'opacity-40 cursor-not-allowed' : ''}`}
          title={controlsState.isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {controlsState.isCameraOff || controlsState.isAudioOnly ? (
            <VideoOff className="w-5 h-5" />
          ) : (
            <Video className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Switch to Audio Only (when in video call and not already audio-only) */}
      {isVideo && (
        <button
          onClick={switchToAudioOnly}
          className="hidden sm:flex w-12 h-12 rounded-xl items-center justify-center bg-navy-800 text-slate-200 border border-slate-700 hover:bg-navy-750 hover:text-white transition-all"
          title="Switch to Audio Only"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      )}

      {/* Screen Share (Only when supported and in video call) */}
      {callType === 'video' && (
        <button
          onClick={toggleScreenShare}
          className={`hidden md:flex w-12 h-12 rounded-xl items-center justify-center transition-all ${
            controlsState.isScreenSharing
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'bg-navy-800 text-slate-200 border border-slate-700 hover:bg-navy-750 hover:text-white'
          }`}
          title={controlsState.isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
        >
          <MonitorUp className="w-5 h-5" />
        </button>
      )}

      {/* In-Call Chat Drawer Toggle */}
      <button
        onClick={toggleInCallChat}
        className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
          controlsState.isChatOpen
            ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
            : 'bg-navy-800 text-slate-200 border border-slate-700 hover:bg-navy-750 hover:text-white'
        }`}
        title="Toggle In-Call Chat"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && !controlsState.isChatOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-navy-950 animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* End Call Button */}
      <button
        onClick={endCall}
        className="w-14 h-12 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition-all ml-1 sm:ml-2 font-medium"
        title="End Call"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  );
};
