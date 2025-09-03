import { TurnManager, TurnPayload } from './TurnManager';

describe('TurnManager', () => {
  let tm: TurnManager;

  beforeEach(() => {
  // reset singleton for tests
  (TurnManager as any)._instance = null;
  tm = new TurnManager();
  });

  test('startNewWeek increments week and resets budget', () => {
    expect(tm.currentWeek).toBe(0);
    tm.startNewWeek();
    expect(tm.currentWeek).toBe(1);
    expect(tm.timeBudget).toBe(TurnManager.DEFAULT_WEEKLY_BUDGET);
  });

  test('trySpendTime reduces budget and returns true when enough', () => {
    tm.startNewWeek();
    const ok = tm.trySpendTime(8);
    expect(ok).toBe(true);
    expect(tm.timeBudget).toBe(TurnManager.DEFAULT_WEEKLY_BUDGET - 8);
  });

  test('trySpendTime returns false when not enough time', () => {
    tm.startNewWeek();
    const ok = tm.trySpendTime(TurnManager.DEFAULT_WEEKLY_BUDGET + 1);
    expect(ok).toBe(false);
    expect(tm.timeBudget).toBe(TurnManager.DEFAULT_WEEKLY_BUDGET);
  });

  test('onWeekStart and onWeekEnd events emitted', done => {
    // handle possible reentrant emits by checking payload.currentWeek
  tm.events.on('onWeekStart', (payload: TurnPayload) => {
      if (payload.currentWeek !== 1) return; // ignore subsequent emits
      expect(payload.currentWeek).toBe(1);
      expect(payload.timeBudget).toBe(TurnManager.DEFAULT_WEEKLY_BUDGET);
      // listen for week end next
      tm.events.on('onWeekEnd', (endPayload: TurnPayload) => {
        expect(endPayload.currentWeek).toBe(1);
        done();
      });
      // end the week
      tm.endCurrentWeek();
    });
    tm.startNewWeek();
  });

  test('integrates with GameManager state change', () => {
    // create a GameManager and inject its emitter into a TurnManager
    const gm = require('./GameManager').default;
    const tm2 = new TurnManager(gm.events);
    // when game enters 'playing', start first week
    gm.setState('playing');
    // simulate handler that would call startNewWeek on playing
    gm.events.on('state-changed', (s: string) => {
      if (s === 'playing') tm2.startNewWeek();
    });
    // trigger state change again
    gm.setState('playing');
    expect(tm2.currentWeek).toBe(1);
  });
});
