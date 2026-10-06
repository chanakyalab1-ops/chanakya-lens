import Link from "next/link";
import NavDrawer from "@/components/NavDrawer";

// A 404 should not carry the site's canonical or be indexed.
export const metadata = {
  title: "Page not found | Chanakya Lens",
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <>
      <NavDrawer />
      <main className="max-w-2xl mx-auto px-5 pt-16 pb-24 text-center">
        <h1 className="font-display font-bold text-3xl mb-3">Page not found</h1>
        <p className="text-[0.95rem] mb-6" style={{ color: "var(--text-body)" }}>
          That page doesn&apos;t exist or has moved.
        </p>
        <Link href="/" className="underline" style={{ color: "var(--brand-soft)" }}>
          Back to the latest stories
        </Link>
      </main>
    </>
  );
}
