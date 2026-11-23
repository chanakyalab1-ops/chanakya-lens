import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// The signed-in user for a request (Server Component or route handler), or null.
export async function getSessionUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Session refresh is handled by proxy.ts.
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
