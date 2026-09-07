import { supabase } from "./supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ADMIN_EMAIL = "chanakya.lab1@gmail.com";

async function isAdminRequest(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const serverSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // no-op -- we're only reading, not modifying the session here
          },
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
    if (isAdmin) return; // don't count our own visits

    await supabase.from("page_views").insert({ path });
  } catch {
    // silently ignore — never let analytics break a page render
  }
}
