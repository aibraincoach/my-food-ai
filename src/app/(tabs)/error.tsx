"use client";
export default function FeedError({reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return <main className="flex flex-1 flex-col">
    <header className="flex h-top-safe items-center bg-surface px-inset"><h1 className="text-title">My Food AI</h1></header>
    <div className="px-screen-x py-sheet-top"><p role="alert" className="text-detail text-muted">The feed could not be loaded.</p>
      <button type="button" onClick={reset} className="mt-sheet-top min-h-tap rounded-full bg-text px-inset text-surface">Try again</button>
    </div>
  </main>;
}
