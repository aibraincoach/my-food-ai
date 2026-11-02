"use client";
import {useSyncExternalStore} from "react";
const query = "(min-width: 1024px)";
const read = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches;
const server = () => false;
const subscribe = (listener: () => void) => {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(query);
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }
  media.addListener(listener);
  return () => media.removeListener(listener);
};
export function useDesktop() { return useSyncExternalStore(subscribe, read, server); }
