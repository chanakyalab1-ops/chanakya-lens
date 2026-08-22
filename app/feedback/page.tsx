import NavDrawer from "@/components/NavDrawer";
import FeedbackForm from "@/components/FeedbackForm";

export default function FeedbackPage() {
  return (
    <>
      <NavDrawer />
      <div className="max-w-2xl mx-auto px-5 pt-12 pb-16 text-center">
        <div className="font-mono text-[0.64rem] uppercase tracking-widest mb-3" style={{ color: "var(--text-on-ink-dim)" }}>
          Talk to us
        </div>
        <h1 className="font-display font-bold text-2xl mb-4">Feedback</h1>
        <p className="text-[0.9rem] leading-relaxed mb-8" style={{ color: "var(--text-body)" }}>
          Something broken, something missing, something you just want to tell us -- we read every message.
        </p>
        <FeedbackForm />
      </div>
    </>
  );
}