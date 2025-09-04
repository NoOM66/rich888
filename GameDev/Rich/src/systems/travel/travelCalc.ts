/**
 * Travel & Route Optimization Core (STORY-002)
 */
import { WeekState } from '../time/weekState.js';
import { Result, ok, err } from '../../shared/result.js';

export interface TravelConfig {
  distanceConst: number;      // fallback distance
  minHopTime: number;         // minimum enforced time per hop
  bonusPercent: number;       // 0.2 = 20% reduction
  precision?: number;         // rounding precision (default 2)
  travelTimeEfficiencyMultiplier?: number; // additional reduction percent from upgrades (e.g. 0.1 = -10%)
}

export interface DistanceMatrix {
  // key format: `${from}|${to}`
  [key: string]: number;
}

export type TravelErrorCode = 'NOT_ENOUGH_TIME' | 'INVALID_ROUTE';
export interface TravelError { code: TravelErrorCode; message: string; }
export interface TravelSuccess {
  totalTravelTime: number;
  segmentTimes: number[]; // length = hops
  routeEfficiencyScore: number; // baseline / total
  baselineLinear: number;
}
export type TravelComputation = Result<TravelSuccess, TravelError>;

function round(v: number, p: number) { return parseFloat(v.toFixed(p)); }
function key(a: string, b: string) { return `${a}|${b}`; }

export function computeTravel(
  locations: string[],
  matrix: DistanceMatrix,
  cfg: TravelConfig,
  week: WeekState,
  remainingHours: number // pass explicit remaining from WeekState helper
): TravelComputation {
  if (locations.length < 2) {
    return err({ code: 'INVALID_ROUTE', message: 'need at least 2 locations' });
  }
  const precision = cfg.precision ?? 2;
  const segmentTimes: number[] = [];
  let baseline = 0;
  let total = 0;
  const bonusFactorBase = 1 - Math.max(0, cfg.bonusPercent);
  const extraEff = Math.max(0, cfg.travelTimeEfficiencyMultiplier ?? 0);
  const bonusFactor = Math.max(0, bonusFactorBase * (1 - extraEff));

  for (let i = 0; i < locations.length - 1; i++) {
    const from = locations[i];
    const to = locations[i + 1];
    const dist = matrix[key(from, to)] ?? cfg.distanceConst;
    baseline += dist;
  let hop = dist * bonusFactor;
    if (hop < cfg.minHopTime) hop = cfg.minHopTime;
    segmentTimes.push(round(hop, precision));
    total += hop;
  }
  total = round(total, precision);
  baseline = round(baseline, precision);
  if (total > remainingHours + 1e-9) {
    return err({ code: 'NOT_ENOUGH_TIME', message: 'route exceeds remaining hours' });
  }
  const routeEfficiencyScore = round(baseline / total, precision); // >=1 if reduced
  return ok({ totalTravelTime: total, segmentTimes, routeEfficiencyScore, baselineLinear: baseline });
}
