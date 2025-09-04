import { initWeek, allocateTravel, allocateActivity, getRemaining } from '../weekState.js';
import assert from 'node:assert/strict';
import test from 'node:test';

// 1. Init no penalty
test('init week without penalty', () => {
  const w = initWeek(40, 0);
  assert.equal(w.effectiveHours, 40);
  assert.equal(w.penaltyApplied, 0);
  assert.equal(getRemaining(w), 40);
});

// 2. Init with normal penalty
test('init week with penalty reduces hours', () => {
  const w = initWeek(40, 8);
  assert.equal(w.effectiveHours, 32);
  assert.equal(w.penaltyApplied, 8);
});

// 3. Init with huge penalty triggers floor (10%)
test('init week with huge penalty floors at 10%', () => {
  const w = initWeek(40, 39); // would drop to 1
  assert.equal(w.effectiveHours, 4); // floor
  assert.equal(w.penaltyApplied, 36);
});

// 4. Travel accumulation
test('travel accumulation adds correctly', () => {
  let w = initWeek(40, 0);
  const r1 = allocateTravel(w, 5);
  assert.equal(r1.ok, true);
  w = (r1 as any).value;
  const r2 = allocateTravel(w, 5);
  assert.equal(r2.ok, true);
  w = (r2 as any).value;
  assert.equal(w.spentTravel, 10);
  assert.equal(getRemaining(w), 30);
});

// 5. Activity over-allocation -> reject and state unchanged
test('activity over-allocation rejects', () => {
  const w0 = initWeek(40, 0);
  const t = allocateTravel(w0, 3);
  assert.equal(t.ok, true);
  const w1 = (t as any).value;
  const act = allocateActivity(w1, 38);
  assert.equal(act.ok, false);
  assert.equal(w1.spentActivity, 0);
  assert.equal(getRemaining(w1), 37); // 40 - 3
});

// 6. Travel pushing over limit -> reject
test('travel over limit rejects', () => {
  const w0 = initWeek(40, 0);
  const big = allocateTravel(w0, 41);
  assert.equal(big.ok, false);
  assert.equal(getRemaining(w0), 40);
});
