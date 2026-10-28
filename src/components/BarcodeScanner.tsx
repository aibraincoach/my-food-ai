"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BarcodeProduct } from "@/lib/fdc/barcode";
import { formatNutrition } from "@/lib/nutrition/totals";

// Scans with @zxing/library (pure JavaScript), because iOS Safari ships with BarcodeDetector disabled.
// The decoder is loaded only when the camera is opened.
export default function BarcodeScanner() {
  const video = useRef<HTMLVideoElement>(null);
  const stop = useRef<() => void>(() => {});
  const lookup = useRef(0);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("");
  const [product, setProduct] = useState<BarcodeProduct | null>(null);

  const find = useCallback(async (code: string) => {
    const request = ++lookup.current;
    setStatus("Looking up the product…"); setProduct(null);
    try {
      const response = await fetch(`/api/fdc/barcode?code=${encodeURIComponent(code)}`);
      const body = await response.json().catch(() => ({})) as { product?: BarcodeProduct; error?: string };
      if (request !== lookup.current) return;
      if (!response.ok || !body.product) { setStatus(body.error ?? "Barcode lookup is temporarily unavailable."); return; }
      setProduct(body.product); setStatus("");
    } catch { if (request === lookup.current) setStatus("Barcode lookup is temporarily unavailable."); }
  }, []);

  const close = useCallback(() => { stop.current(); stop.current = () => {}; setScanning(false); }, []);
  useEffect(() => () => stop.current(), []);

  const open = async () => {
    setStatus("Starting the camera…"); setProduct(null);
    try {
      const { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } = await import("@zxing/library");
      const hints = new Map<import("@zxing/library").DecodeHintType, unknown>([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8]]]);
      const reader = new BrowserMultiFormatReader(hints);
      setScanning(true);
      let done = false;
      stop.current = () => { done = true; reader.reset(); };
      await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, video.current!, (result) => {
        if (done || !result) return;
        done = true; reader.reset(); setScanning(false);
        void find(result.getText());
      });
      setStatus("Point the camera at the barcode.");
    } catch {
      close();
      setStatus("The camera could not be opened. Allow camera access and try again.");
    }
  };

  const serving = product?.servingSize && product.servingSizeUnit?.toLowerCase() === "g" ? product.servingSize : null;
  const scale = (value: number | null, grams: number) => value === null ? "–" : formatNutrition(value * grams / 100);
  return <section aria-label="Scan a barcode" className="flex flex-col gap-3 px-screen-x pb-sheet-top text-detail">
    {scanning
      ? <button type="button" onClick={close} className="min-h-tap self-start text-text">Stop scanning</button>
      : <button type="button" onClick={() => { void open(); }} className="min-h-tap self-start text-text">Scan a barcode</button>}
    <video ref={video} muted playsInline aria-label="Camera" className={scanning ? "aspect-square w-full rounded-field object-cover" : "hidden"} />
    {status ? <p className="text-muted" role="status">{status}</p> : null}
    {product ? <div className="flex flex-col gap-2">
      <p className="text-body">{product.name}</p>
      {product.brand ? <p className="text-meta text-faint">{product.brand}</p> : null}
      <table className="w-full tabular-nums"><thead><tr className="text-left text-meta text-faint"><th scope="col"><span className="sr-only">Nutrient</span></th>{serving ? <th scope="col">Per serving ({serving} g{product.servingText ? `, ${product.servingText}` : ""})</th> : null}<th scope="col">Per 100 g</th></tr></thead>
        <tbody>{([["Calories", "calories", "kcal"], ["Protein", "protein_g", "g"], ["Carbs", "carbs_g", "g"], ["Fat", "fat_g", "g"], ["Fibre", "fibre_g", "g"], ["Sugar", "sugar_g", "g"], ["Sodium", "sodium_mg", "mg"]] as const).map(([label, key, unit]) =>
          <tr key={key}><th scope="row" className="py-1 text-left font-normal">{label}</th>{serving ? <td>{scale(product.per100g[key], serving)} {unit}</td> : null}<td>{product.per100g[key] === null ? "–" : formatNutrition(product.per100g[key])} {unit}</td></tr>)}</tbody></table>
    </div> : null}
  </section>;
}
