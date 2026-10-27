import { Suspense } from "react";
import Feed from "@/components/Feed";
import DayBubblesPlaceholder from "@/components/DayBubblesPlaceholder";

export default function Home() {
  return <main className="flex flex-1 flex-col">
    <header className="flex h-top-h items-center px-screen-x"><h1 className="text-title">My Food AI</h1></header>
    <DayBubblesPlaceholder />
    <Suspense fallback={<p className="px-screen-x text-detail text-muted">Loading feed…</p>}>
      <Feed />
    </Suspense>
  </main>;
}
