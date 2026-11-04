"use client";
// retry() re-fetches the server render; reset() would only re-show the cached error.
export default function TabsError({retry}: {error: unknown; retry: () => void}) {
  return <main className="flex flex-1 flex-col">
    <header className="flex h-top-safe items-center bg-surface px-inset"><h1 className="text-title">My Food AI</h1></header>
    <div className="px-screen-x py-sheet-top"><p role="alert" className="text-detail text-muted">This page could not be loaded.</p>
      <button type="button" onClick={() => retry()} className="mt-sheet-top min-h-tap rounded-full bg-text px-inset text-surface">Try again</button>
    </div>
  </main>;
}
