import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDeltas, StatusBars, StatusThresholds } from '../statusBars.js';

const base: StatusBars = { money: 100, health: 40, happiness: 30, education: 20 };
const thresholds: StatusThresholds = { money: 500, health: 100, happiness: 100, education: 100 };

test('AC1: delta pushing above threshold clamps to threshold', () => {
  const r = applyDeltas(base, { money: 1000 }, thresholds);
  assert.equal(r.bars.money, thresholds.money);
  assert.equal(r.completionFlags.money, true);
});

test('AC2: delta pushing below zero clamps at 0', () => {
  const r = applyDeltas(base, { health: -999 }, thresholds);
  assert.equal(r.bars.health, 0);
});

test('AC3: overdraft money <0 before clamp sets debtOverdraft', () => {
  const r = applyDeltas(base, { money: -150 }, thresholds);
  assert.equal(r.debtOverdraft, true);
  assert.equal(r.bars.money, 0); // clamped
});

test('AC4: completion flags true only for bars at threshold', () => {
  const r = applyDeltas(base, { education: 1000 }, thresholds);
  assert.equal(r.completionFlags.education, true);
  assert.equal(r.completionFlags.money, false);
});

test('AC5: pure function deterministic same output for same inputs', () => {
  const r1 = applyDeltas(base, { happiness: 10 }, thresholds);
  const r2 = applyDeltas(base, { happiness: 10 }, thresholds);
  assert.deepEqual(r1, r2);
});

test('AC6: input objects not mutated (immutability)', () => {
  const copyBase = { ...base };
  const deltas = { money: 50 };
  const copyDeltas = { ...deltas } as any;
  applyDeltas(copyBase, deltas, thresholds);
  assert.deepEqual(copyBase, base); // unchanged
  assert.deepEqual(copyDeltas, deltas); // unchanged
});

test('Edge: all bars complete -> all flags true', () => {
  const r = applyDeltas({ money: 500, health: 100, happiness: 100, education: 100 }, { money: 1 }, thresholds);
  assert.ok(Object.values(r.completionFlags).every(v => v === true));
});

test('Edge: large negative money sets overdraft and clamps', () => {
  const r = applyDeltas(base, { money: -1000 }, thresholds);
  assert.equal(r.debtOverdraft, true);
  assert.equal(r.bars.money, 0);
});
