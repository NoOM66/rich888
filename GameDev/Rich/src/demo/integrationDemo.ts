import { simulateWeek, WeekSimulationInput } from '../integration/weeklyFlow.js';

const input: WeekSimulationInput = {
  baseHours: 40,
  carryOverPenalty: 0,
  initialBars: { money: 100, health: 10, happiness: 5, education: 0 },
  barThresholds: { money: 1000, health: 100, happiness: 100, education: 100 },
  activities: [
    { id: 'JOB1', timeCost: 4, rewards: { money: 200 }, tags: ['RENT'] },
    { id: 'MEAL1', timeCost: 1, rewards: { health: 3 }, tags: ['EAT'] },
    { id: 'MEAL2', timeCost: 1, rewards: { health: 3 }, tags: ['EAT'] },
  ],
  obligations: [
    { id: 'eat', tag: 'EAT', frequencyPerWeek: 3, penaltyType: 'TIME_PENALTY', penaltyValue: 2, capPerCategory: 4 },
    { id: 'rent', tag: 'RENT', frequencyPerWeek: 1, penaltyType: 'MONEY_PENALTY', penaltyValue: 100, capPerCategory: 200 },
  ],
  upgradeDefs: [
    { id: 'spd1', category: 'travel', cost: 150, bonusPercent: 0.1, unique: true },
    { id: 'coffee', category: 'activity', cost: 50, bonusPercent: 0.05, unique: false },
  ],
  plannedPurchases: ['spd1', 'coffee', 'coffee'],
  hardCaps: { activity: 0.08, travel: 0.5 },
};

const result = simulateWeek(input);
console.log('--- Integration Demo ---');
console.log('Activities money delta:', result.activities.resourceDeltas.money);
console.log('Obligations missed:', result.obligationsMissed);
console.log('Penalties (time next week / money):', result.penalties);
console.log('Purchases:', result.purchases);
console.log('Multipliers raw/applied:', result.rawMultipliers, result.multipliers);
console.log('Next week carryOverPenalty (time):', result.nextWeekCarryOverPenalty);
