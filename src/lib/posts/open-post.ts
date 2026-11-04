'use client';

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/** Dispatch the provisional open frame, then navigate to the meal. */
export function openPost(id: string, href: string, router: AppRouterInstance): void {
  if (matchMedia("(min-width:1024px)").matches && document.querySelector("[data-desktop-workspace]")) {
    window.dispatchEvent(new CustomEvent("open-post", { detail: { id } }));
    return;
  }
  window.dispatchEvent(new CustomEvent("post-open-preview", { detail: { id, committed: true } }));
  router.push(href);
}
