import { Suspense } from "react";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col p-4">
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading feed…</p>}>
        <EmptyFeed />
      </Suspense>
    </main>
  );
}

function EmptyFeed() {
  return <p className="text-sm text-neutral-500">Post your first meal</p>;
}
