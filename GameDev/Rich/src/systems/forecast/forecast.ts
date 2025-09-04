/**
 * Forecast & Planning Preview (STORY-008)
 * Pure simulation (no side effects) of a tentative activity + travel plan.
 */
import { ActivityDef } from '../activity/activityExec.js';
import { WeekState, getRemaining } from '../time/weekState.js';
import { computeTravel, TravelConfig, DistanceMatrix } from '../travel/travelCalc.js';
import { ObligationConfig, evaluateObligations } from '../status/obligations.js';
import { FinanceState, evaluateInvestments } from '../finance/finance.js';

export interface ForecastInput {
  week: WeekState; // current immutable week state
  tentativeActivities: ActivityDef[];
  obligationTags: string[]; // required tags to satisfy obligations
  obligationConfigs?: ObligationConfig[]; // if provided will project penalties
  travel?: {
    locations: string[]; // if provided, compute travel time
    matrix: DistanceMatrix;
    config: TravelConfig;
  };
  multipliers?: {
    activityReward?: number; // same semantics as rewardMultiplier in executePlan
    activityTimeEfficiency?: number; // same semantics as timeEfficiencyMultiplier
    travelTimeEfficiency?: number; // applied by passing into travel config clone
  };
  // If provided, auto derive multipliers from upgrade multipliers map (higher precedence than manual passed above?)
  upgradeMultipliers?: Record<string, number>; // e.g. { reward:0.12, activityTimeEfficiency:0.05, travel:0.08 }
  financePreview?: {
    state: FinanceState; // current finance state (money ignored here)
    currentWeek: number; // for investment value preview
    includeInvestments?: boolean;
  };
}

export interface ForecastResult {
  netDeltas: Record<string, number>;
  expectedCost: number; // sum of cost fields if present
  timeUsage: { activityTime: number; travelTime: number; total: number };
  warnings: string[]; // e.g. OVER_TIME, MISSING_EAT
  travelOk: boolean;
  projectedPenalties?: { totalApplied: number; types: number; missed: string[] };
  projectedInvestmentValues?: Record<string, number>;
}

export function simulatePlan(input: ForecastInput): ForecastResult {
  const warnings: string[] = [];
  const net: Record<string, number> = { money: 0, health: 0, happiness: 0, education: 0 };
  let activityTime = 0;
  let travelTime = 0;
  let expectedCost = 0;
  // Auto-wire: prefer explicit multipliers.m field else derive from upgradeMultipliers keys
  const derivedReward = input.upgradeMultipliers?.reward ?? 0;
  const derivedActTime = input.upgradeMultipliers?.activityTimeEfficiency ?? 0;
  const derivedTravelEff = input.upgradeMultipliers?.travel ?? 0;
  const rewardMult = Math.max(0, input.multipliers?.activityReward ?? derivedReward);
  const timeEff = Math.max(0, input.multipliers?.activityTimeEfficiency ?? derivedActTime);

  // Activities forecast (no allocation, just arithmetic)
  for (const a of input.tentativeActivities) {
    const adjustedTime = +(a.timeCost * (1 - timeEff)).toFixed(2);
    activityTime += adjustedTime;
    // rewards
    for (const [k, v] of Object.entries(a.rewards)) {
      const base = v ?? 0;
      const boosted = +(base * (1 + rewardMult)).toFixed(2);
      net[k] = (net[k] ?? 0) + boosted;
    }
    if ((a as any).cost) expectedCost += (a as any).cost;
  }
  activityTime = +activityTime.toFixed(2);

  // Travel forecast
  let travelOk = true;
  if (input.travel) {
  const cfg = { ...input.travel.config, travelTimeEfficiencyMultiplier: input.multipliers?.travelTimeEfficiency ?? derivedTravelEff };
    const rem = getRemaining(input.week);
    const travelRes = computeTravel(input.travel.locations, input.travel.matrix, cfg, input.week, rem);
    if (travelRes.ok) {
      travelTime = travelRes.value.totalTravelTime;
    } else {
      warnings.push(travelRes.error.code === 'NOT_ENOUGH_TIME' ? 'TRAVEL_NOT_POSSIBLE' : 'INVALID_ROUTE');
      travelOk = false;
    }
  }
  const total = +(activityTime + travelTime).toFixed(2);

  // Project penalties if configs provided (simulate as if all tentative activities succeed)
  let projectedPenalties: ForecastResult['projectedPenalties'];
  if (input.obligationConfigs && input.obligationConfigs.length) {
    // Build a pseudo log from tentative activities (assume OK status)
    const pseudoLog = input.tentativeActivities.map((a, idx) => ({
      id: a.id,
      startOrder: idx,
      timeCost: a.timeCost,
      rewards: a.rewards as Record<string, number>,
      status: 'OK',
      tags: a.tags,
    }));
    const evalRes = evaluateObligations(pseudoLog as any, input.obligationConfigs);
    projectedPenalties = { totalApplied: evalRes.reportSummary.totalApplied, types: evalRes.reportSummary.types, missed: evalRes.missed };
    if (evalRes.missed.length) warnings.push('PENALTIES_PROJECTED');
  }

  // Finance preview (investment value only, no mutation)
  let projectedInvestmentValues: Record<string, number> | undefined;
  if (input.financePreview?.includeInvestments) {
    projectedInvestmentValues = evaluateInvestments(input.financePreview.state, input.financePreview.currentWeek).values;
  }

  // Over time warning
  if (total > input.week.effectiveHours + 1e-9) warnings.push('OVER_TIME');

  // Missing obligation tags
  const presentTags = new Set<string>();
  for (const a of input.tentativeActivities) {
    a.tags?.forEach(t => presentTags.add(t));
  }
  for (const tag of input.obligationTags) {
    if (!presentTags.has(tag)) warnings.push(`MISSING_${tag}`);
  }

  return {
    netDeltas: net,
    expectedCost: +expectedCost.toFixed(2),
    timeUsage: { activityTime, travelTime, total },
    warnings,
    travelOk,
    projectedPenalties,
    projectedInvestmentValues,
  };
}
