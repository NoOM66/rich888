import test from 'node:test';
import assert from 'node:assert/strict';
import { purchaseUpgrade, computeMultipliers, UpgradeDef, UpgradeState } from '../upgrades.js';

const defs: UpgradeDef[] = [
  { id: 'spd1', category: 'travel', cost: 200, bonusPercent: 0.1, unique: true },
  { id: 'coffee', category: 'activity', cost: 50, bonusPercent: 0.05, unique: false },
  { id: 'coffeeXL', category: 'activity', cost: 60, bonusPercent: 0.07, unique: false },
  { id: 'bad', category: 'bug', cost: -1, bonusPercent: 0.2, unique: true }, // invalid
];

function st(money: number, owned: string[] = []): UpgradeState { return { money, owned }; }

test('AC1: purchase success when cost <= money deducts money', () => {
  const r = purchaseUpgrade(defs, st(300), 'spd1');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.newMoney, 100);
    assert.deepEqual(r.value.owned, ['spd1']);
  }
});

test('AC2: unique duplicate purchase rejected (DUPLICATE)', () => {
  const r1 = purchaseUpgrade(defs, st(500), 'spd1');
  assert.equal(r1.ok, true);
  const r2 = purchaseUpgrade(defs, r1.ok ? r1.value.newState : st(0), 'spd1');
  assert.equal(r2.ok, false);
  if (!r2.ok) assert.equal(r2.error.code, 'DUPLICATE');
});

test('AC3: total percent over hardCap clamped in computeMultipliers', () => {
  // buy multiple activity upgrades to exceed cap 0.08
  const owned = ['coffee', 'coffee', 'coffeeXL']; // 0.05 + 0.05 + 0.07 = 0.17 raw
  const caps = { activity: 0.08 };
  const cmp = computeMultipliers(owned, defs, caps);
  assert.equal(cmp.raw.activity, 0.17);
  assert.equal(cmp.multipliers.activity, 0.08);
});

test('AC4: insufficient funds rejected (INSUFFICIENT_FUNDS)', () => {
  const r = purchaseUpgrade(defs, st(10), 'coffee');
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error.code, 'INSUFFICIENT_FUNDS');
});

test('AC5: computeMultipliers sums per category', () => {
  const owned = ['spd1', 'coffee', 'coffee'];
  const cmp = computeMultipliers(owned, defs, { travel: 1, activity: 1 });
  assert.equal(cmp.raw.travel, 0.1);
  assert.equal(cmp.raw.activity, 0.1); // 0.05 + 0.05
});

test('AC6: computeMultipliers purity (inputs unchanged)', () => {
  const owned = ['coffee'];
  const ownedClone = [...owned];
  const defsClone = defs.map(d => ({ ...d }));
  computeMultipliers(owned, defs, { activity: 1 });
  assert.deepEqual(owned, ownedClone);
  assert.deepEqual(defs.map(d => ({ ...d })), defsClone); // defs not mutated
});

test('Edge: cap clamp with many non-unique purchases', () => {
  const owned = Array(10).fill('coffee'); // 10 * 0.05 = 0.5 raw (allow float tolerance)
  const cmp = computeMultipliers(owned, defs, { activity: 0.2 });
  assert.ok(Math.abs(cmp.raw.activity - 0.5) < 1e-9);
  assert.equal(cmp.multipliers.activity, 0.2);
});

test('Error: UNKNOWN_UPGRADE when id not found', () => {
  const r = purchaseUpgrade(defs, st(1000), 'nope');
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error.code, 'UNKNOWN_UPGRADE');
});

test('Error: INVALID_VALUE for negative cost definition', () => {
  const r = purchaseUpgrade(defs, st(1000), 'bad');
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error.code, 'INVALID_VALUE');
});
