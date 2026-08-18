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
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-6 rounded-sm border space-y-4"
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
          {loading ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

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

        <div className="text-center">
          <Link href="/" className="text-xs underline" style={{ color: 'var(--text-on-ink-dim)' }}>
            Back to feed
          </Link>
        </div>
      </form>
    </div>
  );
}