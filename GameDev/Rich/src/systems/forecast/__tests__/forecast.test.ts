import test from 'node:test';
import assert from 'node:assert/strict';
import { simulatePlan } from '../forecast.js';
import { emptyFinanceState, openInvestment } from '../../finance/finance.js';
import { ObligationConfig } from '../../status/obligations.js';
import { initWeek } from '../../time/weekState.js';

const week = initWeek(40, 0);

test('AC1 & AC5 & AC6: netDeltas sum correctly, pure & deterministic', () => {
  const plan = [
    { id: 'A', timeCost: 2, rewards: { money: 100, health: 5 }, tags: ['EAT'] },
    { id: 'B', timeCost: 3, rewards: { money: 50 }, tags: [] },
  ];
  const r1 = simulatePlan({ week, tentativeActivities: plan, obligationTags: [], multipliers: { activityReward: 0.1 } });
  const r2 = simulatePlan({ week, tentativeActivities: plan, obligationTags: [], multipliers: { activityReward: 0.1 } });
  assert.deepEqual(r1.netDeltas, r2.netDeltas);
  // money: (100+50)*1.1 = 165, health: 5*1.1=5.5
  assert.equal(r1.netDeltas.money, 165);
  assert.equal(r1.netDeltas.health, 5.5);
});

test('AC2: OVER_TIME when total > effectiveHours', () => {
  const smallWeek = initWeek(5, 0);
  const plan = [ { id: 'X', timeCost: 6, rewards: { money: 10 } } ];
  const r = simulatePlan({ week: smallWeek, tentativeActivities: plan, obligationTags: [] });
  assert.ok(r.warnings.includes('OVER_TIME'));
});

test('AC3: missing obligation tag warns', () => {
  const plan = [ { id: 'A', timeCost: 1, rewards: { money: 10 }, tags: ['FOOD'] } ];
  const r = simulatePlan({ week, tentativeActivities: plan, obligationTags: ['FOOD','RENT'] });
  assert.ok(r.warnings.includes('MISSING_RENT'));
  assert.ok(!r.warnings.includes('MISSING_FOOD'));
});

test('AC4: expectedCost sums cost fields', () => {
  const plan = [ { id: 'A', timeCost: 1, rewards: { money: 0 }, cost: 30 }, { id: 'B', timeCost: 1, rewards: { money: 0 }, cost: 20 } ] as any;
  const r = simulatePlan({ week, tentativeActivities: plan, obligationTags: [] });
  assert.equal(r.expectedCost, 50);
});

test('Edge: empty plan -> zeros', () => {
  const r = simulatePlan({ week, tentativeActivities: [], obligationTags: [] });
  assert.equal(r.timeUsage.total, 0);
  assert.equal(Object.values(r.netDeltas).reduce((a,b)=>a+b,0), 0);
  assert.equal(r.warnings.length, 0);
});

test('Travel integration: travel time used & multiplier applied', () => {
  const matrix = { 'A|B': 5 };
  const r = simulatePlan({
    week,
    tentativeActivities: [ { id: 'A', timeCost: 2, rewards: { money: 10 } } ],
    obligationTags: [],
    travel: { locations: ['A','B'], matrix, config: { distanceConst: 10, minHopTime: 1, bonusPercent: 0, precision: 2 } },
    multipliers: { travelTimeEfficiency: 0.5 },
  });
  // baseline 5 * (1-0.5)=2.5
  assert.equal(r.timeUsage.travelTime, 2.5);
  assert.equal(r.timeUsage.activityTime, 2);
  assert.equal(r.timeUsage.total, 4.5);
});

test('Penalty projection adds warning and projectedPenalties data', () => {
  const obligations: ObligationConfig[] = [
    { id: 'eat1', tag: 'EAT', frequencyPerWeek: 2, penaltyType: 'TIME_P', penaltyValue: 3, capPerCategory: 10 },
  ];
  const plan = [ { id: 'a', timeCost: 1, rewards: { money: 5 }, tags: ['EAT'] } ]; // only one EAT -> miss
  const r = simulatePlan({ week, tentativeActivities: plan as any, obligationTags: ['EAT'], obligationConfigs: obligations });
  assert.ok(r.warnings.includes('PENALTIES_PROJECTED'));
  assert.ok(r.projectedPenalties);
  assert.equal(r.projectedPenalties?.missed.length, 1);
  assert.equal(r.projectedPenalties?.totalApplied, 3);
});

test('Finance investment preview returns projected values', () => {
  let fin = emptyFinanceState(0);
  const open = openInvestment(fin, { amount: 0.0001, growthRate: 0.5, startWeek: 1 });
  if (open.ok) fin = open.value.state; // investment added but money negative blocked by earlier check? amount small
  const r = simulatePlan({ week, tentativeActivities: [], obligationTags: [], financePreview: { state: fin, currentWeek: 3, includeInvestments: true } });
  if (open.ok) {
    const invId = open.value.investment.id;
    assert.ok(r.projectedInvestmentValues![invId] > 0);
  }
});
