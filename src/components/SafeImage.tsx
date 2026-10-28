"use client";

import { useState } from "react";

// A signed photo URL can expire while the page stays open. A failed URL is
// dropped so the cell underneath stays readable; a refreshed URL gets a fresh try.
export default function SafeImage({ src, className }: { src: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={className} onError={() => setFailedSrc(src)} />;
}
