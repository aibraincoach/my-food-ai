import type { CSSProperties } from "react";

export const PHONE_PHOTO_CAP = "80dvh";
type Size = { width?: number | null; height?: number | null } | null | undefined;
const ratio = (size: Size) => size?.width && size.width > 0 && size?.height && size.height > 0
  ? { w: size.width, h: size.height } : { w: 1, h: 1 };

// Stored dimensions reserve the same uncropped box before either image loads.
export function photoBoxStyle(size: Size, cap = `var(--detail-photo-cap, ${PHONE_PHOTO_CAP})`): CSSProperties {
  const { w, h } = ratio(size);
  return { aspectRatio: `${w} / ${h}`, maxHeight: cap, width: `min(100%, calc(${cap} * ${w} / ${h}))`, marginInline: "auto" };
}
export function desktopPhotoVars(size: Size): CSSProperties {
  const { w, h } = ratio(size);
  return { "--photo-w": w, "--photo-h": h } as CSSProperties;
}
