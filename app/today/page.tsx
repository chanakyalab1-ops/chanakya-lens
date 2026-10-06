import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import NavDrawer from "@/components/NavDrawer";
import { CompactCard, MobileRow, SignalPanel } from "@/components/Feed";
import { getAllStories } from "@/lib/stories";
import { pickTodaysSignal, recentWindow } from "@/lib/signal";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Today's Signal",
  description: "Everything published in the last day on Chanakya Lens, with the stories that matter most on top.",
};

export default async function TodayPage() {
  const all = await getAllStories();
  const recent = recentWindow(all);
  const today = recent.stories;
  const signal = pickTodaysSignal(all).filter((s) => today.some((t) => t.slug === s.slug));
  const rest = today.filter((s) => !signal.some((t) => t.slug === s.slug));

  return (
    <>
      <NavDrawer />
      <main className="max-w-7xl mx-auto px-4 pt-6 pb-16">
        <header className="mb-6">
          <h1>
            <span className="sr-only">Today&apos;s Signal</span>
            <Image src="/todays-signal-logo.png" alt="Today's Signal" width={924} height={162} priority className="logo-for-light h-auto w-full max-w-[420px]" />
            <Image src="/todays-signal-logo-dark.png" alt="Today's Signal" width={924} height={162} priority className="logo-for-dark h-auto w-full max-w-[420px]" />
          </h1>
          <p className="font-mono text-[0.72rem] mt-3" style={{ color: "var(--text-on-ink-dim)" }}>
            {today.length} {today.length === 1 ? "story" : "stories"} in the {recent.label}
          </p>
        </header>

        {today.length === 0 ? (
          <div className="rounded-sm border p-5 text-[0.9rem]" style={{ background: "var(--ink-card)", borderColor: "var(--border)", color: "var(--text-body)" }}>
            Nothing has been published in the last 2 days. New stories land through the day.{" "}
            <Link href="/" className="underline" style={{ color: "var(--brand-soft)" }}>
              See the latest stories →
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[360px_1fr] lg:gap-8 lg:items-start">
            {signal.length > 0 && (
              <div className="mb-8 lg:mb-0 lg:sticky lg:top-4">
                <SignalPanel stories={signal} plainHeading />
              </div>
            )}

            {rest.length > 0 && (
              <section>
                <h2 className="font-display font-bold text-xl mb-3">Also today</h2>
                <div className="md:hidden">
                  {rest.map((story) => (
                    <MobileRow key={story.slug} story={story} />
                  ))}
                </div>
                <div className="hidden md:grid md:grid-cols-2 gap-2.5">
                  {rest.map((story) => (
                    <CompactCard key={story.slug} story={story} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </>
  );
}
