import { TurnManager } from './TurnManager';
import { GameManager, GameState } from './GameManager';

// Mock GameManager and its event emitter
jest.mock('./GameManager', () => {
  const actualGameManager = jest.requireActual('./GameManager');
  // Create a mock instance that has a writable CurrentState
  const mockGameManagerInstance = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    // Use a simple property for CurrentState in the mock
    CurrentState: actualGameManager.GameState.MainMenu,
  };

  return {
    ...actualGameManager,
    GameManager: {
      instance: mockGameManagerInstance,
    },
  };
});

describe('TurnManager', () => {
  let turnManager: TurnManager;
  let gameManagerMock: {
    on: jest.Mock;
    off: jest.Mock;
    emit: jest.Mock;
    CurrentState: GameState; // Explicitly type as writable
  };
  let onGameStateChangedCallback: Function; // To store the callback

  beforeEach(() => {
    // Reset the singleton instance before each test
    // @ts-ignore
    TurnManager._instance = null;

    // Get the mocked GameManager instance BEFORE TurnManager is instantiated
    gameManagerMock = GameManager.instance as any; // Cast to any to allow direct assignment for mock
    jest.clearAllMocks();

    // Reset initial state for GameManager mock
    gameManagerMock.CurrentState = GameState.MainMenu;

    // Instantiate TurnManager AFTER GameManager mock is ready
    turnManager = TurnManager.instance;

    // Capture the callback registered with GameManager.instance.on
    // This assumes 'on' is called once in the constructor
    onGameStateChangedCallback = gameManagerMock.on.mock.calls[0][1];
  });

  it('should be a singleton', () => {
    const instance1 = TurnManager.instance;
    const instance2 = TurnManager.instance;
    expect(instance1).toBe(instance2);
  });

  it('should initialize with week 0 and default time budget', () => {
    expect(turnManager.currentWeek).toBe(0);
    expect(turnManager.timeBudget).toBe(168);
  });

  it('should start a new week correctly', () => {
    const emitSpy = jest.spyOn(turnManager['eventEmitter'], 'emit');

    turnManager.startNewWeek();
    expect(turnManager.currentWeek).toBe(1);
    expect(turnManager.timeBudget).toBe(168);
    expect(emitSpy).toHaveBeenCalledWith('onWeekStart', 1);
  });

  it('should end current week and start a new one', () => {
    const emitSpy = jest.spyOn(turnManager['eventEmitter'], 'emit');

    // Simulate some time spent in week 0
    turnManager.trySpendTime(50);
    expect(turnManager.timeBudget).toBe(118);

    turnManager.endCurrentWeek();
    expect(emitSpy).toHaveBeenCalledWith('onWeekEnd', 0); // Week 0 ended
    expect(turnManager.currentWeek).toBe(1); // New week started
    expect(turnManager.timeBudget).toBe(168); // Budget reset
    expect(emitSpy).toHaveBeenCalledWith('onWeekStart', 1); // New week started event
    expect(emitSpy).toHaveBeenCalledTimes(2);
  });

  it('should spend time correctly if budget is sufficient', () => {
    turnManager.startNewWeek(); // Start week 1
    expect(turnManager.trySpendTime(50)).toBe(true);
    expect(turnManager.timeBudget).toBe(118);

    expect(turnManager.trySpendTime(100)).toBe(true);
    expect(turnManager.timeBudget).toBe(18);
  });

  it('should not spend time if budget is insufficient', () => {
    turnManager.startNewWeek(); // Start week 1
    expect(turnManager.trySpendTime(200)).toBe(false);
    expect(turnManager.timeBudget).toBe(168);
  });

  it('should not spend negative time', () => {
    turnManager.startNewWeek(); // Start week 1
    expect(turnManager.trySpendTime(-10)).toBe(false);
    expect(turnManager.timeBudget).toBe(168);
  });

  it('should start first week when GameManager enters GamePlaying state', () => {
    const emitSpy = jest.spyOn(turnManager['eventEmitter'], 'emit');

    // Simulate GameManager changing state to GamePlaying
    onGameStateChangedCallback.call(turnManager, GameState.GamePlaying);

    expect(turnManager.currentWeek).toBe(1);
    expect(turnManager.timeBudget).toBe(168);
    expect(emitSpy).toHaveBeenCalledWith('onWeekStart', 1);
  });

  it('should not start new week if already in a week when GameManager enters GamePlaying state', () => {
    const emitSpy = jest.spyOn(turnManager['eventEmitter'], 'emit');

    turnManager.startNewWeek(); // Manually start week 1
    emitSpy.mockClear();

    // Simulate GameManager changing state to GamePlaying again
    onGameStateChangedCallback.call(turnManager, GameState.GamePlaying);

    expect(turnManager.currentWeek).toBe(1); // Should not increment again
    expect(emitSpy).not.toHaveBeenCalledWith('onWeekStart', expect.any(Number));
  });
});
