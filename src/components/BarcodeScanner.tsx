"use client";

import { expandUpcE } from "@/lib/fdc/gtin";

// Reused by the live capture viewfinder and a single photo/library decode.
// Loading the decoder never requests a second camera stream.
let decoder: Promise<typeof import("@zxing/library")> | undefined;
export function loadBarcodeDecoder() {
  return decoder ??= import("@zxing/library");
}

export async function decodeBarcode(source: HTMLVideoElement | HTMLImageElement): Promise<string | null> {
  const zx = await loadBarcodeDecoder();
  const width = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const height = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
  if (!width || !height) return null;
  // Bound the work per live frame and per photo. Barcode detection never uploads image bytes.
  const scale = Math.min(1, 1280 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const reader = new zx.MultiFormatReader();
  reader.setHints(new Map([[zx.DecodeHintType.POSSIBLE_FORMATS, [zx.BarcodeFormat.UPC_A, zx.BarcodeFormat.UPC_E, zx.BarcodeFormat.EAN_13, zx.BarcodeFormat.EAN_8]]]));
  for (let rotation = 0; rotation < 2; rotation++) {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const gray = new Uint8ClampedArray(canvas.width * canvas.height);
    for (let i = 0; i < gray.length; i++) gray[i] = (pixels[i * 4] * 306 + pixels[i * 4 + 1] * 601 + pixels[i * 4 + 2] * 117) >> 10;
    try {
      const result = reader.decode(new zx.BinaryBitmap(new zx.HybridBinarizer(new zx.RGBLuminanceSource(gray, canvas.width, canvas.height))));
      const code = result.getText();
      return result.getBarcodeFormat() === zx.BarcodeFormat.UPC_E ? expandUpcE(code) ?? code : code;
    } catch (error) {
      if (!(error instanceof zx.NotFoundException || error instanceof zx.ChecksumException || error instanceof zx.FormatException)) throw error;
    } finally { reader.reset(); }
    const rotated = document.createElement("canvas");
    rotated.width = canvas.height; rotated.height = canvas.width;
    const next = rotated.getContext("2d");
    if (!next) break;
    next.translate(rotated.width, 0); next.rotate(Math.PI / 2); next.drawImage(canvas, 0, 0);
    canvas.width = rotated.width; canvas.height = rotated.height; context.drawImage(rotated, 0, 0);
  }
  return null;
}

export async function decodeBarcodeFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return await decodeBarcode(image);
  } finally { URL.revokeObjectURL(url); }
}
