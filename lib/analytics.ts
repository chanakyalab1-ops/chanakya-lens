import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

const ADMIN_EMAIL = "chanakya.lab1@gmail.com";

async function isAdminRequest(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const serverSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data } = await serverSupabase.auth.getUser();
    return data.user?.email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

export async function logPageView(path: string) {
  try {
    const isAdmin = await isAdminRequest();
    if (isAdmin) return;

    const cookieStore = await cookies();
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") ?? null;
    const referrer = headersList.get("referer") ?? null;

    const serverSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    await serverSupabase.from("page_views").insert({ path, user_agent: userAgent, referrer });
  } catch {
    // silently ignore
  }
}