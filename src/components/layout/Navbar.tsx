import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { UserProfileModal } from '../dashboard/UserProfileModal';
import {
  LogOut,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const displayName = userProfile?.displayName || currentUser?.displayName || 'Authorized User';

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-navy-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 border border-violet-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Together<span className="text-violet-400">Space</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  Private 2-User
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Dedicated WebRTC & Firestore Sanctuary
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-800">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/5 transition-all text-left group"
                title="Edit your profile"
              >
                <Avatar
                  src={userProfile?.photoURL || currentUser?.photoURL || undefined}
                  name={displayName}
                  size="sm"
                  isOnline={true}
                />
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-violet-300 transition-colors">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                    {currentUser?.email}
                  </div>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
