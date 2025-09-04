import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateWeek } from '../weeklyFlow.js';

const upgradeDefs = [ { id: 'u1', category: 'reward', cost: 10, bonusPercent: 0.1, unique: true } ];

test('Summary enabled produces resourceTotals matching log rewards', () => {
  const res = simulateWeek({
    baseHours: 10,
    carryOverPenalty: 0,
    initialBars: { money: 0, health: 0, happiness: 0, education: 0 },
    barThresholds: { money: 999, health: 999, happiness: 999, education: 999 },
    activities: [ { id: 'a', timeCost: 2, rewards: { money: 50 } }, { id: 'b', timeCost: 2, rewards: { health: 5 } } ],
    obligations: [],
    upgradeDefs,
    plannedPurchases: [],
    summary: { enable: true, maxEntries: 5 },
  });
  assert.ok(res.summary);
  assert.equal(res.summary!.resourceTotals.money, 50);
  assert.equal(res.summary!.resourceTotals.health, 5);
});

test('Victory enabled returns isVictory true when thresholds met using finalMoney', () => {
  const res = simulateWeek({
    baseHours: 10,
    carryOverPenalty: 0,
    initialBars: { money: 90, health: 10, happiness: 10, education: 10 },
    barThresholds: { money: 100, health: 10, happiness: 10, education: 10 },
    activities: [ { id: 'a', timeCost: 1, rewards: { money: 10 } } ],
    obligations: [],
    upgradeDefs,
    plannedPurchases: [],
    victory: { enable: true, currentWeek: 3 },
  });
  assert.ok(res.victory);
  assert.equal(res.victory!.isVictory, true);
  assert.equal(res.victory!.weekOfCompletion, 3);
});

test('Victory false when one bar below threshold', () => {
  const res = simulateWeek({
    baseHours: 10,
    carryOverPenalty: 0,
    initialBars: { money: 90, health: 9, happiness: 10, education: 10 },
    barThresholds: { money: 100, health: 10, happiness: 10, education: 10 },
    activities: [ { id: 'a', timeCost: 1, rewards: { money: 20 } } ],
    obligations: [],
    upgradeDefs,
    plannedPurchases: [],
    victory: { enable: true, currentWeek: 1 },
  });
  assert.ok(res.victory);
  assert.equal(res.victory!.isVictory, false);
});
