import test from 'node:test';
import assert from 'node:assert/strict';
import { simulatePlan } from '../../systems/forecast/forecast.js';
import { initWeek } from '../../systems/time/weekState.js';
import { ObligationConfig } from '../../systems/status/obligations.js';

function randInt(max: number) { return Math.floor(Math.random() * max); }

test('Fuzz: forecast penalty projection deterministic under random obligations', () => {
  const week = initWeek(40, 0);
  for (let i = 0; i < 25; i++) {
    const acts = Array.from({ length: 5 }, (_, a) => ({ id: 'A'+a, timeCost: 1+ a, rewards: { money: a*10 }, tags: a % 2 ===0 ? ['TAG'+(a%3)] : [] }));
    const obligations: ObligationConfig[] = Array.from({ length: 4 }, (_, o) => ({
      id: 'O'+o,
      tag: 'TAG'+(o%3),
      frequencyPerWeek: randInt(3),
      penaltyType: 'P'+(o%2),
      penaltyValue: 2 + randInt(5),
      capPerCategory: 10,
    }));
    const r1 = simulatePlan({ week, tentativeActivities: acts as any, obligationTags: obligations.map(o=>o.tag), obligationConfigs: obligations });
    const r2 = simulatePlan({ week, tentativeActivities: acts as any, obligationTags: obligations.map(o=>o.tag), obligationConfigs: obligations });
    assert.deepEqual(r1.projectedPenalties, r2.projectedPenalties);
  }
});
