// Render only fixed public copy, never provider bodies or stored diagnostics.
export function failureMessage(reason?: string | null): string {
  if (reason?.startsWith("fdc:")) return "The food database was busy. Try again in a minute.";
  if (reason?.startsWith("meta:")) return "The analysis service refused this request. Try again.";
  return "This photo could not be analysed.";
}
