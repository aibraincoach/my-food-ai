import { SignOutButton } from "@/components/SignOutButton";

export default function Loading() {
  return <main className="flex flex-1 flex-col desktop:pt-2"><header className="flex h-top-safe shrink-0 items-center justify-between gap-3 px-screen-x desktop:h-[72px] desktop:gap-5 desktop:px-0"><span className="hidden desktop:flex desktop:size-[72px] desktop:shrink-0 desktop:rounded-circle desktop:bg-card" aria-hidden="true" /><h1 className="truncate text-title desktop:flex-1 desktop:text-[24px]">Profile</h1><SignOutButton /></header><p role="status" className="px-screen-x text-detail text-muted">Loading…</p></main>;
}
