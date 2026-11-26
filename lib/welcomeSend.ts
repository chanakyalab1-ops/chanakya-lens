import { supabaseServer } from "./supabase-server";
import { brevoConfigured, resendConfigured, sendEmail } from "./emailSend";
import { welcomeEmailHtml, type WelcomeOptions } from "./welcomeEmail";

// Sends the welcome email to a member. Never throws: a failed email must not undo a
// payment or a redeemed gift.
export async function sendWelcomeEmail(userId: string, opts: WelcomeOptions = {}): Promise<void> {
  try {
    const provider = brevoConfigured() ? "brevo" : resendConfigured() ? "resend" : null;
    if (!provider) return;
    const { data } = await supabaseServer().auth.admin.getUserById(userId);
    const email = data?.user?.email;
    if (!email) return;
    await sendEmail({ to: email, subject: "Welcome to Lens+", html: welcomeEmailHtml(opts) }, provider);
  } catch {
    // best effort
  }
}
