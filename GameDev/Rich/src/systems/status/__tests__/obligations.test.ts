import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateObligations, ObligationConfig } from '../obligations.js';
import { ActivityLogEntry } from '../../activity/activityExec.js';

function log(entries: Array<Partial<ActivityLogEntry>>): ActivityLogEntry[] {
  return entries.map((e, i) => ({
    id: e.id || `A${i}`,
    startOrder: i,
    timeCost: e.timeCost ?? 1,
    rewards: e.rewards || {},
    status: (e.status as any) || 'OK',
    tags: e.tags || [],
  }));
}

const baseObligations: ObligationConfig[] = [
  { id: 'eat', tag: 'EAT', frequencyPerWeek: 3, penaltyType: 'TIME_PENALTY', penaltyValue: 5, capPerCategory: 10 },
  { id: 'rent', tag: 'RENT', frequencyPerWeek: 1, penaltyType: 'MONEY_PENALTY', penaltyValue: 100, capPerCategory: 200 },
];

test('AC1: all required tags present -> no penalties', () => {
  const activityLog = log([
    { tags: ['EAT'] },
    { tags: ['EAT'] },
    { tags: ['EAT','RENT'] },
    { tags: ['EAT'] }, // extra beyond frequency fine
  ]);
  const r = evaluateObligations(activityLog, baseObligations);
  assert.equal(r.missed.length, 0);
  assert.equal(r.penalties.length, 0);
});

test('AC2: one obligation missed -> single penalty entry', () => {
  const activityLog = log([
    { tags: ['EAT'] },
    { tags: ['EAT'] },
    { tags: ['EAT'] },
  ]); // RENT missing
  const r = evaluateObligations(activityLog, baseObligations);
  assert.deepEqual(r.missed, ['rent']);
  assert.equal(r.penalties.length, 1);
  assert.equal(r.penalties[0].type, 'MONEY_PENALTY');
  assert.equal(r.penalties[0].appliedValue, 100);
});

test('AC3: multiple missed same type capped', () => {
  const obligations: ObligationConfig[] = [
    { id: 'eat', tag: 'EAT', frequencyPerWeek: 5, penaltyType: 'TIME_PENALTY', penaltyValue: 5, capPerCategory: 15 },
    { id: 'med', tag: 'MED', frequencyPerWeek: 2, penaltyType: 'TIME_PENALTY', penaltyValue: 10, capPerCategory: 15 },
  ];
  const activityLog = log([{ tags: ['EAT'] }]); // Only 1 EAT (needs 5) and 0 MED
  const r = evaluateObligations(activityLog, obligations);
  assert.equal(r.missed.length, 2);
  assert.equal(r.penalties.length, 1);
  const p = r.penalties[0];
  assert.equal(p.type, 'TIME_PENALTY');
  assert.equal(p.value, 15); // 5 + 10
  assert.equal(p.appliedValue, 15); // capped at 15
});

test('AC4: frequency=0 obligation ignored', () => {
  const obligations: ObligationConfig[] = [
    { id: 'ins', tag: 'INS', frequencyPerWeek: 0, penaltyType: 'MONEY_PENALTY', penaltyValue: 50, capPerCategory: 100 },
  ];
  const r = evaluateObligations([], obligations);
  assert.equal(r.missed.length, 0);
  assert.equal(r.penalties.length, 0);
});

test('AC5: reportSummary missedCount matches missed length', () => {
  const r = evaluateObligations([], baseObligations); // both missed
  assert.equal(r.missed.length, 2);
  assert.equal(r.reportSummary.missedCount, 2);
});

test('AC6: deterministic same input -> same output', () => {
  const activityLog = log([{ tags: ['EAT'] }, { tags: ['EAT'] }]);
  const r1 = evaluateObligations(activityLog, baseObligations);
  const r2 = evaluateObligations(activityLog, baseObligations);
  assert.deepEqual(r1, r2);
});

test('Edge: all missed different types reported separately', () => {
  const r = evaluateObligations([], baseObligations);
  assert.equal(r.penalties.length, 2);
});

test('Edge: duplicate tag occurrences beyond frequency only count once (fulfilled)', () => {
  const activityLog = log([
    { tags: ['RENT'] },
    { tags: ['RENT'] },
    { tags: ['RENT'] },
  ]); // RENT frequency=1 fulfilled; EAT missing
  const r = evaluateObligations(activityLog, baseObligations);
  assert.deepEqual(r.missed, ['eat']);
});
