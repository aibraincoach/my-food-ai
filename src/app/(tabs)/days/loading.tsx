import Link from "next/link";
import { TopBar } from "@/components/ui/TopBar";
import { Icon } from "@/components/ui/Icon";
import { tokens } from "@/lib/theme/tokens";

export default function Loading() {
  return <main className="flex flex-1 flex-col desktop:mx-auto desktop:w-full desktop:max-w-[1112px] desktop:px-4 desktop:pt-8">
    <TopBar className="sticky top-0 z-10 bg-surface desktop:hidden" title={<h1 className="text-month">Days</h1>}
      left={<Link href="/" className="flex min-h-tap items-center text-body" style={{marginLeft:-tokens.spacing["tooltip-y"]}}><Icon name="back" size={tokens.radii.pill} strokeWidth={tokens.icon.strongStroke} />Feed</Link>}
      right={<button type="button" disabled className="flex min-h-tap items-center gap-1 text-detail text-muted" style={{marginRight:-tokens.spacing.grid*2}}><span aria-hidden="true" className="inline-block h-4 w-[4ch] rounded bg-card" /><Icon name="chevron-down" /></button>} />
    <p role="status" className="px-screen-x text-detail text-muted">Loading…</p>
  </main>;
}
