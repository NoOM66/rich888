import { PlayerStatsController } from './PlayerStatsController';
import { PlayerData, DefaultPlayerData } from './PlayerData';
import { StatType } from './StatType';
import { GameManager, GameState } from './GameManager';
import { GlobalEventEmitter } from './GlobalEventEmitter';

// Mock GameManager
jest.mock('./GameManager', () => {
  const actualGameManager = jest.requireActual('./GameManager');
  const mockGameManagerInstance = {
    gameOver: jest.fn(),
    CurrentState: actualGameManager.GameState.MainMenu,
  };
  return {
    ...actualGameManager,
    GameManager: {
      instance: mockGameManagerInstance,
    },
  };
});

describe('PlayerStatsController', () => {
  let playerStatsController: PlayerStatsController;
  let gameManagerMock: typeof GameManager.instance;

  beforeEach(() => {
    // Reset the singleton instance before each test
    // @ts-ignore
    PlayerStatsController._instance = null;
    playerStatsController = PlayerStatsController.instance;

    gameManagerMock = GameManager.instance;
    jest.clearAllMocks();
  });

  it('should be a singleton', () => {
    const instance1 = PlayerStatsController.instance;
    const instance2 = PlayerStatsController.instance;
    expect(instance1).toBe(instance2);
  });

  it('should initialize with default player data', () => {
    expect(playerStatsController.getPlayerData()).toEqual(DefaultPlayerData);
  });

  it('should load player data correctly', () => {
    const testData: PlayerData = {
      money: 500,
      health: 75,
      happiness: 80,
      education: 50,
      stress: 20,
      bankBalance: 1000, // Added
      activeLoans: [],   // Added
    };
    playerStatsController.loadPlayerData(testData);
    expect(playerStatsController.getPlayerData()).toEqual(testData);
  });

  it('should emit onStatChanged event when stat changes', () => {
    const emitSpy = jest.spyOn(GlobalEventEmitter.instance, 'emit');
    playerStatsController.addMoney(100);
    expect(emitSpy).toHaveBeenCalledWith('onStatChanged', StatType.Money, 1100, 1000);
  });

  it('should add money correctly', () => {
    playerStatsController.addMoney(500);
    expect(playerStatsController.getPlayerData().money).toBe(1500);
  });

  it('should decrease money correctly', () => {
    playerStatsController.decreaseMoney(200);
    expect(playerStatsController.getPlayerData().money).toBe(800);
  });

  it('should clamp money at 0', () => {
    playerStatsController.decreaseMoney(2000);
    expect(playerStatsController.getPlayerData().money).toBe(0);
  });

  it('should apply health change correctly and clamp', () => {
    playerStatsController.applyHealthChange(-20);
    expect(playerStatsController.getPlayerData().health).toBe(80);
    playerStatsController.applyHealthChange(50);
    expect(playerStatsController.getPlayerData().health).toBe(100);
    playerStatsController.applyHealthChange(-200);
    expect(playerStatsController.getPlayerData().health).toBe(0);
  });

  it('should apply happiness change correctly and clamp', () => {
    playerStatsController.applyHappinessChange(-30);
    expect(playerStatsController.getPlayerData().happiness).toBe(70);
    playerStatsController.applyHappinessChange(40);
    expect(playerStatsController.getPlayerData().happiness).toBe(100);
    playerStatsController.applyHappinessChange(-150);
    expect(playerStatsController.getPlayerData().happiness).toBe(0);
  });

  it('should apply education change correctly and clamp', () => {
    playerStatsController.applyEducationChange(10);
    expect(playerStatsController.getPlayerData().education).toBe(10);
    playerStatsController.applyEducationChange(100);
    expect(playerStatsController.getPlayerData().education).toBe(100);
    playerStatsController.applyEducationChange(-5);
    expect(playerStatsController.getPlayerData().education).toBe(95);
  });

  it('should apply stress change correctly and clamp', () => {
    playerStatsController.applyStressChange(10);
    expect(playerStatsController.getPlayerData().stress).toBe(10);
    playerStatsController.applyStressChange(100);
    expect(playerStatsController.getPlayerData().stress).toBe(100);
    playerStatsController.applyStressChange(-5);
    expect(playerStatsController.getPlayerData().stress).toBe(95);
  });

  it('should emit onPlayerLost and call GameManager.gameOver when health drops to 0', () => {
    const emitSpy = jest.spyOn(GlobalEventEmitter.instance, 'emit');
    playerStatsController.applyHealthChange(-100);
    expect(playerStatsController.getPlayerData().health).toBe(0);
    expect(emitSpy).toHaveBeenCalledWith('onPlayerLost');
    expect(gameManagerMock.gameOver).toHaveBeenCalled();
  });

  it('should emit onPlayerLost and call GameManager.gameOver when happiness drops to 0', () => {
    const emitSpy = jest.spyOn(GlobalEventEmitter.instance, 'emit');
    playerStatsController.applyHappinessChange(-100);
    expect(playerStatsController.getPlayerData().happiness).toBe(0);
    expect(emitSpy).toHaveBeenCalledWith('onPlayerLost');
    expect(gameManagerMock.gameOver).toHaveBeenCalled();
  });

  it('should not emit onPlayerLost if health/happiness is not 0', () => {
    const emitSpy = jest.spyOn(GlobalEventEmitter.instance, 'emit');
    playerStatsController.applyHealthChange(-50);
    expect(playerStatsController.getPlayerData().health).toBe(50);
    expect(emitSpy).not.toHaveBeenCalledWith('onPlayerLost');
    expect(gameManagerMock.gameOver).not.toHaveBeenCalled();
  });
});