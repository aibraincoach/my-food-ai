"use client";

import { useState } from "react";

// A signed photo URL can expire while the page stays open. A broken image is
// dropped so the cell underneath (its day number) stays readable.
export default function SafeImage({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={className} onError={() => setFailed(true)} />;
}
