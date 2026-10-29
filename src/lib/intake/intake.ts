// Water and caffeine are logged as intake only. This module never defines a target, a goal or a remainder.
export type IntakeKind = "water" | "caffeine";
export interface IntakeRow { kind: IntakeKind; amount: number; logged_at: string }
export interface IntakeTotals { water: number; caffeine: number }

export const INTAKE = {
  water: { label: "Water", unit: "ml", preset: 250, max: 5000 },
  caffeine: { label: "Caffeine", unit: "mg", preset: 95, max: 1000 },
} as const;

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
