/**
 * Obligations Tracking & Penalty Effects (STORY-005)
 * evaluateObligations(activityLog, obligationConfig[]) -> Penalty summary
 */
import { ActivityLogEntry } from '../activity/activityExec.js';

export interface ObligationConfig {
  id: string;              // unique id of obligation
  tag: string;             // tag to search in executed activities
  frequencyPerWeek: number; // required occurrences (>= meets)
  penaltyType: string;     // grouping key for stacking cap
  penaltyValue: number;    // value contributed if missed
  capPerCategory: number;  // maximum appliedValue for this penaltyType overall
}

export interface PenaltyEntry {
  type: string;
  value: number;        // raw aggregated missing total for this type
  appliedValue: number; // after cap
}

export interface ObligationEvaluationResult {
  missed: string[]; // obligation ids missed
  penalties: PenaltyEntry[];
  reportSummary: { missedCount: number; types: number; totalApplied: number };
}

export function evaluateObligations(
  activityLog: ActivityLogEntry[],
  obligationConfig: ObligationConfig[]
): ObligationEvaluationResult {
  // Build tag frequency from executed activities (OK or ADJUSTED only count)
  const tagCounts: Record<string, number> = {};
  for (const entry of activityLog) {
    if (entry.status === 'OK' || entry.status === 'ADJUSTED') {
      const tags = entry.tags || [];
      for (const t of tags) {
        tagCounts[t] = (tagCounts[t] ?? 0) + 1;
      }
    }
  }

  const missed: string[] = [];
  interface Agg { total: number; cap: number; }
  const agg: Record<string, Agg> = {};

  for (const ob of obligationConfig) {
    if (ob.frequencyPerWeek === 0) continue; // disabled
    const count = tagCounts[ob.tag] ?? 0;
    if (count < ob.frequencyPerWeek) {
      missed.push(ob.id);
      if (!agg[ob.penaltyType]) {
        agg[ob.penaltyType] = { total: 0, cap: ob.capPerCategory };
      } else {
        // choose the minimum cap encountered (conservative) to avoid exceeding any config's cap
        agg[ob.penaltyType].cap = Math.min(agg[ob.penaltyType].cap, ob.capPerCategory);
      }
      agg[ob.penaltyType].total += ob.penaltyValue;
    }
  }

  const penalties: PenaltyEntry[] = Object.entries(agg).map(([type, { total, cap }]) => ({
    type,
    value: total,
    appliedValue: total > cap ? cap : total,
  }));

  // Stable sort by type for determinism
  penalties.sort((a, b) => a.type.localeCompare(b.type));

  const totalApplied = penalties.reduce((s, p) => s + p.appliedValue, 0);
  const reportSummary = { missedCount: missed.length, types: penalties.length, totalApplied };

  // Convert to plain mutable array instances (still no external reference) then freeze container
  const missedOut = [...missed];
  const penaltiesOut = penalties.map(p => ({ ...p }));
  return Object.freeze({
    missed: missedOut,
    penalties: penaltiesOut,
    reportSummary,
  });
}
