'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function AccountLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = supabaseBrowser();

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push('/account');
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setMessage('Check your email to confirm your account, then sign in.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: 'var(--ink)', color: 'var(--text-on-ink)' }}>
      <div className="w-full max-w-sm space-y-4">
        <div
          className="p-6 rounded-sm border space-y-4"
          style={{ borderColor: 'var(--border)', background: 'var(--ink-card)' }}
        >
          <h1 className="font-display text-2xl font-bold">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h1>

          {error && (
            <div className="px-3 py-2 rounded-sm border border-red-400/30 bg-red-400/10 text-red-300 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="px-3 py-2 rounded-sm border border-[color:var(--brand-soft)]/30 bg-[color:var(--brand-soft)]/10 text-sm" style={{ color: 'var(--brand-soft)' }}>
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-2 rounded-sm font-medium border flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ borderColor: 'var(--border)', background: 'white', color: '#1F1F1F' }}
          >
            <svg viewBox="0 0 18 18" className="h-4 w-4">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
            </svg>
            {googleLoading ? 'Working...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="font-mono text-[0.62rem] uppercase tracking-wide" style={{ color: 'var(--text-on-ink-dim)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--text-on-ink-dim)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full bg-white/[0.03] border rounded-sm px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--text-on-ink-dim)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full bg-white/[0.03] border rounded-sm px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-sm font-medium disabled:opacity-40"
              style={{ background: 'var(--brand-soft)', color: 'var(--ink)' }}
            >
              {loading ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="text-sm text-center" style={{ color: 'var(--text-on-ink-dim)' }}>
            {mode === 'signin' ? (
              <>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setMessage(null);
                  }}
                  className="underline"
                  style={{ color: 'var(--brand-soft)' }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setMessage(null);
                  }}
                  className="underline"
                  style={{ color: 'var(--brand-soft)' }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs underline" style={{ color: 'var(--text-on-ink-dim)' }}>
            Back to feed
          </Link>
        </div>
      </div>
    </div>
  );
}