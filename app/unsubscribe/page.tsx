"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("t") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error" | "sent">("idle");

  async function handleUnsubscribe() {
    setStatus("loading");
    try {
      const res = await fetch(`/api/unsubscribe?email=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (!email) {
    return <p style={{ color: "var(--text-body)" }}>Missing email address.</p>;
  }

  if (!token && status !== "done") {
    return (
      <>
        <h1 className="font-display font-bold text-2xl mb-4">Unsubscribe from the digest</h1>
        <p className="text-[0.9rem] mb-6" style={{ color: "var(--text-body)" }}>
          This link is out of date. We will email a fresh unsubscribe link to {email}.
        </p>
        <button
          onClick={async () => {
            setStatus("loading");
            await fetch("/api/unsubscribe/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => {});
            setStatus("sent");
          }}
          disabled={status === "loading" || status === "sent"}
          className="px-6 py-2.5 rounded-full font-semibold text-sm"
          style={{ background: "var(--developing)", color: "white" }}
        >
          {status === "sent" ? "Check your inbox" : "Email me a link"}
        </button>
      </>
    );
  }

  if (status === "done") {
    return (
      <>
        <h1 className="font-display font-bold text-2xl mb-4">You&apos;ve been unsubscribed</h1>
        <p className="text-[0.9rem] mb-6" style={{ color: "var(--text-body)" }}>
          {email} will no longer receive the Chanakya Lens daily digest.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display font-bold text-2xl mb-4">Unsubscribe from the digest?</h1>
      <p className="text-[0.9rem] mb-6" style={{ color: "var(--text-body)" }}>
        {email} will stop receiving the Chanakya Lens daily digest.
      </p>
      <button
        onClick={handleUnsubscribe}
        disabled={status === "loading"}
        className="px-6 py-2.5 rounded-full font-semibold text-sm"
        style={{ background: "var(--developing)", color: "white" }}
      >
        {status === "loading" ? "Unsubscribing..." : "Yes, unsubscribe me"}
      </button>
      {status === "error" && (
        <p className="text-xs mt-3" style={{ color: "var(--developing)" }}>
          Something went wrong -- try again.
        </p>
      )}
    </>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="max-w-lg mx-auto px-5 pt-16 pb-16 text-center">
      <Suspense fallback={<p>Loading...</p>}>
        <UnsubscribeContent />
      </Suspense>
      <div className="mt-8">
        <Link href="/" className="text-[0.78rem] underline" style={{ color: "var(--brand-soft)" }}>
          Back to chanakyalens.com
        </Link>
      </div>
    </div>
  );
}
