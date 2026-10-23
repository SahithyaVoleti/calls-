import React from 'react';
import { useCall } from '../../context/CallContext';
import { usePresence } from '../../context/PresenceContext';
import { RemoteVideoView } from './RemoteVideoView';
import { LocalVideoPreview } from './LocalVideoPreview';
import { CallControls } from './CallControls';
import { ChatPanel } from '../chat/ChatPanel';
import { Avatar } from '../ui/Avatar';
import { PhoneOff, Video, Phone } from 'lucide-react';

export const CallOverlay: React.FC = () => {
  const {
    callStatus,
    callType,
    controlsState,
    endCall,
    toggleInCallChat,
    errorMessage,
    clearError,
  } = useCall();
  const { partnerDisplayName, partnerAvatarUrl } = usePresence();

  // If call is idle or incoming dialog is active, overlay is hidden
  if (callStatus === 'idle' || callStatus === 'incoming_ringing') {
    return null;
  }

  const isVideo = callType === 'video';

  return (
    <div className="fixed inset-0 z-40 bg-navy-950 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Active Call Canvas */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center">
        {/* Calling / Ringing Outgoing State */}
        {callStatus === 'outgoing_calling' && (
          <div className="flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="relative mb-6">
              <div className="absolute -inset-4 rounded-full bg-violet-600/30 animate-ping" />
              <div className="absolute -inset-8 rounded-full border border-violet-500/20 animate-pulse" />
              <Avatar
                src={partnerAvatarUrl}
                name={partnerDisplayName}
                size="2xl"
                className="ring-4 ring-violet-500/40 shadow-2xl relative z-10"
              />
            </div>

            <h2 className="text-2xl font-bold text-white">{partnerDisplayName}</h2>
            <p className="text-sm text-violet-300 mt-1 flex items-center justify-center gap-1.5 font-medium">
              {isVideo ? (
                <>
                  <Video className="w-4 h-4 text-violet-400" /> Calling with Video...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 text-violet-400" /> Calling with Voice...
                </>
              )}
            </p>

            {/* Cancel Call Button */}
            <div className="mt-10">
              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition-all"
                title="Cancel Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <span className="block text-xs text-slate-400 mt-2 font-medium">Cancel</span>
            </div>
          </div>
        )}

        {/* Transitioning or Status Feedback Screens (Declined, Busy, Ended, Missed) */}
        {(callStatus === 'declined' ||
          callStatus === 'busy' ||
          callStatus === 'ended' ||
          callStatus === 'missed') && (
          <div className="flex flex-col items-center justify-center p-6 text-center z-20 animate-in zoom-in-95 duration-200">
            <Avatar
              src={partnerAvatarUrl}
              name={partnerDisplayName}
              size="xl"
              className="ring-2 ring-slate-700 shadow-xl mb-4 opacity-75"
            />
            <h3 className="text-xl font-bold text-white">
              {callStatus === 'declined' && 'Call Declined'}
              {callStatus === 'busy' && 'Partner is Busy'}
              {callStatus === 'ended' && 'Call Ended'}
              {callStatus === 'missed' && 'Partner Did Not Answer'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Disconnecting session...</p>
          </div>
        )}

        {/* Connected or Connecting View */}
        {(callStatus === 'connected' || callStatus === 'connecting') && (
          <>
            <RemoteVideoView />
            <LocalVideoPreview />

            {/* In-Call Chat Drawer (Right-docked on desktop, full overlay on mobile) */}
            {controlsState.isChatOpen && (
              <div className="absolute top-4 right-4 bottom-24 w-80 sm:w-96 z-30 shadow-2xl animate-in slide-in-from-right duration-200">
                <ChatPanel onClose={toggleInCallChat} isDrawer={true} />
              </div>
            )}
          </>
        )}

        {/* Bottom Floating Controls Bar */}
        {(callStatus === 'connected' || callStatus === 'connecting') && (
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center z-30 px-4 pointer-events-auto">
            <CallControls />
          </div>
        )}
      </div>

      {/* Floating Error Toast */}
      {errorMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-rose-600/90 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2">
          <span>{errorMessage}</span>
          <button onClick={clearError} className="underline text-white font-semibold ml-2">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
