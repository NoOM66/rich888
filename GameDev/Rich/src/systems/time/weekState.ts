/**
 * Time & Turn Management System Foundation (STORY-001)
 */
import { Result as SharedResult, ok, err } from '../../shared/result.js';

export interface WeekState {
  readonly baseHours: number;
  readonly effectiveHours: number; // after penalty + floor
  readonly spentTravel: number;
  readonly spentActivity: number;
  readonly penaltyApplied: number; // (base - effective) actual
}

export type AllocationErrorCode = 'NEGATIVE_OR_ZERO_HOURS' | 'OVER_ALLOCATION';

export interface AllocationError {
  code: AllocationErrorCode;
  message: string;
}

export type AllocationResult<T> = SharedResult<T, AllocationError>;

const PRECISION = 2;
function roundHours(h: number): number {
  return parseFloat(h.toFixed(PRECISION));
}

export function initWeek(baseHours: number, carryOverPenalty: number): WeekState {
  if (baseHours <= 0) throw new Error('baseHours must be > 0');
  const floorLimit = baseHours * 0.1;
  let effective = baseHours - Math.max(0, carryOverPenalty);
  if (effective < floorLimit) effective = floorLimit;
  effective = roundHours(effective);
  const penaltyApplied = roundHours(baseHours - effective);
  return Object.freeze({
    baseHours: roundHours(baseHours),
    effectiveHours: effective,
    spentTravel: 0,
    spentActivity: 0,
    penaltyApplied,
  });
}

export function getRemaining(state: WeekState): number {
  return roundHours(state.effectiveHours - (state.spentTravel + state.spentActivity));
}

function ensureHours(hours: number): AllocationResult<number> {
  if (hours <= 0) return err({ code: 'NEGATIVE_OR_ZERO_HOURS', message: 'hours must be > 0' });
  return ok(roundHours(hours));
}

function cloneWith(state: WeekState, changes: Partial<WeekState>): WeekState {
  return Object.freeze({ ...state, ...changes });
}

function allocate(kind: 'travel' | 'activity', state: WeekState, hours: number): AllocationResult<WeekState> {
  const checked = ensureHours(hours);
  if (!checked.ok) return checked;
  const h = checked.value;
  const newSpentTravel = kind === 'travel' ? state.spentTravel + h : state.spentTravel;
  const newSpentActivity = kind === 'activity' ? state.spentActivity + h : state.spentActivity;
  const total = newSpentTravel + newSpentActivity;
  if (total > state.effectiveHours + 1e-9) {
    return err({ code: 'OVER_ALLOCATION', message: 'allocation exceeds effective hours' });
  }
  return ok(cloneWith(state, { spentTravel: roundHours(newSpentTravel), spentActivity: roundHours(newSpentActivity) }));
}

export function allocateTravel(state: WeekState, hours: number): AllocationResult<WeekState> {
  return allocate('travel', state, hours);
}

export function allocateActivity(state: WeekState, hours: number): AllocationResult<WeekState> {
  return allocate('activity', state, hours);
}
