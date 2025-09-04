/** Serialization helpers for saving & loading core game snapshot */
import { WeekState } from '../systems/time/weekState.js';
import { StatusBars } from '../systems/status/statusBars.js';
import { FinanceState } from '../systems/finance/finance.js';

export interface GameSnapshot {
  version: number;
  week: WeekState;
  bars: StatusBars;
  finance?: FinanceState;
  ownedUpgrades?: string[];
}

export function exportSnapshot(input: GameSnapshot): string {
  return JSON.stringify(input);
}

export function importSnapshot(json: string): GameSnapshot {
  const obj = JSON.parse(json);
  if (typeof obj.version !== 'number') throw new Error('invalid snapshot: missing version');
  return obj as GameSnapshot;
}
