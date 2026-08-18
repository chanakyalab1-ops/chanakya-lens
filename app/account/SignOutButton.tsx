'use client';

import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm px-4 py-2 rounded-sm border"
      style={{ borderColor: 'var(--border)' }}
    >
      Sign out
    </button>
  );
}