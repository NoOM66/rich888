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
