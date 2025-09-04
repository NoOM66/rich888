/**
 * Week Summary & Reporting (STORY-009)
 * Pure aggregation of execution + penalties + finance + upgrades
 */
import { ActivityLogEntry } from '../activity/activityExec.js';

export interface PenaltyEntry { type: string; appliedValue: number; }
export interface FinanceChanges { moneyDelta: number; loanInterest?: number; penaltiesApplied?: number; }
export interface UpgradeApplied { id: string; cost: number; benefit?: Record<string, number>; }

export interface WeekSummaryInput {
  executionLog: ActivityLogEntry[];
  penalties: PenaltyEntry[];
  finance?: FinanceChanges;
  upgradesApplied: UpgradeApplied[];
  maxEntries?: number; // if log length > maxEntries -> group
}

export interface ResourceTotals { [k: string]: number; }

export interface UpgradeROIEntry { id: string; roi: number; }

export interface WeekSummaryResult {
  resourceTotals: ResourceTotals;
  penaltiesApplied: PenaltyEntry[];
  advisoryMessages: string[];
  upgradeROI: UpgradeROIEntry[];
  grouped: boolean;
  groupedCategories?: { category: string; money?: number; health?: number; happiness?: number; education?: number }[];
}

export function buildWeekSummary(input: WeekSummaryInput): WeekSummaryResult {
  const resourceTotals: ResourceTotals = {}; // sum of rewards across log
  for (const entry of input.executionLog) {
    for (const [k, v] of Object.entries(entry.rewards)) {
      resourceTotals[k] = (resourceTotals[k] ?? 0) + v;
    }
  }

  const penaltiesApplied = [...input.penalties];

  // advisory: net progression (sum of positive resourceTotals minus negatives) < 0 -> Consider Upgrades
  const netProgression = Object.values(resourceTotals).reduce((a, b) => a + b, 0);
  const advisoryMessages: string[] = [];
  if (netProgression < 0) advisoryMessages.push('Consider Upgrades');

  // Upgrade ROI: benefit deltaBenefit / cost (if benefit exists and cost>0)
  const upgradeROI: UpgradeROIEntry[] = [];
  for (const u of input.upgradesApplied) {
    if (u.cost > 0 && u.benefit) {
      const deltaBenefit = Object.values(u.benefit).reduce((a, b) => a + b, 0);
      const roi = deltaBenefit / u.cost;
      upgradeROI.push({ id: u.id, roi: parseFloat(roi.toFixed(4)) });
    }
  }

  // Grouping check
  const maxEntries = input.maxEntries ?? Infinity;
  const grouped = input.executionLog.length > maxEntries;
  let groupedCategories: WeekSummaryResult['groupedCategories'];
  if (grouped) {
    // Simple category grouping by first segment of activity id before ':' or '-' (fallback 'misc')
    const catAgg: Record<string, ResourceTotals> = {};
    for (const e of input.executionLog) {
      const cat = e.id.split(/[:\-]/)[0] || 'misc';
      if (!catAgg[cat]) catAgg[cat] = {};
      for (const [k,v] of Object.entries(e.rewards)) {
        catAgg[cat][k] = (catAgg[cat][k] ?? 0) + v;
      }
    }
    groupedCategories = Object.entries(catAgg).map(([category, vals]) => ({ category, ...vals }));
    groupedCategories.sort((a,b)=>a.category.localeCompare(b.category));
  }

  return { resourceTotals, penaltiesApplied, advisoryMessages, upgradeROI, grouped, groupedCategories };
}
