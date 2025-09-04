import { simulateWeek } from '../integration/weeklyFlow.js';
import { issueLoan, emptyFinanceState, openInvestment, earlyRepayLoan } from '../systems/finance/finance.js';
import { purchaseUpgrade, computeMultipliers } from '../systems/upgrade/upgrades.js';
import { evaluateVictory } from '../systems/victory/victory.js';

// Minimal demo script: simulate one week with summary + victory preview
const upgradeDefs = [
  { id: 'u_reward_1', category: 'reward', cost: 20, bonusPercent: 0.1, unique: true },
  { id: 'u_speed_act', category: 'activityTimeEfficiency', cost: 15, bonusPercent: 0.05, unique: true },
];

let finance = emptyFinanceState(100);
const loanR = issueLoan(finance, { amount: 50, weeklyRate: 0.05, termWeeks: 5, startWeek: 0, penaltyRate: 5 });
if (loanR.ok) finance = loanR.value.state;
const invR = openInvestment(finance, { amount: 20, growthRate: 0.1, startWeek: 0 });
if (invR.ok) finance = invR.value.state;

const weekResult = simulateWeek({
  baseHours: 40,
  carryOverPenalty: 0,
  initialBars: { money: 100, health: 10, happiness: 15, education: 5 },
  barThresholds: { money: 200, health: 20, happiness: 25, education: 10 },
  activities: [
    { id: 'work:job', timeCost: 5, rewards: { money: 60 } },
    { id: 'study:course', timeCost: 3, rewards: { education: 4 } },
    { id: 'fun:game', timeCost: 2, rewards: { happiness: 3 } },
  ],
  obligations: [],
  upgradeDefs,
  plannedPurchases: ['u_reward_1','u_speed_act'],
  finance: { state: finance, weeklyPenaltyRate: 5, currentWeek: 0, enableInvestmentsEvaluation: true },
  summary: { enable: true, maxEntries: 10 },
  victory: { enable: true, currentWeek: 1 },
});

console.log('Week Summary Totals:', weekResult.summary?.resourceTotals);
console.log('Purchases:', weekResult.purchases);
console.log('Victory?', weekResult.victory);

// Early repay demonstration (if enough money)
if (weekResult.financeState && weekResult.financeState.loans[0]) {
  const loan = weekResult.financeState.loans[0];
  const repay = earlyRepayLoan(weekResult.financeState, loan.id, 10);
  if (repay.ok) console.log('Early repaid 10, remaining principal:', repay.value.loan.principalRemaining.toFixed(2));
}
import { initWeek, allocateTravel, allocateActivity, getRemaining } from '../systems/time/weekState.js';

function log(label: string, data: any) {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(data, null, 2));
}

// Scenario: base 40h, penalty 8h
const week = initWeek(40, 8); // effective 32
log('Init Week', week);
console.log('Remaining hours:', getRemaining(week));

// Allocate travel 5h twice
const t1 = allocateTravel(week, 5);
if (!t1.ok) throw new Error('Unexpected travel failure 1');
const afterT1 = t1.value;
const t2 = allocateTravel(afterT1, 5);
if (!t2.ok) throw new Error('Unexpected travel failure 2');
const afterT2 = t2.value;
log('After Travel x2', afterT2);
console.log('Remaining hours:', getRemaining(afterT2));

// Try over-allocate activity (should fail)
const actFail = allocateActivity(afterT2, 30); // 10 travel + 30 activity = 40 > 32 effective
log('Attempt Over Allocation Activity 30h', actFail);
console.log('State unchanged (spentActivity should be 0):', afterT2.spentActivity);

// Valid activity allocation 10h
const actOk = allocateActivity(afterT2, 10);
if (!actOk.ok) throw new Error('Expected success for 10h activity');
const afterAct = actOk.value;
log('After Valid Activity 10h', afterAct);
console.log('Remaining hours:', getRemaining(afterAct));

// Penalty floor demo
const penalizedWeek = initWeek(40, 500); // huge penalty triggers floor 4h
log('Floor Penalty Week', penalizedWeek);
console.log('Remaining hours:', getRemaining(penalizedWeek));

// Negative / zero hours validation
const bad = allocateTravel(afterAct, 0);
log('Zero Hours Allocation Attempt', bad);

console.log('\nDemo complete.');
