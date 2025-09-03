import Phaser from 'phaser';
import { MainScene } from './main'; // Assuming MainScene is exported from main.ts
import { GameManager, GameState } from './GameManager';
import { TurnManager } from './TurnManager';
import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { InflationManager } from './InflationManager';
import { BankingManager } from './BankingManager';
import { StatType } from './StatType';

// Mock Phaser.Game and Phaser.Scene
jest.mock('phaser', () => ({
  Scene: jest.fn().mockImplementation(() => ({
    add: {
      text: jest.fn().mockReturnThis(),
    },
    input: {
      on: jest.fn(),
    },
  })),
  Game: jest.fn(),
  Math: {
    Clamp: jest.fn((value) => value),
  },
}));

// Mock Managers
const mockGameManagerInstance = {
  CurrentState: GameState.GamePlaying,
};

const mockTurnManagerInstance = {
  currentWeek: 1,
  timeBudget: 168,
};

const mockPlayerStatsControllerInstance = {
  getPlayerData: jest.fn(),
};

const mockGlobalEventEmitterInstance = {
  on: jest.fn(),
  emit: jest.fn(),
};

const mockInflationManagerInstance = {
  CurrentInflationRate: 0.02,
};

const BankingManager.instance

jest.mock('./GameManager', () => ({
  GameManager: {
    get instance() {
      return mockGameManagerInstance;
    },
  },
}));

jest.mock('./TurnManager', () => ({
  TurnManager: {
    get instance() {
      return mockTurnManagerInstance;
    },
  },
}));

jest.mock('./PlayerStatsController', () => ({
  PlayerStatsController: {
    get instance() {
      return mockPlayerStatsControllerInstance;
    },
  },
}));

jest.mock('./GlobalEventEmitter', () => ({
  GlobalEventEmitter: {
    get instance() {
      return mockGlobalEventEmitterInstance;
    },
  },
}));

jest.mock('./InflationManager', () => ({
  InflationManager: {
    get instance() {
      return mockInflationManagerInstance;
    },
  },
}));

jest.mock('./BankingManager', () => ({
  BankingManager: {
    // Since instance is private, we might need to mock the entire class
    // or mock the methods that MainScene interacts with directly.
    // For now, we'll leave it as an empty object and address it if it causes further issues.
    get instance() {
      return mockBankingManagerInstance;
    },
  },
}));

describe('MainScene HUD', () => {
  let mainScene: MainScene;

  beforeEach(() => {
    jest.clearAllMocks();

    

    (Phaser.Scene as jest.Mock).mockImplementation(() => ({
      add: {
        text: jest.fn().mockReturnThis(),
      },
      input: {
        on: jest.fn(),
      },
    }));

    mainScene = new MainScene();
  });

  // 5.1. เทสว่า UI Elements แสดงค่าเริ่มต้นได้ถูกต้อง
  describe('Initial UI Display', () => {
    it('should display initial values for all HUD elements', () => {
      mainScene.create();

      expect(mainScene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.stringContaining('Current State:'), expect.any(Object));
      expect(mainScene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.stringContaining('Week:'), expect.any(Object));
      expect(mainScene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.stringContaining('Time Budget:'), expect.any(Object));
      expect(mainScene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.stringContaining('Inflation:'), expect.any(Object));
      expect(mainScene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.stringContaining('Money:'), expect.any(Object));
      expect(mainScene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.stringContaining('Health:'), expect.any(Object));
      expect(mainScene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.stringContaining('Happiness:'), expect.any(Object));
      expect(mainScene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.stringContaining('Education:'), expect.any(Object));
      expect(mainScene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.stringContaining('Stress:'), expect.any(Object));
      expect(mainScene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.stringContaining('Bank:'), expect.any(Object));
      expect(mainScene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.stringContaining('No Loans'), expect.any(Object));

      expect((mainScene as any).updateTurnUI).toHaveBeenCalled();
      expect((mainScene as any).updatePlayerStatsUI).toHaveBeenCalled();
      expect((mainScene as any).updateInflationUI).toHaveBeenCalled();
      expect((mainScene as any).updateBankingUI).toHaveBeenCalled();
    });
  });

  // 5.2. เทสว่า UI Elements อัปเดตค่าได้ถูกต้องเมื่อ Event ต่างๆ ถูกยิงพร้อมค่าใหม่
  describe('UI Updates on Events', () => {
    beforeEach(() => {
      mainScene.create();
      jest.spyOn((mainScene as any).stateText, 'setText');
      jest.spyOn((mainScene as any).weekText, 'setText');
      jest.spyOn((mainScene as any).budgetText, 'setText');
      jest.spyOn((mainScene as any).moneyText, 'setText');
      jest.spyOn((mainScene as any).healthText, 'setText');
      jest.spyOn((mainScene as any).happinessText, 'setText');
      jest.spyOn((mainScene as any).educationText, 'setText');
      jest.spyOn((mainScene as any).stressText, 'setText');
      jest.spyOn((mainScene as any).inflationText, 'setText');
      jest.spyOn((mainScene as any).bankBalanceText, 'setText');
      jest.spyOn((mainScene as any).loanText, 'setText');
    });

    it('should update game state text on onGameStateChanged event', () => {
      (mainScene as any).handleGameStateChange(GameState.Paused);
      expect((mainScene as any).stateText.setText).toHaveBeenCalledWith('Current State: Paused');
    });

    it('should update week and time budget on onWeekStart event', () => {
      TurnManager.instance.currentWeek = 5;
      TurnManager.instance.timeBudget = 100;
      (mainScene as any).handleWeekStart(5);
      expect((mainScene as any).weekText.setText).toHaveBeenCalledWith('Week: 5');
      expect((mainScene as any).budgetText.setText).toHaveBeenCalledWith('Time Budget: 100 hours');
    });

    it('should update player stats on onStatChanged event', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 2000,
        health: 90,
        happiness: 80,
        education: 10,
        stress: 5,
      } as any);
      (mainScene as any).handleStatChanged(StatType.Money, 2000, 1000);
      expect((mainScene as any).moneyText.setText).toHaveBeenCalledWith('Money: 2000');
      expect((mainScene as any).healthText.setText).toHaveBeenCalledWith('Health: 90');
      expect((mainScene as any).happinessText.setText).toHaveBeenCalledWith('Happiness: 80');
      expect((mainScene as any).educationText.setText).toHaveBeenCalledWith('Education: 10');
      expect((mainScene as any).stressText.setText).toHaveBeenCalledWith('Stress: 5');
    });

    it('should update inflation text on onInflationChanged event', () => {
      InflationManager.instance.CurrentInflationRate = 0.03;
      (mainScene as any).handleInflationChanged(0.03);
      expect((mainScene as any).inflationText.setText).toHaveBeenCalledWith('Inflation: 3%');
    });

    it('should update banking UI on banking events', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 900,
        bankBalance: 600,
        activeLoans: [{ remainingAmount: 500, remainingPayments: 5 }] as any,
      } as any);
      (mainScene as any).handleBankingEvent();
      expect((mainScene as any).bankBalanceText.setText).toHaveBeenCalledWith('Bank: 600.00');
      expect((mainScene as any).loanText.setText).toHaveBeenCalledWith('Loan: 500.00 (5 payments)');
    });
  });
});