import React from 'react';
import { Video, Phone, MessageSquare, Shield, Clock } from 'lucide-react';
import { usePresence } from '../../context/PresenceContext';
import { useCall } from '../../context/CallContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const PartnerCard: React.FC = () => {
  const {
    partnerProfile,
    isPartnerOnline,
    isPartnerInCall,
    partnerDisplayName,
    partnerAvatarUrl,
    lastSeenText,
  } = usePresence();

  const { startCall, callStatus } = useCall();
  const { setIsChatOpen } = useChat();

  const isBusy = isPartnerInCall || callStatus !== 'idle';

  return (
    <Card className="relative overflow-hidden group border border-violet-500/20 hover:border-violet-500/40 transition-all shadow-2xl">
      {/* Ambient gradient glow in the card header */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-violet-600/15 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Availability Badge */}
        <div className="self-end mb-2">
          {isPartnerInCall ? (
            <Badge variant="incall">In Call</Badge>
          ) : isPartnerOnline ? (
            <Badge variant="online">Available</Badge>
          ) : (
            <Badge variant="offline">Offline</Badge>
          )}
        </div>

        {/* Partner Avatar */}
        <div className="relative mb-4">
          <Avatar
            src={partnerAvatarUrl}
            name={partnerDisplayName}
            size="2xl"
            isOnline={isPartnerOnline}
            className="ring-4 ring-violet-500/20 shadow-xl"
          />
        </div>

        {/* Partner Name and Email */}
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {partnerDisplayName}
        </h3>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          {partnerProfile?.email || 'Authorized Partner'}
        </p>

        {/* Status text */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3 font-medium">
          {isPartnerOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {lastSeenText}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {lastSeenText}
            </span>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-6">
          {/* Video Call */}
          <Button
            onClick={() => startCall('video')}
            disabled={isBusy}
            variant="primary"
            leftIcon={<Video className="w-4 h-4" />}
            className="w-full shadow-lg shadow-violet-600/20"
          >
            Video Call
          </Button>

          {/* Voice Call */}
          <Button
            onClick={() => startCall('voice')}
            disabled={isBusy}
            variant="secondary"
            leftIcon={<Phone className="w-4 h-4" />}
            className="w-full"
          >
            Voice Call
          </Button>

          {/* Open Chat */}
          <Button
            onClick={() => setIsChatOpen(true)}
            variant="glass"
            leftIcon={<MessageSquare className="w-4 h-4" />}
            className="w-full"
          >
            Chat
          </Button>
        </div>

        {/* Security / Privacy reassurance banner */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mt-5 pt-4 border-t border-slate-800/80 w-full">
          <Shield className="w-3.5 h-3.5 text-violet-400" />
          <span>Encrypted WebRTC P2P direct channel</span>
        </div>
      </div>
    </Card>
  );
};
