import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '../../context/CallContext';
import { usePresence } from '../../context/PresenceContext';
import { Avatar } from '../ui/Avatar';
import { Wifi, Loader2 } from 'lucide-react';

export const RemoteVideoView: React.FC = () => {
  const { remoteStream, callType, callStatus, connectionState, formattedDuration } = useCall();
  const { partnerDisplayName, partnerAvatarUrl } = usePresence();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  useEffect(() => {
    if (remoteStream) {
      // Connect to video element
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
      }
      // Connect to audio element to ensure audio is always playing
      if (audioRef.current) {
        audioRef.current.srcObject = remoteStream;
      }

      // Check if video tracks are active
      const checkVideo = () => {
        const vTracks = remoteStream.getVideoTracks();
        setHasRemoteVideo(vTracks.length > 0 && vTracks.some((t) => t.enabled && t.readyState === 'live'));
      };

      checkVideo();
      remoteStream.onaddtrack = checkVideo;
      remoteStream.onremovetrack = checkVideo;
    } else {
      setHasRemoteVideo(false);
    }
  }, [remoteStream]);

  const isVoiceOnly = callType === 'voice' || !hasRemoteVideo;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-navy-950 overflow-hidden select-none">
      {/* Hidden audio element ensures clean audio playback */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* Video Element (shown when partner's video is transmitting) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-contain ${isVoiceOnly ? 'hidden' : 'block'}`}
      />

      {/* Voice-only or Camera-off Avatar Canvas */}
      {isVoiceOnly && (
        <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="relative mb-6">
            {/* Ambient soundwave pulses */}
            {callStatus === 'connected' && (
              <>
                <div className="absolute -inset-4 rounded-full bg-violet-600/20 animate-ring-wave" />
                <div className="absolute -inset-8 rounded-full bg-indigo-600/10 animate-ring-wave delay-300" />
              </>
            )}

            <Avatar
              src={partnerAvatarUrl}
              name={partnerDisplayName}
              size="2xl"
              className="ring-4 ring-violet-500/30 shadow-2xl relative z-10"
            />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">{partnerDisplayName}</h2>
          <p className="text-sm text-violet-300 mt-1 font-medium">
            {callType === 'voice' ? 'Voice Call' : 'Video Call (Camera Off)'}
          </p>

          {/* Connection status note */}
          <div className="mt-4 px-3 py-1 rounded-full bg-navy-900/80 border border-slate-700/60 text-xs text-slate-300">
            {callStatus === 'connected' ? `Connected • ${formattedDuration}` : 'Connecting...'}
          </div>
        </div>
      )}

      {/* Top Floating Status Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
        <div className="px-3.5 py-1.5 rounded-full bg-navy-900/80 backdrop-blur-md border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-2 shadow-lg">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionState === 'connected'
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-amber-400 animate-ping'
            }`}
          />
          <span>{partnerDisplayName}</span>
          <span className="text-slate-500">•</span>
          <span className="font-mono text-violet-300">{formattedDuration}</span>
        </div>

        {/* Quality indicator */}
        <div className="px-3 py-1.5 rounded-full bg-navy-900/80 backdrop-blur-md border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 shadow-lg">
          {connectionState === 'connected' ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-slate-300">HD Direct</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-amber-300">Connecting</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
