// Mask PNGs for item 8. Each region's raster becomes a transparent
// full-photo-size PNG with a white outline; item 17 renders these as
// the coloured outline layer. Pure buffers here; uploads live in
// analyze.ts so this module needs no database or storage client.
import { PNG } from "pngjs";
import type { FoodRegion, RegionBox } from "@/lib/meta/sam";

const OUTLINE = 255;
const OUTLINE_THICKNESS_PX = 2;

function isBoundary(
  raster: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number
): boolean {
  if (raster[y * width + x] !== 1) return false;
  if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return true;
  return (
    raster[y * width + (x - 1)] === 0 ||
    raster[y * width + (x + 1)] === 0 ||
    raster[(y - 1) * width + x] === 0 ||
    raster[(y + 1) * width + x] === 0
  );
}

// The raster covers the box; map each raster pixel to photo pixels,
// scaling in case the raster is smaller than the box.
export function outlinePngFromRegion(
  region: FoodRegion,
  photoWidth: number,
  photoHeight: number
): Buffer {
  const png = new PNG({ width: photoWidth, height: photoHeight });
  const box: RegionBox = region.box;
  const boxWidth = Math.max(1, box.right - box.left);
  const boxHeight = Math.max(1, box.bottom - box.top);
  const toPhoto = (rx: number, ry: number): [number, number] => [
    Math.round(box.left + ((rx + 0.5) * boxWidth) / region.rasterWidth),
    Math.round(box.top + ((ry + 0.5) * boxHeight) / region.rasterHeight),
  ];
  const paint = (px: number, py: number): void => {
    for (let dx = 0; dx < OUTLINE_THICKNESS_PX; dx += 1) {
      for (let dy = 0; dy < OUTLINE_THICKNESS_PX; dy += 1) {
        const x = px + dx;
        const y = py + dy;
        if (x < 0 || y < 0 || x >= photoWidth || y >= photoHeight) continue;
        const i = (y * photoWidth + x) * 4;
        png.data[i] = OUTLINE;
        png.data[i + 1] = OUTLINE;
        png.data[i + 2] = OUTLINE;
        png.data[i + 3] = OUTLINE;
      }
    }
  };
  for (let ry = 0; ry < region.rasterHeight; ry += 1) {
    for (let rx = 0; rx < region.rasterWidth; rx += 1) {
      if (!isBoundary(region.raster, region.rasterWidth, region.rasterHeight, rx, ry)) {
        continue;
      }
      const [px, py] = toPhoto(rx, ry);
      paint(px, py);
    }
  }
  return PNG.sync.write(png);
}
