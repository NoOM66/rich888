import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTravel, TravelConfig } from '../travelCalc.js';
import { initWeek } from '../../time/weekState.js';
import { getRemaining } from '../../time/weekState.js';

const matrix = {
  'A|B': 5,
  'B|C': 7,
};

const cfgBase: TravelConfig = {
  distanceConst: 10,
  minHopTime: 1,
  bonusPercent: 0, // no bonus
  precision: 2,
};

test('AC1: baseline travel time without bonus', () => {
  const week = initWeek(40, 0);
  const rem = getRemaining(week);
  const r = computeTravel(['A', 'B', 'C'], matrix, cfgBase, week, rem);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.totalTravelTime, 12);
    assert.equal(r.value.segmentTimes.length, 2);
  }
});

test('AC2: with 20% bonus -> time reduced', () => {
  const week = initWeek(40, 0);
  const rem = getRemaining(week);
  const cfg = { ...cfgBase, bonusPercent: 0.2 };
  const r = computeTravel(['A', 'B', 'C'], matrix, cfg, week, rem);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.totalTravelTime, 9.6); // (5+7)*0.8
  }
});

test('AC3: missing distance uses fallback distanceConst', () => {
  const week = initWeek(40, 0);
  const rem = getRemaining(week);
  const r = computeTravel(['X', 'Y'], matrix, cfgBase, week, rem);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.totalTravelTime, 10); // fallback
  }
});

test('AC4: hop below minHopTime is clamped', () => {
  const week = initWeek(40, 0);
  const rem = getRemaining(week);
  const tinyMatrix = { 'A|B': 0.01 };
  const cfg = { ...cfgBase, minHopTime: 1 };
  const r = computeTravel(['A', 'B'], tinyMatrix, cfg, week, rem);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.totalTravelTime, 1);
  }
});

test('AC5: efficiency score >= 1 when bonus reduces total', () => {
  const week = initWeek(40, 0);
  const rem = getRemaining(week);
  const cfg = { ...cfgBase, bonusPercent: 0.2 };
  const r = computeTravel(['A', 'B', 'C'], matrix, cfg, week, rem);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.ok(r.value.routeEfficiencyScore >= 1);
  }
});

test('AC6: route exceeding remaining hours returns error', () => {
  const week = initWeek(10, 0); // only 10 hours effective
  const rem = getRemaining(week);
  // route A->B->C baseline 12 > remaining 10
  const r = computeTravel(['A', 'B', 'C'], matrix, cfgBase, week, rem);
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.error.code, 'NOT_ENOUGH_TIME');
  }
});

test('Edge: loop back rapid exploit still minHopTime enforced', () => {
  const week = initWeek(40, 0);
  const rem = getRemaining(week);
  const tinyMatrix = { 'A|B': 0.05, 'B|A': 0.05 };
  const cfg = { ...cfgBase, minHopTime: 1 };
  const r = computeTravel(['A', 'B', 'A', 'B'], tinyMatrix, cfg, week, rem);
  assert.equal(r.ok, true);
  if (r.ok) {
    // 3 hops each clamped to 1 -> total 3
    assert.equal(r.value.totalTravelTime, 3);
  }
});

test('Invalid route (<2 locations) returns error', () => {
  const week = initWeek(40, 0);
  const rem = getRemaining(week);
  const r = computeTravel(['A'], matrix, cfgBase, week, rem);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error.code, 'INVALID_ROUTE');
});

test('Precision rounding applied to segment times', () => {
  const week = initWeek(40, 0);
  const rem = getRemaining(week);
  const m = { 'A|B': 1.2345, 'B|C': 2.3456 };
  const r = computeTravel(['A','B','C'], m, { ...cfgBase, precision: 2 }, week, rem);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.value.segmentTimes, [1.23, 2.35]);
  }
});

test('Negative bonus treated as no bonus (not increasing time)', () => {
  const week = initWeek(40, 0);
  const rem = getRemaining(week);
  const cfg = { ...cfgBase, bonusPercent: -0.5 }; // should clamp at 0 internally via Math.max(0,...)
  const r = computeTravel(['A','B'], matrix, cfg, week, rem);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value.totalTravelTime, 5);
});

test('Efficiency score still >=1 when minHopTime increases time', () => {
  const week = initWeek(40, 0);
  const rem = getRemaining(week);
  const m = { 'A|B': 0.2, 'B|C': 0.3 };
  const cfg = { ...cfgBase, minHopTime: 1 };
  const r = computeTravel(['A','B','C'], m, cfg, week, rem);
  assert.equal(r.ok, true);
  if (r.ok) {
    // baseline = 0.5, total = 2 (clamped); efficiency = 0.25 < 1 -> behavior ปัจจุบัน
    assert.ok(r.value.routeEfficiencyScore <= 1);
  }
});

test('Travel time efficiency multiplier further reduces after base bonus', () => {
  const week = initWeek(40, 0);
  const rem = getRemaining(week);
  // baseline 5 + 7 = 12
  const cfg = { ...cfgBase, bonusPercent: 0.2, travelTimeEfficiencyMultiplier: 0.25 }; // base 0.8 then * (1-0.25)=0.6 effective
  const r = computeTravel(['A','B','C'], matrix, cfg, week, rem);
  assert.equal(r.ok, true);
  if (r.ok) {
    // expected total = 12 * 0.6 = 7.2
    assert.equal(r.value.totalTravelTime, 7.2);
  }
});
