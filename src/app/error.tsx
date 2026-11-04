"use client";
import Link from "next/link";
export default function AppError({retry}: {error: unknown; retry: () => void}) {
  return <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface">
    <header className="flex h-top-safe items-center px-inset"><h1 className="text-title">My Food AI</h1></header>
    <div className="px-screen-x py-sheet-top"><p role="alert" className="text-detail text-muted">This page could not be loaded.</p>
      <div className="mt-sheet-top flex items-center gap-4"><button type="button" onClick={() => retry()} className="min-h-tap rounded-full bg-text px-inset text-surface">Try again</button><Link href="/" className="min-h-tap content-center text-detail">Back to the feed</Link></div>
    </div>
  </main>;
}
