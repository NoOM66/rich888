/**
 * Status Bars Progress & Victory Hook (STORY-004)
 * Pure function to apply resource deltas to the 4 status bars with clamping & completion flags.
 */

export interface StatusBars {
  money: number;
  health: number;
  happiness: number;
  education: number;
}

export interface StatusThresholds extends StatusBars {}

export interface StatusDeltas extends Partial<StatusBars> {}

export interface ApplyResult {
  bars: StatusBars; // new bars after clamp
  completionFlags: Record<keyof StatusBars, boolean>;
  debtOverdraft: boolean; // true when money would go below 0 before clamp
}

// Utility to round to 2 decimals (consistent with time system precision philosophy)
function round2(n: number): number { return parseFloat(n.toFixed(2)); }

function clamp(v: number, min: number, max: number): number {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

export function applyDeltas(
  current: StatusBars,
  deltas: StatusDeltas,
  thresholds: StatusThresholds,
  _multipliers?: Partial<Record<keyof StatusBars, number>>, // reserved for STORY-006 (ignored now)
): ApplyResult {
  // Immutability guard: never mutate inputs (treat them as readonly)
  // Validate thresholds (basic sanity) – minimal overhead
  for (const k of Object.keys(thresholds) as (keyof StatusBars)[]) {
    if (thresholds[k] <= 0) throw new Error(`threshold for ${k} must be > 0`);
  }

  const raw: StatusBars = { money: current.money, health: current.health, happiness: current.happiness, education: current.education };
  const applied: StatusBars = { ...raw } as StatusBars;

  // Apply deltas
  for (const k of Object.keys(deltas) as (keyof StatusBars)[]) {
    const delta = deltas[k] ?? 0;
    applied[k] = round2(applied[k] + delta);
  }

  // Overdraft check uses pre-clamp money
  const debtOverdraft = applied.money < 0;

  // Clamp all
  const clamped: StatusBars = {
    money: round2(clamp(applied.money, 0, thresholds.money)),
    health: round2(clamp(applied.health, 0, thresholds.health)),
    happiness: round2(clamp(applied.happiness, 0, thresholds.happiness)),
    education: round2(clamp(applied.education, 0, thresholds.education)),
  };

  const completionFlags: Record<keyof StatusBars, boolean> = {
    money: clamped.money === thresholds.money,
    health: clamped.health === thresholds.health,
    happiness: clamped.happiness === thresholds.happiness,
    education: clamped.education === thresholds.education,
  };

  return { bars: Object.freeze(clamped), completionFlags, debtOverdraft };
}
