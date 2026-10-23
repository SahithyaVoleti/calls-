import React, { useEffect, useRef, useState } from 'react';
import { VideoOff, Move, Minimize2, Maximize2 } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

type CornerPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export const LocalVideoPreview: React.FC = () => {
  const { localStream, controlsState, callType } = useCall();
  const { userProfile, currentUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [position, setPosition] = useState<CornerPosition>('bottom-right');
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // If in voice call, we don't need a video preview card
  if (callType === 'voice' || controlsState.isAudioOnly) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4 sm:bottom-24 sm:right-6',
    'bottom-left': 'bottom-20 left-4 sm:bottom-24 sm:left-6',
    'top-right': 'top-20 right-4 sm:top-24 sm:right-6',
    'top-left': 'top-20 left-4 sm:top-24 sm:left-6',
  };

  const cyclePosition = () => {
    const positions: CornerPosition[] = ['bottom-right', 'bottom-left', 'top-left', 'top-right'];
    const nextIdx = (positions.indexOf(position) + 1) % positions.length;
    setPosition(positions[nextIdx]);
  };

  const displayName = userProfile?.displayName || currentUser?.displayName || 'You';

  return (
    <div
      className={`fixed z-30 transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden border border-white/15 bg-navy-900/90 backdrop-blur-md ${
        positionClasses[position]
      } ${isMinimized ? 'w-16 h-16' : 'w-36 h-48 sm:w-48 sm:h-64'}`}
    >
      {/* Position and Minimize Controls Bar */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-1">
        <button
          onClick={cyclePosition}
          className="p-1 text-slate-300 hover:text-white"
          title="Move preview position"
        >
          <Move className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setIsMinimized((prev) => !prev)}
          className="p-1 text-slate-300 hover:text-white"
          title={isMinimized ? 'Expand' : 'Minimize'}
        >
          {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isMinimized ? (
        <div className="w-full h-full flex items-center justify-center bg-navy-900 cursor-pointer" onClick={() => setIsMinimized(false)}>
          <Avatar
            src={userProfile?.photoURL || currentUser?.photoURL || undefined}
            name={displayName}
            size="sm"
          />
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center bg-navy-950">
          {controlsState.isCameraOff ? (
            <div className="flex flex-col items-center justify-center gap-2 p-2 text-center">
              <Avatar
                src={userProfile?.photoURL || currentUser?.photoURL || undefined}
                name={displayName}
                size="md"
              />
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <VideoOff className="w-3 h-3 text-rose-400" /> Camera Off
              </span>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}

          {/* Self label */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[11px] font-medium text-slate-200">
            {displayName} (You)
          </div>
        </div>
      )}
    </div>
  );
};
