import { GameManager, GameState } from './GameManager';
import { GlobalEventEmitter } from './GlobalEventEmitter';

describe('GameManager', () => {
  let gameManager: GameManager;

  beforeEach(() => {
    // Reset the singleton instance before each test to ensure isolation
    // @ts-ignore
    GameManager._instance = null;
    gameManager = GameManager.instance;
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be a singleton', () => {
    const instance1 = GameManager.instance;
    const instance2 = GameManager.instance;
    expect(instance1).toBe(instance2);
  });

  it('should initialize with MainMenu state', () => {
    expect(gameManager.CurrentState).toBe(GameState.MainMenu);
  });

  it('should change state correctly', () => {
    gameManager.changeState(GameState.GamePlaying);
    expect(gameManager.CurrentState).toBe(GameState.GamePlaying);

    gameManager.changeState(GameState.GameOver);
    expect(gameManager.CurrentState).toBe(GameState.GameOver);
  });

  it('should emit onGameStateChanged event when state changes', () => {
    const emitSpy = jest.spyOn(GlobalEventEmitter.instance, 'emit'); // Spy on GlobalEventEmitter

    gameManager.changeState(GameState.GamePlaying);
    expect(emitSpy).toHaveBeenCalledWith('onGameStateChanged', GameState.GamePlaying);

    gameManager.changeState(GameState.Paused);
    expect(emitSpy).toHaveBeenCalledWith('onGameStateChanged', GameState.Paused);

    expect(emitSpy).toHaveBeenCalledTimes(2);
  });

  it('should not emit event if state does not change', () => {
    const emitSpy = jest.spyOn(GlobalEventEmitter.instance, 'emit'); // Spy on GlobalEventEmitter

    gameManager.changeState(GameState.MainMenu); // Already in MainMenu
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should handle specific state change functions', () => {
    const emitSpy = jest.spyOn(GlobalEventEmitter.instance, 'emit'); // Spy on GlobalEventEmitter

    gameManager.startGame();
    expect(gameManager.CurrentState).toBe(GameState.GamePlaying);
    expect(emitSpy).toHaveBeenCalledWith('onGameStateChanged', GameState.GamePlaying);
    emitSpy.mockClear();

    gameManager.pauseGame();
    expect(gameManager.CurrentState).toBe(GameState.Paused);
    expect(emitSpy).toHaveBeenCalledWith('onGameStateChanged', GameState.Paused);
    emitSpy.mockClear();

    gameManager.resumeGame();
    expect(gameManager.CurrentState).toBe(GameState.GamePlaying);
    expect(emitSpy).toHaveBeenCalledWith('onGameStateChanged', GameState.GamePlaying);
    emitSpy.mockClear();

    gameManager.gameOver();
    expect(gameManager.CurrentState).toBe(GameState.GameOver);
    expect(emitSpy).toHaveBeenCalledWith('onGameStateChanged', GameState.GameOver);
    emitSpy.mockClear();

    gameManager.goToMainMenu();
    expect(gameManager.CurrentState).toBe(GameState.MainMenu);
    expect(emitSpy).toHaveBeenCalledWith('onGameStateChanged', GameState.MainMenu);
  });

  it('should not resume game if not in Paused state', () => {
    const emitSpy = jest.spyOn(GlobalEventEmitter.instance, 'emit'); // Spy on GlobalEventEmitter

    gameManager.startGame(); // GamePlaying
    expect(gameManager.CurrentState).toBe(GameState.GamePlaying);
    emitSpy.mockClear(); // Clear calls from startGame

    gameManager.resumeGame(); // Try to resume from GamePlaying
    expect(gameManager.CurrentState).toBe(GameState.GamePlaying);
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
