import { Suspense } from "react";
import Feed from "@/components/Feed";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col p-4">
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading feed…</p>}>
        <Feed />
      </Suspense>
    </main>
  );
}
