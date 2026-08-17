import { createClient } from '@supabase/supabase-js';

// Server-only client, service role key. This bypasses RLS, so it must never
// be imported from a Client Component and SUPABASE_SERVICE_ROLE_KEY must
// never be exposed to the browser (no NEXT_PUBLIC_ prefix on that one).
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.',
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}