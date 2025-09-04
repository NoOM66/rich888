import { initWeek } from '../src/systems/time/weekState';
import { simulatePlan } from '../src/systems/forecast/forecast';
import { simulateWeek } from '../src/integration/weeklyFlow';
import { computeMultipliers } from '../src/systems/upgrade/upgrades';

// Sample data
const upgradeDefs = [
  { id: 'u_reward_small', category: 'reward', cost: 20, bonusPercent: 0.1, unique: true },
  { id: 'u_act_speed', category: 'activityTimeEfficiency', cost: 30, bonusPercent: 0.08, unique: true },
  { id: 'u_travel_speed', category: 'travel', cost: 25, bonusPercent: 0.15, unique: true },
];

const activitiesCatalog = [
  { id: 'work-basic', timeCost: 4, rewards: { money: 80 }, tags:['WORK'] },
  { id: 'study-online', timeCost: 3, rewards: { education: 5 }, tags:['STUDY'] },
  { id: 'exercise-run', timeCost: 2, rewards: { health: 4 }, tags:['HEALTH'] },
  { id: 'social-meet', timeCost: 2, rewards: { happiness: 3 }, tags:['FUN'] },
];

let chosen: any[] = [];
let owned: string[] = [];
const baseHours = 40;
const thresholds = { money: 150, health: 10, happiness: 10, education: 10 };

const catalogEl = document.getElementById('activity-catalog')!;
const chosenCountEl = document.getElementById('chosen-count')!;
const upgradeCatalogEl = document.getElementById('upgrade-catalog')!;
const ownedEl = document.getElementById('owned-upgrades')!;
const forecastOut = document.getElementById('forecast-output')!;
const simulateOut = document.getElementById('simulate-output')!;
const execLogPre = document.getElementById('exec-log')!;

function renderCatalog() {
  catalogEl.innerHTML = '';
  activitiesCatalog.forEach(act => {
    const btn = document.createElement('button');
    btn.textContent = `${act.id} (${act.timeCost}h)`;
    btn.onclick = () => { chosen.push(act); chosenCountEl.textContent = String(chosen.length); };
    catalogEl.appendChild(btn);
  });
}

function renderUpgrades() {
  upgradeCatalogEl.innerHTML = '';
  upgradeDefs.forEach(up => {
    const btn = document.createElement('button');
    const ownedFlag = owned.includes(up.id) ? '✅' : '';
    btn.textContent = `${up.id} +${(up.bonusPercent*100).toFixed(0)}% [${up.category}] ${ownedFlag}`;
    btn.disabled = owned.includes(up.id) && up.unique;
    btn.onclick = () => { if (!owned.includes(up.id)) { owned.push(up.id); ownedEl.textContent = owned.join(', ') || '(none)'; } renderUpgrades(); };
    upgradeCatalogEl.appendChild(btn);
  });
  ownedEl.textContent = owned.length ? owned.join(', ') : '(none)';
}

function getUpgradeMultiplierMap() {
  const mult = computeMultipliers(owned, upgradeDefs, {}).multipliers;
  return {
    reward: mult['reward'] || 0,
    activityTimeEfficiency: mult['activityTimeEfficiency'] || 0,
    travel: mult['travel'] || 0,
  };
}

function runForecast() {
  const week = initWeek(baseHours, 0);
  const forecast = simulatePlan({
    week,
    tentativeActivities: chosen,
    obligationTags: [],
    upgradeMultipliers: getUpgradeMultiplierMap(),
  });
  forecastOut.innerHTML = `
    <p>Time Usage: ${forecast.timeUsage.total}h (Activities ${forecast.timeUsage.activityTime} + Travel ${forecast.timeUsage.travelTime})</p>
    <p>Net Deltas: ${Object.entries(forecast.netDeltas).map(([k,v])=>`${k}:${v}`).join(' | ')}</p>
    <p>Warnings: ${forecast.warnings.length ? forecast.warnings.join(', ') : 'None'}</p>
  `;
}

function runSimulation() {
  const res = simulateWeek({
    baseHours,
    carryOverPenalty: 0,
    initialBars: { money: 50, health: 0, happiness: 0, education: 0 },
    barThresholds: thresholds,
    activities: chosen,
    obligations: [],
    upgradeDefs,
    plannedPurchases: owned,
    summary: { enable: true },
    victory: { enable: true, currentWeek: 1 },
  });
  simulateOut.innerHTML = `
    <p>Bars After: money=${res.barsAfterPenalties.money} health=${res.barsAfterPenalties.health} happiness=${res.barsAfterPenalties.happiness} education=${res.barsAfterPenalties.education}</p>
    <p>Final Money (after finance): ${res.finalMoney}</p>
    <p>Victory: <span class="${res.victory?.isVictory ? 'success':'warn'}">${res.victory?.isVictory ? 'YES':'NO'}</span></p>
    <p>Summary Advisory: ${(res.summary?.advisoryMessages||[]).join(', ') || 'None'}</p>
  `;
  execLogPre.textContent = JSON.stringify(res.activities.log, null, 2);
}

document.getElementById('btn-forecast')!.addEventListener('click', runForecast);
document.getElementById('btn-simulate')!.addEventListener('click', runSimulation);
document.getElementById('btn-clear')!.addEventListener('click', () => { chosen = []; chosenCountEl.textContent = '0'; forecastOut.innerHTML=''; simulateOut.innerHTML=''; execLogPre.textContent=''; });

renderCatalog();
renderUpgrades();

// Expose for console tinkering
(window as any).addUpgrade = (id: string) => { if (!owned.includes(id)) owned.push(id); };
(window as any).listUpgrades = () => upgradeDefs;
(window as any).owned = owned;