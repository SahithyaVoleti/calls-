import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../ui/Avatar';

export const IncomingCallDialog: React.FC = () => {
  const { incomingCall, acceptCall, declineCall } = useCall();

  if (!incomingCall) return null;

  const isVideo = incomingCall.type === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed backdrop */}
      <div className="fixed inset-0 bg-navy-950/85 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Ringing Modal Card */}
      <div className="relative w-full max-w-sm glass-card border border-violet-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        {/* Pulsing Avatar Container */}
        <div className="relative inline-block my-4">
          <div className="absolute inset-0 rounded-full bg-violet-600/30 animate-ping" />
          <div className="absolute -inset-2 rounded-full border border-violet-500/40 animate-pulse" />
          <Avatar
            src={incomingCall.callerAvatar}
            name={incomingCall.callerName}
            size="2xl"
            className="ring-4 ring-violet-500/40 shadow-xl"
          />
        </div>

        {/* Caller Info */}
        <h3 className="text-xl font-bold text-white mt-2">
          {incomingCall.callerName}
        </h3>
        <p className="text-sm text-violet-300 mt-1 flex items-center justify-center gap-1.5 font-medium">
          {isVideo ? (
            <>
              <Video className="w-4 h-4 text-violet-400" /> Incoming Video Call...
            </>
          ) : (
            <>
              <Phone className="w-4 h-4 text-violet-400" /> Incoming Voice Call...
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {/* Decline */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={declineCall}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition-all"
              title="Decline Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-xs text-slate-400 font-medium">Decline</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/50 active:scale-95 transition-all ring-4 ring-emerald-500/20"
              title="Accept Call"
            >
              {isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
            </button>
            <span className="text-xs text-emerald-400 font-semibold">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};
