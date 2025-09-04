/**
 * Victory Condition Evaluation (STORY-010)
 */
import { StatusBars, StatusThresholds } from '../status/statusBars.js';

export interface VictoryResult {
  isVictory: boolean;
  weekOfCompletion?: number;
  completionSnapshot?: StatusBars;
}

export function evaluateVictory(bars: StatusBars, thresholds: StatusThresholds, currentWeek: number): VictoryResult {
  const allMet = bars.money >= thresholds.money && bars.health >= thresholds.health && bars.happiness >= thresholds.happiness && bars.education >= thresholds.education;
  if (!allMet) return { isVictory: false };
  // snapshot (clone to ensure immutability outward)
  const snapshot: StatusBars = { money: bars.money, health: bars.health, happiness: bars.happiness, education: bars.education };
  return { isVictory: true, weekOfCompletion: currentWeek, completionSnapshot: snapshot };
}
