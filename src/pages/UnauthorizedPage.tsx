import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShieldAlert, LogOut, Info } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <Card className="glass-card border border-rose-500/30 shadow-2xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Access Restricted: Private Two-User Sanctuary
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
            The account <span className="font-mono text-violet-300 font-semibold">{currentUser?.email}</span> is
            authenticated, but is not on the authorized allowlist for this TogetherSpace instance.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-navy-900 border border-slate-800 text-left text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Info className="w-4 h-4 text-violet-400" />
              <span>How the Owner Configures Authorized Users:</span>
            </div>
            <p>
              TogetherSpace is strictly locked down via Firestore Security Rules and server configuration.
              To authorize this email address, specify it in your deployment environment variables:
            </p>
            <div className="bg-navy-950 p-2.5 rounded-lg font-mono text-[11px] text-violet-300 border border-slate-800 overflow-x-auto">
              VITE_AUTHORIZED_EMAIL_1=first_person@example.com<br />
              VITE_AUTHORIZED_EMAIL_2={currentUser?.email || 'second_person@example.com'}
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={logout}
              variant="secondary"
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out & Switch Account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
