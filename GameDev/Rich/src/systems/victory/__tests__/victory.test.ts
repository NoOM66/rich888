import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateVictory } from '../victory.js';

const thresholds = { money: 100, health: 50, happiness: 60, education: 40 };

test('AC1 victory when all >= thresholds', () => {
  const bars = { money: 100, health: 50, happiness: 60, education: 40 };
  const r = evaluateVictory(bars, thresholds, 7);
  assert.equal(r.isVictory, true);
  assert.equal(r.weekOfCompletion, 7);
  assert.deepEqual(r.completionSnapshot, bars);
});

test('AC2 any below -> not victory', () => {
  const bars = { money: 99.99, health: 50, happiness: 60, education: 40 };
  const r = evaluateVictory(bars, thresholds, 7);
  assert.equal(r.isVictory, false);
});

test('AC3 snapshot stored when victory', () => {
  const bars = { money: 120, health: 55, happiness: 70, education: 45 };
  const r = evaluateVictory(bars, thresholds, 10);
  assert.equal(r.isVictory, true);
  assert.deepEqual(r.completionSnapshot, bars);
});

test('AC4 inputs not mutated', () => {
  const bars = { money: 120, health: 55, happiness: 70, education: 45 };
  const clone = { ...bars };
  evaluateVictory(bars, thresholds, 10);
  assert.deepEqual(bars, clone);
});

test('AC5 idempotent repeat calls', () => {
  const bars = { money: 120, health: 55, happiness: 70, education: 45 };
  const r1 = evaluateVictory(bars, thresholds, 10);
  const r2 = evaluateVictory(bars, thresholds, 10);
  assert.deepEqual(r1, r2);
});

test('AC6 partial (3/4) -> not victory', () => {
  const bars = { money: 100, health: 49, happiness: 60, education: 40 };
  const r = evaluateVictory(bars, thresholds, 8);
  assert.equal(r.isVictory, false);
});

test('Edge exceed threshold still victory', () => {
  const bars = { money: 500, health: 80, happiness: 100, education: 90 };
  const r = evaluateVictory(bars, thresholds, 12);
  assert.equal(r.isVictory, true);
});
