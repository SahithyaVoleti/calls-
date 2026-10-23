import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MailCheck, RefreshCw, LogOut, CheckCircle, AlertCircle } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const { currentUser, resendVerification, logout } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    try {
      setIsSending(true);
      setError(null);
      await resendVerification();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleReload = async () => {
    if (currentUser) {
      await currentUser.reload();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="glass-card border border-white/10 shadow-2xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
            <MailCheck className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Verify Your Email
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            A confirmation link was sent to{' '}
            <span className="font-mono text-violet-300 font-semibold">{currentUser?.email}</span>.
            Please click the link in your inbox to complete verification.
          </p>

          {success && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Verification email resent successfully!</span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button
              onClick={handleReload}
              variant="primary"
              className="w-full"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              I've Verified My Email
            </Button>

            <Button
              onClick={handleResend}
              variant="secondary"
              isLoading={isSending}
              className="w-full"
            >
              Resend Verification Email
            </Button>

            <Button
              onClick={logout}
              variant="ghost"
              className="w-full text-slate-400"
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
