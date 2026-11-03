// Water and caffeine are logged as intake only. This module never defines a target, a goal or a remainder.
export type IntakeKind = "water" | "caffeine";
export interface IntakeRow { kind: IntakeKind; amount: number; logged_at: string }
export interface IntakeTotals { water: number; caffeine: number }

export const INTAKE = {
  water: { label: "Water", unit: "ml", preset: 250, max: 5000 },
  caffeine: { label: "Caffeine", unit: "mg", preset: 95, max: 1000 },
} as const;

// Defaults shared by the sheet and server; clients send a tile index and an optional allowed size.
export const DRINK_TILES = [
  { name: "Water", size: "glass", ml: 250, kind: "water", caffeineMg: 0 },
  { name: "Coffee", size: "cup", ml: 240, kind: "caffeine", caffeineMg: 95 },
  { name: "Espresso", size: "double", ml: 60, kind: "caffeine", caffeineMg: 126 },
  { name: "Tea", size: "mug", ml: 300, kind: "caffeine", caffeineMg: 45 },
  { name: "Coca-Cola", size: "can", ml: 330, kind: "caffeine", caffeineMg: 32 },
  { name: "Water", size: "bottle", ml: 500, kind: "water", caffeineMg: 0 },
] as const;

// Labels are server-owned. Water labels remain compatible with migration 0037.
export const TILE_SIZES: ReadonlyArray<ReadonlyArray<{ml: number; word: string}>> = [
  [{ml: 250, word: "glass"}, {ml: 500, word: "glass"}, {ml: 750, word: "glass"}],
  [{ml: 240, word: "cup"}, {ml: 350, word: "large"}],
  [{ml: 30, word: "single"}, {ml: 60, word: "double"}],
  [{ml: 300, word: "mug"}, {ml: 450, word: "large"}],
  [{ml: 330, word: "can"}, {ml: 500, word: "bottle"}],
  [{ml: 500, word: "bottle"}, {ml: 1000, word: "bottle"}],
];

export const emptyIntake = (): IntakeTotals => ({ water: 0, caffeine: 0 });

export const isIntakeKind = (kind: unknown): kind is IntakeKind => kind === "water" || kind === "caffeine";

export function validIntake(kind: unknown, amount: unknown): boolean {
  return isIntakeKind(kind) && typeof amount === "number" && Number.isInteger(amount) && amount >= 1 && amount <= INTAKE[kind].max;
}

export function sumIntake(rows: IntakeRow[]): IntakeTotals {
  const totals = emptyIntake();
  for (const row of rows) if (isIntakeKind(row.kind) && validIntake(row.kind, row.amount)) totals[row.kind] += row.amount;
  return totals;
}

// One total per local day; `dayOf` turns an instant into the reader's local YYYY-MM-DD.
export function groupIntakeByDay(rows: IntakeRow[], dayOf: (instant: string) => string): Map<string, IntakeTotals> {
  const days = new Map<string, IntakeTotals>();
  for (const row of rows) {
    if (!isIntakeKind(row.kind) || !validIntake(row.kind, row.amount)) continue;
    const day = dayOf(row.logged_at);
    const totals = days.get(day) ?? emptyIntake();
    totals[row.kind] += row.amount;
    days.set(day, totals);
  }
  return days;
}

// "Water 750 ml · Caffeine 95 mg": what was logged, nothing about what should have been.
export function intakeLine(totals: IntakeTotals, { includeZero = false }: { includeZero?: boolean } = {}): string {
  return (["water", "caffeine"] as const)
    .filter((kind) => includeZero || totals[kind] > 0)
    .map((kind) => `${INTAKE[kind].label} ${totals[kind]} ${INTAKE[kind].unit}`)
    .join(" · ");
}

// Custom coffee uses the existing intake table's whole 1–1000 mg bounds.
export function customCoffeeCaffeine(ml: number): number | null {
  if (!Number.isInteger(ml) || ml < 1 || ml > 5000) return null;
  const mg = Math.round(ml * 95 / 240);
  return mg >= 1 && mg <= 1000 ? mg : null;
}
