// Pure GTIN helpers, safe for the browser and the server.
// GS1 check digit over all digits but the last.
export function validGtin(code: string): boolean {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  const digits = [...code].map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

// The forms FDC may hold for one scanned code, most likely first. Returns [] for anything that is not a valid GTIN.
export function gtinCandidates(raw: string): string[] {
  const code = raw.trim();
  if (!validGtin(code)) return [];
  const out = [code];
  if (code.length === 13 && code.startsWith("0")) out.push(code.slice(1));
  if (code.length === 14 && code.startsWith("00")) out.push(code.slice(2));
  if (code.length === 14 && code.startsWith("0")) out.push(code.slice(1));
  // FDC also stores some codes zero-padded to 14 digits.
  if (code.length < 14) out.push(code.padStart(14, "0"));
  return [...new Set(out)];
}

// The same product code written with different zero padding (UPC-A, EAN-13, GTIN-14 with a 0 indicator).
export const sameGtin = (a: string, b: string): boolean => /^\d+$/.test(a) && /^\d+$/.test(b) && a.replace(/^0+/, "") === b.replace(/^0+/, "");


// A UPC-E (8 digits, number system 0 or 1) is a compressed UPC-A; FDC stores the 12-digit form. A genuine EAN-8
// looks the same by length alone, so only the scanner, which knows the decoded format, calls this.
export function expandUpcE(code: string): string | null {
  if (!/^[01]\d{7}$/.test(code)) return null;
  const [system, d2, d3, d4, d5, d6, d7] = code;
  const check = code[7];
  const body = "012".includes(d7) ? `${d2}${d3}${d7}0000${d4}${d5}${d6}`
    : d7 === "3" ? `${d2}${d3}${d4}00000${d5}${d6}`
    : d7 === "4" ? `${d2}${d3}${d4}${d5}00000${d6}`
    : `${d2}${d3}${d4}${d5}${d6}0000${d7}`;
  const expanded = `${system}${body}${check}`;
  return validGtin(expanded) ? expanded : null;
}
