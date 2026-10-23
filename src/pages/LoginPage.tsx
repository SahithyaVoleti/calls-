import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Sparkles, Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await login(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      console.error('[LoginPage] Login error:', err);
      let msg = err.message || 'Failed to sign in.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please try again later or reset your password.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background subtle gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-violet-600/30 border border-violet-400/30 mx-auto mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome to Together<span className="text-violet-400">Space</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Private, encrypted video, voice and messaging for two.
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
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-authorized-email@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Need to create an authorized account?{' '}
              <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-semibold underline">
                Sign Up
              </Link>
            </p>
          </div>
        </Card>

        {/* Private Sanctuary Security Note */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-6 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Restricted to configured allowlist accounts only</span>
        </div>
      </div>
    </div>
  );
};
