// node --import tsx --env-file=.env.local --test tests/barcode.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { BarcodeFormat, BinaryBitmap, DecodeHintType, HybridBinarizer, MultiFormatReader, RGBLuminanceSource } from "@zxing/library";
import { gtinCandidates, lookupBarcode, productFromFood, validGtin } from "../src/lib/fdc/barcode.ts";

test("check digits are verified and EAN-13 forms of a UPC-A are mapped back to 12 digits", () => {
  assert.equal(validGtin("016000275683"), true);
  assert.equal(validGtin("016000275684"), false);
  assert.equal(validGtin("abc"), false);
  assert.deepEqual(gtinCandidates("016000275683"), ["016000275683"]);
  assert.deepEqual(gtinCandidates("0016000275683"), ["0016000275683", "016000275683"]);
  assert.deepEqual(gtinCandidates("0016000275684"), []);
  assert.deepEqual(gtinCandidates(""), []);
});

test("a product needs usable nutrition, and values come from the per-100 g nutrient ids", () => {
  const food = { fdcId: 1, description: "X", brandOwner: "B", servingSize: 27, servingSizeUnit: "g", foodNutrients: [
    { nutrientId: 1008, value: 370 }, { nutrientId: 1003, value: 3.7 }, { nutrientId: 1004, value: 5.56 }, { nutrientId: 1005, value: 85.19 }] };
  const product = productFromFood(food, "016000275683");
  assert.equal(product.per100g.calories, 370);
  assert.equal(product.per100g.fibre_g, null);
  assert.equal(product.brand, "B");
  assert.equal(productFromFood({ ...food, foodNutrients: [{ nutrientId: 1093, value: 5 }] }, "x"), null);
  assert.equal(productFromFood(null, "x"), null);
});

// UPC-A is rendered here as bars and decoded by the same JavaScript decoder the page loads, no BarcodeDetector involved.
const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const R = L.map((code) => [...code].map((bit) => (bit === "0" ? "1" : "0")).join(""));
function upcBits(code) {
  return "101" + [...code.slice(0, 6)].map((d) => L[d]).join("") + "01010" + [...code.slice(6)].map((d) => R[d]).join("") + "101";
}
function decodeImage(code) {
  const bits = "0".repeat(12) + upcBits(code) + "0".repeat(12);
  const scale = 3, width = bits.length * scale, height = 60;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const value = bits[Math.floor(x / scale)] === "1" ? 0 : 255, at = (y * width + x) * 4;
    pixels.set([value, value, value, 255], at);
  }
  const reader = new MultiFormatReader();
  reader.setHints(new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.UPC_A, BarcodeFormat.EAN_13]]]));
  const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(new Uint8ClampedArray(Array.from({ length: width * height }, (_, i) => pixels[i * 4])), width, height)));
  return reader.decode(bitmap).getText();
}

test("the JavaScript decoder reads a UPC-A barcode image", () => {
  const text = decodeImage("016000275683");
  assert.ok(gtinCandidates(text).includes("016000275683"), text);
});

test("a live FDC Branded Foods lookup by gtin_upc returns usable nutrition", { skip: !process.env.FDC_API_KEY }, async () => {
  const product = await lookupBarcode("016000275683");
  assert.ok(product, "FDC returned no product");
  assert.equal(product.gtin, "016000275683");
  assert.match(product.name, /corn puffs/i);
  assert.ok(product.per100g.calories > 100 && product.per100g.calories < 600, String(product.per100g.calories));
  assert.equal(product.servingSize, 27);
  assert.equal(await lookupBarcode("0016000275683").then((p) => p?.fdcId), product.fdcId, "EAN-13 form finds the same product");
});

test("an unknown but valid code finds nothing", { skip: !process.env.FDC_API_KEY }, async () => {
  assert.equal(await lookupBarcode("038000138416"), null);
});
