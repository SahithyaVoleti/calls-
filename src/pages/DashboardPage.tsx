import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { useCall } from '../context/CallContext';
import { useChat } from '../context/ChatContext';
import { PartnerCard } from '../components/dashboard/PartnerCard';
import { RecentMessagesWidget } from '../components/dashboard/RecentMessagesWidget';
import { ChatPanel } from '../components/chat/ChatPanel';
import { Card } from '../components/ui/Card';
import {
  Video,
  Phone,
  ShieldCheck,
  Infinity as InfinityIcon,
  Mic,
  Camera,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const { partnerDisplayName } = usePresence();
  const { startCall, errorMessage, clearError } = useCall();
  const { unreadCount } = useChat();

  const [activeTab, setActiveTab] = useState<'overview' | 'chat'>('overview');

  const displayName = userProfile?.displayName || currentUser?.displayName || 'Authorized User';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1 flex flex-col">
      {/* Global Error Banner if any */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={clearError}
            className="text-xs uppercase font-bold tracking-wider underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hello, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Your private two-user communication sanctuary is live and connected.
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-violet-600/15 border border-violet-500/30 text-violet-300 text-xs font-medium flex items-center gap-1.5">
            <InfinityIcon className="w-3.5 h-3.5 text-violet-400" />
            <span>No Artificial Limits</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>P2P Encrypted</span>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center bg-navy-900 border border-slate-800 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Call & Overview
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`relative flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'chat'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Chat Stream</span>
          {unreadCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-violet-400 text-navy-950 text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Grid: Split Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 flex-1">
        {/* Left Column: Partner Card & Quick Action Hub */}
        <div
          className={`lg:col-span-5 flex flex-col gap-6 ${
            activeTab === 'overview' ? 'block' : 'hidden lg:flex'
          }`}
        >
          <PartnerCard />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quick Video Call Card */}
            <div
              onClick={() => startCall('video')}
              className="glass-card p-4 rounded-2xl border border-violet-500/20 hover:border-violet-500/50 cursor-pointer group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 group-hover:bg-violet-600 group-hover:text-white flex items-center justify-center transition-all mb-3">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                Video Meeting
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Start HD camera session with {partnerDisplayName}.
              </p>
            </div>

            {/* Quick Voice Call Card */}
            <div
              onClick={() => startCall('voice')}
              className="glass-card p-4 rounded-2xl border border-violet-500/20 hover:border-violet-500/50 cursor-pointer group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all mb-3">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Voice Only
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Mic-only audio call without camera request.
              </p>
            </div>
          </div>

          {/* Recent Messages Preview */}
          <RecentMessagesWidget />

          {/* System & Device Readiness Card */}
          <Card className="text-xs text-slate-400">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sanctuary Status</span>
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Mic className="w-3.5 h-3.5 text-violet-400" /> Microphone Access
                </span>
                <span className="text-emerald-400 font-medium">Ready</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Camera className="w-3.5 h-3.5 text-violet-400" /> Camera Access
                </span>
                <span className="text-emerald-400 font-medium">Ready</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Call Duration Policy</span>
                <span className="text-violet-300 font-mono">No Artificial Cutoff</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-300">Allowlist Enforced</span>
                <span className="text-emerald-400 font-mono">Firestore Rules Active</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Full Real-Time Chat Stream */}
        <div
          className={`lg:col-span-7 flex flex-col h-[650px] lg:h-[720px] ${
            activeTab === 'chat' ? 'block' : 'hidden lg:flex'
          }`}
        >
          <ChatPanel />
        </div>
      </div>
    </div>
  );
};
