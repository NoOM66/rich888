import { SaveLoadManager } from './SaveLoadManager';
import { PlayerStatsController } from './PlayerStatsController';
import { TurnManager } from './TurnManager';
import { DefaultPlayerData } from './PlayerData';
import { GameSaveData } from './GameSaveData';
import { GlobalEventEmitter } from './GlobalEventEmitter';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock PlayerStatsController
jest.mock('./PlayerStatsController', () => ({
  PlayerStatsController: {
    instance: {
      getPlayerData: jest.fn(() => ({ ...DefaultPlayerData, money: 1000, health: 100, happiness: 100, education: 0, stress: 0, bankBalance: 0, activeLoans: [] })),
      loadPlayerData: jest.fn(),
    },
  },
}));

// Mock TurnManager
jest.mock('./TurnManager', () => ({
  TurnManager: {
    instance: {
      currentWeek: 0,
      timeBudget: 168,
      startNewWeek: jest.fn(),
      endCurrentWeek: jest.fn(),
      trySpendTime: jest.fn(),
      // @ts-ignore
      DEFAULT_WEEKLY_BUDGET: 168, // Expose for mock
    },
  },
}));

describe('SaveLoadManager', () => {
  let saveLoadManager: SaveLoadManager;
  let playerStatsControllerMock: typeof PlayerStatsController.instance;
  let turnManagerMock: typeof TurnManager.instance;

  beforeEach(() => {
    // Reset the singleton instance before each test
    // @ts-ignore
    SaveLoadManager._instance = null;
    saveLoadManager = SaveLoadManager.instance;

    // Clear localStorage mock
    localStorageMock.clear();
    jest.clearAllMocks();

    playerStatsControllerMock = PlayerStatsController.instance;
    turnManagerMock = TurnManager.instance;

    // Reset mock data for PlayerStatsController and TurnManager
    (playerStatsControllerMock.getPlayerData as jest.Mock).mockReturnValue({ ...DefaultPlayerData, money: 1000, health: 100, happiness: 100, education: 0, stress: 0, bankBalance: 0, activeLoans: [] });
    turnManagerMock.currentWeek = 0;
    turnManagerMock.timeBudget = 168;
  });

  it('should be a singleton', () => {
    const instance1 = SaveLoadManager.instance;
    const instance2 = SaveLoadManager.instance;
    expect(instance1).toBe(instance2);
  });

  it('should save game data to localStorage', () => {
    saveLoadManager.saveGame();

    const expectedSaveData: GameSaveData = {
      playerData: { ...DefaultPlayerData, money: 1000, health: 100, happiness: 100, education: 0, stress: 0, bankBalance: 0, activeLoans: [] },
      currentWeek: 0,
    };

    expect(localStorageMock.setItem).toHaveBeenCalledWith(saveLoadManager['SAVE_KEY'], JSON.stringify(expectedSaveData));
  });

  it('should load game data from localStorage', () => {
    const savedData: GameSaveData = {
      playerData: { money: 2000, health: 50, happiness: 60, education: 70, stress: 30, bankBalance: 100, activeLoans: [] },
      currentWeek: 5,
    };
    localStorageMock.setItem(saveLoadManager['SAVE_KEY'], JSON.stringify(savedData));

    const loadedData = saveLoadManager.loadGame();

    expect(loadedData).toEqual(savedData);
    expect(playerStatsControllerMock.loadPlayerData as jest.Mock).toHaveBeenCalledWith(savedData.playerData);
    expect(turnManagerMock.currentWeek).toBe(savedData.currentWeek);
    expect(turnManagerMock.timeBudget).toBe(turnManagerMock['DEFAULT_WEEKLY_BUDGET']);
  });

  it('should return null if no saved game found', () => {
    expect(saveLoadManager.loadGame()).toBeNull();
  });

  it('should handle corrupted save data and return null', () => {
    localStorageMock.setItem(saveLoadManager['SAVE_KEY'], 'invalid json');
    expect(saveLoadManager.loadGame()).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(saveLoadManager['SAVE_KEY']);
  });

  it('should correctly report if save data exists', () => {
    expect(saveLoadManager.hasSaveData()).toBe(false);
    localStorageMock.setItem(saveLoadManager['SAVE_KEY'], '{}');
    expect(saveLoadManager.hasSaveData()).toBe(true);
  });

  it('should clear save data', () => {
    localStorageMock.setItem(saveLoadManager['SAVE_KEY'], '{}');
    expect(saveLoadManager.hasSaveData()).toBe(true);
    saveLoadManager.clearSaveData();
    expect(saveLoadManager.hasSaveData()).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(saveLoadManager['SAVE_KEY']);
  });
});