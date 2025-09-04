import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWeekSummary } from '../weekSummary.js';

const sampleLog = [
  { id: 'a', startOrder: 0, timeCost: 1, rewards: { money: 100, health: 5 }, status: 'OK' },
  { id: 'b', startOrder: 1, timeCost: 2, rewards: { money: -30 }, status: 'ADJUSTED' },
];

test('AC1 resourceTotals sum rewards', () => {
  const r = buildWeekSummary({ executionLog: sampleLog as any, penalties: [], upgradesApplied: [] });
  assert.equal(r.resourceTotals.money, 70); // 100 + (-30)
  assert.equal(r.resourceTotals.health, 5);
});

test('AC2 grouping flag when log length > maxEntries', () => {
  const longLog = Array.from({ length: 6 }, (_, i) => ({ id: 'x'+i, startOrder: i, timeCost: 1, rewards: { money: 1 }, status: 'OK' }));
  const r = buildWeekSummary({ executionLog: longLog as any, penalties: [], upgradesApplied: [], maxEntries: 5 });
  assert.equal(r.grouped, true);
});

test('AC3 negative net progression advisory added', () => {
  const log = [ { id: 'd', startOrder:0, timeCost:1, rewards: { money: -10 }, status: 'OK' } ];
  const r = buildWeekSummary({ executionLog: log as any, penalties: [], upgradesApplied: [] });
  assert.ok(r.advisoryMessages.includes('Consider Upgrades'));
});

test('AC4 penaltiesApplied length matches input', () => {
  const penalties = [ { type: 'TIME_P', appliedValue: 1 }, { type: 'MONEY_P', appliedValue: 2 } ];
  const r = buildWeekSummary({ executionLog: sampleLog as any, penalties, upgradesApplied: [] });
  assert.equal(r.penaltiesApplied.length, penalties.length);
});

test('AC5 upgradeROI computed', () => {
  const upgrades = [ { id:'u1', cost: 100, benefit: { money: 30 } } ];
  const r = buildWeekSummary({ executionLog: sampleLog as any, penalties: [], upgradesApplied: upgrades });
  const roi = r.upgradeROI.find(u=>u.id==='u1')!.roi;
  assert.equal(roi, 0.3);
});

test('AC6 purity deterministic', () => {
  const r1 = buildWeekSummary({ executionLog: sampleLog as any, penalties: [], upgradesApplied: [] });
  const r2 = buildWeekSummary({ executionLog: sampleLog as any, penalties: [], upgradesApplied: [] });
  assert.deepEqual(r1, r2);
});

test('Edge no penalties / no upgrades', () => {
  const r = buildWeekSummary({ executionLog: [], penalties: [], upgradesApplied: [] });
  assert.equal(r.penaltiesApplied.length, 0);
  assert.equal(r.upgradeROI.length, 0);
});
