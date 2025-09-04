/**
 * Weekly Integration Flow Demo (Option 3)
 * Combines: Week time init (external), Activity execution -> Status Bars update -> Obligations evaluation -> Penalty projection -> Upgrades purchase & multipliers preview.
 * NOTE: Travel not yet integrated (route compute) & multipliers not yet applied to activities/travel (future integration story).
 */
import { executePlan, ActivityDef, ExecutionResult } from '../systems/activity/activityExec.js';
import { applyDeltas, StatusBars, StatusThresholds } from '../systems/status/statusBars.js';
import { evaluateObligations, ObligationConfig } from '../systems/status/obligations.js';
import { purchaseUpgrade, computeMultipliers, UpgradeDef, UpgradeState, HardCapsConfig, PurchaseResult } from '../systems/upgrade/upgrades.js';
import { initWeek, WeekState } from '../systems/time/weekState.js';
import { emptyFinanceState, FinanceState, weeklyRepayment, evaluateInvestments } from '../systems/finance/finance.js';
import { buildWeekSummary, WeekSummaryResult } from '../systems/summary/weekSummary.js';
import { evaluateVictory, VictoryResult } from '../systems/victory/victory.js';

export interface WeekSimulationInput {
  baseHours: number;
  carryOverPenalty: number; // from previous week time penalties
  initialBars: StatusBars;
  barThresholds: StatusThresholds;
  activities: ActivityDef[];
  obligations: ObligationConfig[];
  upgradeDefs: UpgradeDef[];
  plannedPurchases: string[]; // sequence of upgrade ids to attempt purchase AFTER activities & penalties applied
  hardCaps?: HardCapsConfig;
  finance?: {
    state?: FinanceState; // if omitted will init empty with money from bars after penalties
    weeklyPenaltyRate: number; // penaltyRate passed to weeklyRepayment
    currentWeek: number; // week index for finance calculations
    enableInvestmentsEvaluation?: boolean; // if true evaluate investments values into result
  };
  summary?: { enable: boolean; maxEntries?: number };
  victory?: { enable: boolean; currentWeek: number; thresholdsOverride?: StatusThresholds };
}

export interface PenaltyProjection {
  timePenaltyNextWeek: number; // aggregated TIME_PENALTY appliedValue
  moneyPenaltyApplied: number; // money penalty (negative applied to bars)
}

export interface PurchaseSummaryEntry {
  id: string;
  ok: boolean;
  errorCode?: string;
  remainingMoney: number;
}

export interface WeekSimulationResult {
  week: WeekState;
  activities: ExecutionResult;
  barsAfterActivities: StatusBars;
  barsAfterPenalties: StatusBars;
  completionFlags: Record<string, boolean>;
  obligationsMissed: string[];
  penalties: PenaltyProjection;
  purchases: PurchaseSummaryEntry[];
  multipliers: Record<string, number>;
  rawMultipliers: Record<string, number>;
  nextWeekCarryOverPenalty: number; // same as timePenaltyNextWeek for clarity
  financeState?: FinanceState;
  financeRepaymentPaidTotal?: number;
  financePenaltiesApplied?: number;
  investmentValues?: Record<string, number>;
  finalMoney: number; // unified money after finance (if finance used) else barsAfterPenalties.money
  summary?: WeekSummaryResult;
  victory?: VictoryResult;
}

function aggregatePenalties(obPenalty: ReturnType<typeof evaluateObligations>): PenaltyProjection {
  let timePenalty = 0;
  let moneyPenalty = 0;
  for (const p of obPenalty.penalties) {
    if (p.type.includes('TIME')) timePenalty += p.appliedValue;
    if (p.type.includes('MONEY')) moneyPenalty += p.appliedValue;
  }
  return { timePenaltyNextWeek: timePenalty, moneyPenaltyApplied: moneyPenalty };
}

export function simulateWeek(input: WeekSimulationInput): WeekSimulationResult {
  const week = initWeek(input.baseHours, input.carryOverPenalty);

  // 1. Execute activities -> resource deltas
  const exec = executePlan(input.activities, week);

  // 2. Apply resource deltas to bars
  const barsResult = applyDeltas(input.initialBars, exec.resourceDeltas, input.barThresholds);

  // 3. Evaluate obligations on executed activity log
  const obligationsEval = evaluateObligations(exec.log, input.obligations);
  const penaltyProjection = aggregatePenalties(obligationsEval);

  // 4. Apply monetary penalties immediately (as negative money delta)
  const penaltyMoneyDelta = penaltyProjection.moneyPenaltyApplied > 0 ? { money: -penaltyProjection.moneyPenaltyApplied } : {};
  const barsAfterPenaltiesResult = Object.keys(penaltyMoneyDelta).length
    ? applyDeltas(barsResult.bars, penaltyMoneyDelta, input.barThresholds)
    : { bars: barsResult.bars, completionFlags: barsResult.completionFlags, debtOverdraft: barsResult.debtOverdraft };

  // 5. Process planned upgrades purchases against current money (barsAfterPenalties.money)
  let upgradeState: UpgradeState = { money: barsAfterPenaltiesResult.bars.money, owned: [] };
  const purchaseSummaries: PurchaseSummaryEntry[] = [];
  for (const id of input.plannedPurchases) {
    const r: PurchaseResult = purchaseUpgrade(input.upgradeDefs, upgradeState, id);
    if (r.ok) {
      upgradeState = r.value.newState;
      purchaseSummaries.push({ id, ok: true, remainingMoney: r.value.newMoney });
    } else {
      purchaseSummaries.push({ id, ok: false, errorCode: r.error.code, remainingMoney: upgradeState.money });
    }
  }
  const mult = computeMultipliers(upgradeState.owned, input.upgradeDefs, input.hardCaps);

  // 6. Finance integration (optional)
  let financeState: FinanceState | undefined = undefined;
  let financeRepaymentPaidTotal: number | undefined = undefined;
  let financePenaltiesApplied: number | undefined = undefined;
  let investmentValues: Record<string, number> | undefined = undefined;
  let finalMoney = barsAfterPenaltiesResult.bars.money;
  if (input.finance) {
    const finInput = input.finance;
    financeState = finInput.state ?? emptyFinanceState(barsAfterPenaltiesResult.bars.money);
    // Ensure finance money sync with bars money before repayment
    financeState = { ...financeState, money: barsAfterPenaltiesResult.bars.money };
    const repay = weeklyRepayment(financeState, finInput.currentWeek, { penaltyRate: finInput.weeklyPenaltyRate });
    if (repay.ok) {
      financeState = repay.value.state;
      financeRepaymentPaidTotal = repay.value.summary.paidTotal;
      financePenaltiesApplied = repay.value.summary.penaltiesApplied;
      finalMoney = financeState.money;
    }
    if (finInput.enableInvestmentsEvaluation) {
      investmentValues = evaluateInvestments(financeState, finInput.currentWeek).values;
    }
  }

  // 7. Optional summary
  let summary: WeekSummaryResult | undefined = undefined;
  if (input.summary?.enable) {
    // Map purchases to upgradesApplied (only successes) with cost and no benefit detail for now
    const successfulPurchases = purchaseSummaries.filter(p => p.ok).map(p => p.id);
    const upgradesApplied = successfulPurchases.map(id => {
      const def = input.upgradeDefs.find(d => d.id === id)!;
      return { id: def.id, cost: def.cost };
    });
    summary = buildWeekSummary({
      executionLog: exec.log,
      penalties: obligationsEval.penalties,
      upgradesApplied,
      maxEntries: input.summary.maxEntries,
    });
  }

  // 8. Optional victory evaluation
  let victory: VictoryResult | undefined = undefined;
  if (input.victory?.enable) {
    const thresholds = input.victory.thresholdsOverride ?? input.barThresholds;
    // Use finalMoney (after finance) as money bar snapshot
    const barsForVictory = { ...barsAfterPenaltiesResult.bars, money: finalMoney } as StatusBars;
    victory = evaluateVictory(barsForVictory, thresholds, input.victory.currentWeek);
  }

  return {
    week,
    activities: exec,
    barsAfterActivities: barsResult.bars,
    barsAfterPenalties: barsAfterPenaltiesResult.bars,
    completionFlags: barsAfterPenaltiesResult.completionFlags,
    obligationsMissed: obligationsEval.missed,
    penalties: penaltyProjection,
    purchases: purchaseSummaries,
    multipliers: mult.multipliers,
    rawMultipliers: mult.raw,
    nextWeekCarryOverPenalty: penaltyProjection.timePenaltyNextWeek,
    financeState,
    financeRepaymentPaidTotal,
    financePenaltiesApplied,
    investmentValues,
    finalMoney,
    summary,
    victory,
  };
}
