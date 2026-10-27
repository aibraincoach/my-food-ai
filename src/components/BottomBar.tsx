"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SLOTS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/days", label: "Days" },
  { href: "/profile", label: "Profile" },
];

export default function BottomBar({ onPlus }: { onPlus: () => void }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-1/2 grid w-full max-w-[390px] -translate-x-1/2 grid-cols-5 border-t border-neutral-200 bg-white"
    >
      <BarLink href={SLOTS[0].href} label={SLOTS[0].label} active={pathname === "/"} />
      <BarLink
        href={SLOTS[1].href}
        label={SLOTS[1].label}
        active={pathname?.startsWith("/search") ?? false}
      />
      <button
        type="button"
        aria-label="Post a meal"
        onClick={onPlus}
        className="flex items-center justify-center py-3 text-2xl leading-none"
      >
        +
      </button>
      <BarLink
        href={SLOTS[2].href}
        label={SLOTS[2].label}
        active={pathname?.startsWith("/days") ?? false}
      />
      <BarLink
        href={SLOTS[3].href}
        label={SLOTS[3].label}
        active={pathname?.startsWith("/profile") ?? false}
      />
    </nav>
  );
}

function BarLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center justify-center py-3 text-sm ${
        active ? "font-semibold text-black" : "text-neutral-500"
      }`}
    >
      {label}
    </Link>
  );
}
