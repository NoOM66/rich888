import { initWeek, allocateActivity, getRemaining } from '../systems/time/weekState.js';

interface MapLocation {
  id: string;
  name: string;
  x: number; // px within map
  y: number;
  timeCost: number;
  rewards: Record<string, number>;
  tags?: string[];
}

// Simple mock set (later can evolve into richer data / icons)
const LOCATIONS: MapLocation[] = [
  { id: 'job', name: 'Job', x: 780, y: 300, timeCost: 4, rewards: { money: 120 }, tags: ['WORK'] },
  { id: 'gym', name: 'Gym', x: 620, y: 520, timeCost: 2, rewards: { health: 6 }, tags: ['HEALTH'] },
  { id: 'uni', name: 'University', x: 930, y: 540, timeCost: 3, rewards: { education: 5 }, tags: ['STUDY'] },
  { id: 'park', name: 'Park', x: 840, y: 440, timeCost: 2, rewards: { happiness: 4 }, tags: ['FUN'] },
  { id: 'cafe', name: 'Cafe', x: 710, y: 410, timeCost: 1, rewards: { happiness: 2 }, tags: ['SOCIAL'] },
];

const week = initWeek(40, 0);
let queued: MapLocation[] = [];

// DOM refs
const mapEl = document.getElementById('map')!;
const logEl = document.getElementById('log')!;
const qCountEl = document.getElementById('queue-count')!;
const selectedNameEl = document.getElementById('selected-name')!;
const spentEl = document.getElementById('hours-spent')!;
const remEl = document.getElementById('hours-remaining')!;
const baseEl = document.getElementById('hours-base')!;
const effEl = document.getElementById('hours-effective')!;
const forecastSummaryEl = document.getElementById('forecast-summary')!;

baseEl.textContent = String(week.baseHours);
effEl.textContent = String(week.effectiveHours);
updateHours();

function updateHours() {
  const spent = queued.reduce((s, q) => s + q.timeCost, 0);
  spentEl.textContent = String(spent);
  remEl.textContent = (getRemaining(week) - spent).toFixed(2);
}

function log(line: string) {
  const div = document.createElement('div');
  div.textContent = line;
  logEl.prepend(div);
}

function addPin(loc: MapLocation) {
  const wrap = document.createElement('div');
  wrap.className = 'pin';
  wrap.style.left = loc.x + 'px';
  wrap.style.top = loc.y + 'px';
  const btn = document.createElement('button');
  btn.title = `${loc.name} (+${Object.entries(loc.rewards).map(([k,v])=>`${k}:${v}`).join(', ')} / ${loc.timeCost}h)`;
  btn.textContent = loc.name[0].toUpperCase();
  btn.onclick = () => {
    queued.push(loc);
    qCountEl.textContent = String(queued.length);
    selectedNameEl.textContent = loc.name;
    updateHours();
  };
  wrap.appendChild(btn);
  mapEl.appendChild(wrap);
}

LOCATIONS.forEach(addPin);

// Actions
(document.getElementById('btn-clear') as HTMLButtonElement).onclick = () => {
  queued = [];
  qCountEl.textContent = '0';
  selectedNameEl.textContent = '(none)';
  forecastSummaryEl.innerHTML = '';
  updateHours();
  log('Cleared plan');
};

(document.getElementById('btn-forecast') as HTMLButtonElement).onclick = () => {
  const spent = queued.reduce((s,l)=>s+l.timeCost,0);
  const remaining = getRemaining(week);
  const over = spent > remaining;
  forecastSummaryEl.innerHTML = `Plan Time: <span class="pill">${spent}h</span>${over?'<span class="warn">OVER</span>':''}`;
  log(`Forecast run. Activities=${queued.length} TotalTime=${spent} Over=${over}`);
};

(document.getElementById('btn-sim') as HTMLButtonElement).onclick = () => {
  // Very minimal simulation: allocate each until cannot.
  let state = week;
  let success = 0;
  for (const act of queued) {
    const alloc = allocateActivity(state, act.timeCost);
    if (!alloc.ok) break;
    state = alloc.value;
    success++;
  }
  log(`Simulated week: executed ${success}/${queued.length} queued`);
};

// expose small debug helpers
(window as any).queue = () => queued.map(q=>q.id);
(window as any).remaining = () => getRemaining(week) - queued.reduce((s,q)=>s+q.timeCost,0);
