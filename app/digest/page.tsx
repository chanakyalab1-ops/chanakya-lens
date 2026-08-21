import NavDrawer from "@/components/NavDrawer";
import DigestSignup from "@/components/DigestSignup";

export default function DigestPage() {
  return (
    <>
      <NavDrawer />
      <div className="max-w-2xl mx-auto px-5 pt-12 pb-16 text-center">
        <div className="font-mono text-[0.64rem] uppercase tracking-widest mb-3" style={{ color: "var(--text-on-ink-dim)" }}>
          Coming soon
        </div>
        <h1 className="font-display font-bold text-2xl mb-4">Weekly digest</h1>
        <p className="text-[0.9rem] leading-relaxed mb-8" style={{ color: "var(--text-body)" }}>
          A weekly email covering what mattered, traced by region — pick the regions you care about and we will send the signal, not the noise.
        </p>
        <DigestSignup />
      </div>
    </>
  );
}