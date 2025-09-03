import GameManager, { GameState } from './GameManager';

describe('GameManager (basic)', () => {
  beforeEach(() => {
    GameManager._resetForTests();
  });

  test('initialization and singleton', () => {
    const gm = GameManager.init();
    expect(gm).toBeTruthy();
    expect(GameManager.instance).toBe(gm);

    // subsequent init returns same instance
    const gm2 = GameManager.init();
    expect(gm2).toBe(gm);
  });

  test('default state is MainMenu', () => {
    const gm = GameManager.init();
    expect(gm.currentState).toBe(GameState.MainMenu);
  });

  test('state transitions and events', () => {
    const gm = GameManager.init();
    const events: GameState[] = [];
    const handler = (s: GameState) => events.push(s);
    gm.onStateChanged(handler);

    gm.startNewGame();
    expect(gm.currentState).toBe(GameState.GamePlaying);

    gm.pauseGame();
    expect(gm.currentState).toBe(GameState.Paused);

    gm.endGame();
    expect(gm.currentState).toBe(GameState.GameOver);

    gm.goToMainMenu();
    expect(gm.currentState).toBe(GameState.MainMenu);

    // events captured in order (no duplicates)
    expect(events).toEqual([
      GameState.GamePlaying,
      GameState.Paused,
      GameState.GameOver,
      GameState.MainMenu,
    ]);

    gm.offStateChanged(handler);
  });
});
