import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateWeek, WeekSimulationInput } from '../weeklyFlow.js';
import { ActivityDef } from '../../systems/activity/activityExec.js';
import { ObligationConfig } from '../../systems/status/obligations.js';
import { UpgradeDef } from '../../systems/upgrade/upgrades.js';

const activities: ActivityDef[] = [
  { id: 'JOB1', timeCost: 4, rewards: { money: 200 }, tags: ['RENT'] },
  { id: 'MEAL1', timeCost: 1, rewards: { health: 3 }, tags: ['EAT'] },
  { id: 'MEAL2', timeCost: 1, rewards: { health: 3 }, tags: ['EAT'] },
];

const obligations: ObligationConfig[] = [
  { id: 'eat', tag: 'EAT', frequencyPerWeek: 3, penaltyType: 'TIME_PENALTY', penaltyValue: 2, capPerCategory: 4 },
  { id: 'rent', tag: 'RENT', frequencyPerWeek: 1, penaltyType: 'MONEY_PENALTY', penaltyValue: 100, capPerCategory: 200 },
];

const upgradeDefs: UpgradeDef[] = [
  { id: 'spd1', category: 'travel', cost: 150, bonusPercent: 0.1, unique: true },
  { id: 'coffee', category: 'activity', cost: 50, bonusPercent: 0.05, unique: false },
];

const input: WeekSimulationInput = {
  baseHours: 40,
  carryOverPenalty: 0,
  initialBars: { money: 100, health: 10, happiness: 5, education: 0 },
  barThresholds: { money: 1000, health: 100, happiness: 100, education: 100 },
  activities,
  obligations,
  upgradeDefs,
  plannedPurchases: ['spd1', 'coffee', 'coffee'],
  hardCaps: { activity: 0.08, travel: 0.5 },
};

test('Integration: simulate week basic flow deterministic & applies penalties/purchases', () => {
  const r1 = simulateWeek(input);
  const r2 = simulateWeek(input);
  assert.deepEqual(r1.multipliers, r2.multipliers);
  assert.equal(r1.activities.resourceDeltas.money, 200); // from JOB1
  // Only 2 EAT tags -> obligation eat missed -> time penalty
  assert.ok(r1.obligationsMissed.includes('eat'));
  assert.equal(r1.penalties.timePenaltyNextWeek, 2); // appliedValue single miss
  assert.equal(r1.penalties.moneyPenaltyApplied, 0); // rent fulfilled
  // Purchases: spd1 (150) then coffee (50) then coffee (50) -> after activity money 100+200=300 -> final money 50
  const lastPurchase = r1.purchases[r1.purchases.length - 1];
  assert.equal(lastPurchase.remainingMoney, 50);
  // Multipliers reflect two coffee (0.05 + 0.05) clamped at 0.08 & travel 0.1
  assert.equal(r1.rawMultipliers.activity, 0.1);
  assert.equal(r1.multipliers.activity, 0.08);
  assert.equal(r1.multipliers.travel, 0.1);
});

test('Integration: finance repayment syncs finalMoney', () => {
  const withFinance = simulateWeek({
    ...input,
    finance: {
      weeklyPenaltyRate: 5,
      currentWeek: 0,
      enableInvestmentsEvaluation: false,
    },
  });
  assert.ok(withFinance.financeState);
  if (withFinance.financeState) {
    assert.equal(withFinance.finalMoney, withFinance.financeState.money);
  }
});
