"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { tokens } from "@/lib/theme/tokens";

const SLOTS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/days", label: "Days", icon: "days" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

export default function BottomBar({ onPlus }: { onPlus: () => void }) {
  const pathname = usePathname();
  const [feedEmpty, setFeedEmpty] = useState(false);
  useEffect(() => {
    const onFeedState = (event: Event) => {
      const detail = (event as CustomEvent<{ empty?: boolean }>).detail;
      if (typeof detail?.empty === "boolean") setFeedEmpty(detail.empty);
    };
    const onPostCreated = () => setFeedEmpty(false);
    window.addEventListener("feed-state", onFeedState);
    window.addEventListener("post-created", onPostCreated);
    window.dispatchEvent(new Event("feed-state-request"));
    return () => {
      window.removeEventListener("feed-state", onFeedState);
      window.removeEventListener("post-created", onPostCreated);
    };
  }, []);
  const empty = pathname === "/" && feedEmpty;
  const link = (slot: (typeof SLOTS)[number]) => {
    const active = slot.href === "/" ? pathname === "/" : pathname.startsWith(slot.href);
    return (
      <Link key={slot.href} href={slot.href} aria-label={slot.label} aria-current={active ? "page" : undefined}
        className={`flex h-full min-h-tap items-start justify-center pt-tooltip-y ${empty ? "text-faint" : "text-text"}`}>
        <Icon name={slot.icon} active={active && !empty} size={tokens.spacing.icon + tokens.icon.strongStroke} />
      </Link>
    );
  };
  return (
    <nav aria-label="Primary" className="fixed bottom-0 left-1/2 z-30 grid h-bar-safe w-full max-w-phone -translate-x-1/2 grid-cols-5 border-t border-hairline bg-surface">
      {link(SLOTS[0])}
      {link(SLOTS[1])}
      <div className="relative flex items-start justify-center">
        {empty ? <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 pb-screen-x whitespace-nowrap">
          <Tooltip>Photograph a meal</Tooltip>
        </div> : null}
        <button type="button" aria-label="Post a meal" onClick={onPlus}
          className={`-mt-tooltip-y flex h-tap w-tap items-center justify-center rounded-circle ${empty ? "bg-accent text-white" : "bg-surface text-text"}`}
          style={empty
            ? { boxShadow: `0 0 0 ${tokens.spacing['tooltip-offset']}px ${tokens.colors['accent-halo']}` }
            : { border: `${tokens.icon.strongStroke - tokens.border.hairline / 2}px solid ${tokens.colors.text}` }}>
          <Icon name="plus" />
        </button>
      </div>
      {link(SLOTS[2])}
      {link(SLOTS[3])}
    </nav>
  );
}
