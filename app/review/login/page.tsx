'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/review');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1220] text-[#EDE7DA]">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm p-6 rounded border border-white/10 bg-white/[0.02] space-y-4"
      >
        <h1 className="font-serif text-2xl mb-2">Chanakya Lens — Review</h1>

        {error && (
          <div className="px-3 py-2 rounded border border-red-400/30 bg-red-400/10 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-[#8A93A6]">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-[#C97B4A] text-[#0B1220] font-medium hover:bg-[#D98857] disabled:opacity-40"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}