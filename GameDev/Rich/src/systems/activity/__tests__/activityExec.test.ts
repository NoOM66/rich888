import test from 'node:test';
import assert from 'node:assert/strict';
import { executePlan, ActivityDef } from '../activityExec.js';
import { initWeek } from '../../time/weekState.js';

const basePlan: ActivityDef[] = [
  { id: 'A1', timeCost: 2, rewards: { money: 100 } },
  { id: 'A2', timeCost: 3, rewards: { health: 5 } },
];

test('AC1: two activities executed with OK status', () => {
  const week = initWeek(40, 0);
  const result = executePlan(basePlan, week);
  assert.equal(result.log.length, 2);
  assert.equal(result.log[0].status, 'OK');
  assert.equal(result.log[1].status, 'OK');
  assert.equal(result.resourceDeltas.money, 100);
  assert.equal(result.resourceDeltas.health, 5);
  assert.equal(result.totalTimeSpentActivity, 5);
});

test('AC2: activity exceeding remaining -> SKIPPED and stop loop', () => {
  const week = initWeek(5, 0); // effective 5
  const plan: ActivityDef[] = [
    { id: 'B1', timeCost: 4, rewards: { money: 10 } },
    { id: 'B2', timeCost: 4, rewards: { money: 10 } }, // will exceed remaining (only 1 left)
    { id: 'B3', timeCost: 1, rewards: { money: 10 } }, // should not run
  ];
  const result = executePlan(plan, week);
  assert.equal(result.log.length, 2);
  assert.equal(result.log[0].status, 'OK');
  assert.equal(result.log[1].status, 'SKIPPED');
  assert.equal(result.resourceDeltas.money, 10);
});

test('AC3: negative reward clamped to 0 with ADJUSTED status', () => {
  const week = initWeek(10, 0);
  const plan: ActivityDef[] = [ { id: 'C1', timeCost: 2, rewards: { money: -50, happiness: 3 } } ];
  const result = executePlan(plan, week);
  assert.equal(result.log[0].status, 'ADJUSTED');
  assert.equal(result.resourceDeltas.money, 0);
  assert.equal(result.resourceDeltas.happiness, 3);
});

test('AC4 & AC5: totalTimeSpentActivity and resourceDeltas only from OK/ADJUSTED', () => {
  const week = initWeek(6, 0);
  const plan: ActivityDef[] = [
    { id: 'D1', timeCost: 3, rewards: { money: 10 } },
    { id: 'D2', timeCost: 10, rewards: { money: 999 } }, // will skip
  ];
  const r = executePlan(plan, week);
  assert.equal(r.totalTimeSpentActivity, 3);
  assert.equal(r.resourceDeltas.money, 10);
});

test('AC6: deterministic identical log for same input', () => {
  const w = initWeek(20, 0);
  const plan: ActivityDef[] = [ { id: 'E1', timeCost: 2, rewards: { education: 4 } } ];
  const r1 = executePlan(plan, w);
  const r2 = executePlan(plan, w);
  assert.deepEqual(r1.log, r2.log);
});

test('Edge: time exhausted mid-loop skip rest', () => {
  const w = initWeek(4, 0);
  const plan: ActivityDef[] = [
    { id: 'F1', timeCost: 2, rewards: { money: 1 } },
    { id: 'F2', timeCost: 2, rewards: { money: 1 } },
    { id: 'F3', timeCost: 1, rewards: { money: 1 } }, // cannot run
  ];
  const r = executePlan(plan, w);
  assert.equal(r.log.length, 3); // third logged as SKIPPED and loop stops
  assert.equal(r.log[2].status, 'SKIPPED');
  assert.equal(r.resourceDeltas.money, 2);
});

test('Multiplier: timeEfficiency reduces time cost and rewardMultiplier boosts rewards', () => {
  const week = initWeek(10, 0);
  const acts: ActivityDef[] = [ { id: 'M1', timeCost: 5, rewards: { money: 100, health: 10 } } ];
  const r = executePlan(acts, week, { rewardMultiplier: 0.2, timeEfficiencyMultiplier: 0.1 });
  assert.equal(r.log[0].timeCost, 4.5); // 5 * (1-0.1)
  assert.equal(r.resourceDeltas.money, 120); // 100 * 1.2
  assert.equal(r.resourceDeltas.health, 12); // 10 * 1.2
});

test('Multiplier: rounding to 2 decimals stable', () => {
  const week = initWeek(10, 0);
  const acts: ActivityDef[] = [ { id: 'M2', timeCost: 1.3333, rewards: { money: 10 } } ];
  const r = executePlan(acts, week, { rewardMultiplier: 0.157, timeEfficiencyMultiplier: 0.157 });
  // Actual JS rounding: 1.3333*(1-0.157)=1.125? -> toFixed(2)=1.12
  assert.equal(r.log[0].timeCost, 1.12);
  // reward: 10 * 1.157 = 11.57 (still 2 decimals)
  assert.equal(r.resourceDeltas.money, 11.57);
});
