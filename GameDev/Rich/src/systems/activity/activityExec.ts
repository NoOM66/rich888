/**
 * Activity Execution & Logging (STORY-003)
 */
import { WeekState, allocateActivity, getRemaining } from '../time/weekState.js';

export interface ActivityDef {
  id: string;
  timeCost: number; // hours required (must be >0)
  rewards: Partial<Record<'money'|'health'|'happiness'|'education', number>>;
  tags?: string[]; // optional tags used for obligation fulfillment (STORY-005)
}

export type ActivityStatus = 'OK' | 'SKIPPED' | 'TRUNCATED' | 'ADJUSTED';

export interface ActivityLogEntry {
  id: string;
  startOrder: number;
  timeCost: number; // applied time cost (if executed)
  rewards: Record<string, number>; // applied rewards (after clamp)
  status: ActivityStatus;
  tags?: string[]; // propagated from ActivityDef for obligation evaluation
}

export interface ExecutionResult {
  log: ActivityLogEntry[];
  resourceDeltas: Record<string, number>;
  finalState: WeekState;
  totalTimeSpentActivity: number;
}

export interface ExecutionOptions {
  disallowNegative?: boolean; // default true
  rewardMultiplier?: number; // e.g. activity category multiplier (>=0, additive form already summed externally)
  timeEfficiencyMultiplier?: number; // e.g. activity speed multiplier (>=0) interpreted as reduction percent
}

const DEFAULT_OPTS: ExecutionOptions = { disallowNegative: true };

export function executePlan(
  lockedPlan: ActivityDef[],
  week: WeekState,
  opts: ExecutionOptions = DEFAULT_OPTS
): ExecutionResult {
  const log: ActivityLogEntry[] = [];
  const resourceDeltas: Record<string, number> = { money: 0, health: 0, happiness: 0, education: 0 };
  let totalTime = 0;
  let state = week;
  const disallowNegative = opts.disallowNegative !== false;

  for (let i = 0; i < lockedPlan.length; i++) {
    const act = lockedPlan[i];
    const remaining = getRemaining(state);

    // Apply time efficiency (reduce cost) before checking remaining
    const timeMult = Math.max(0, opts.timeEfficiencyMultiplier ?? 0); // e.g. 0.08 means 8% faster => cost * (1 - 0.08)
    const adjustedTimeCost = parseFloat((act.timeCost * (1 - timeMult)).toFixed(2));

    if (adjustedTimeCost > remaining) {
      // status=SKIPPED and stop loop per spec
      log.push({ id: act.id, startOrder: i, timeCost: 0, rewards: {}, status: 'SKIPPED', tags: act.tags });
      break;
    }

    // allocate time (all-or-nothing)
  const alloc = allocateActivity(state, adjustedTimeCost);
    if (!alloc.ok) {
      // Should not happen because we checked remaining; treat as skipped & stop.
      log.push({ id: act.id, startOrder: i, timeCost: 0, rewards: {}, status: 'SKIPPED' });
      break;
    }
    state = alloc.value;

    // process rewards
    const appliedRewards: Record<string, number> = {};
    let status: ActivityStatus = 'OK';
    for (const k of Object.keys(act.rewards) as Array<keyof typeof resourceDeltas>) {
      const raw = (act.rewards as Record<string, number>)[k] ?? 0;
      if (disallowNegative && raw < 0) {
        appliedRewards[k] = 0;
        status = status === 'OK' ? 'ADJUSTED' : status;
      } else {
        appliedRewards[k] = raw;
      }
      resourceDeltas[k] += appliedRewards[k];
    }

    totalTime += adjustedTimeCost;
    // Apply reward multiplier (increase outputs) after clamp logic
    const rewardMult = Math.max(0, opts.rewardMultiplier ?? 0); // 0.08 -> +8%
    if (rewardMult > 0) {
      for (const k of Object.keys(appliedRewards)) {
        const boosted = appliedRewards[k] * (1 + rewardMult);
        const rounded = parseFloat(boosted.toFixed(2));
        const diff = rounded - appliedRewards[k];
        appliedRewards[k] = rounded;
        resourceDeltas[k] += diff; // add only the extra diff (base already added)
      }
    }
    log.push({ id: act.id, startOrder: i, timeCost: adjustedTimeCost, rewards: appliedRewards, status, tags: act.tags });
  }

  return { log, resourceDeltas, finalState: state, totalTimeSpentActivity: totalTime };
}
