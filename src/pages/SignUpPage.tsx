import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { isEmailConfiguredAllowed } from '../utils/allowlist';
import { Sparkles, Mail, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!displayName.trim() || !trimmedEmail || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    // Allowlist check upfront
    if (!isEmailConfiguredAllowed(trimmedEmail)) {
      setErrorMessage(
        'This email address is not in the authorized two-user list for TogetherSpace. Please use the email configured by the application owner.'
      );
      return;
    }

    try {
      setIsLoading(true);
      await signUp({
        email: trimmedEmail,
        pass: password,
        displayName: displayName.trim(),
      });
      navigate('/');
    } catch (err: any) {
      console.error('[SignUpPage] Error:', err);
      let msg = err.message || 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please sign in instead.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-violet-600/30 border border-violet-400/30 mx-auto mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create Authorized Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Join TogetherSpace using one of the two designated allowlist emails.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="glass-card border border-white/10 shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Input
              label="Your Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jordan"
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Authorized Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="authorized-email@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Register & Enter
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold underline">
                Sign In
              </Link>
            </p>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-6 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Strict two-user private security enforced</span>
        </div>
      </div>
    </div>
  );
};
