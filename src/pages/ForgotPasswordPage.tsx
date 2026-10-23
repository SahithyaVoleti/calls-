import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your authorized email.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err: any) {
      console.error('[ForgotPassword] Error:', err);
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-violet-600/30 border border-violet-400/30 mx-auto mb-4">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Reset Password
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Enter your authorized email to receive a password reset link.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="glass-card border border-white/10 shadow-2xl p-6 sm:p-8">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Reset Link Sent</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check your inbox at <span className="text-violet-300 font-mono">{email}</span> for instructions to reset your password.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="secondary" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="Authorized Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-authorized-email@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2"
              >
                Send Reset Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
