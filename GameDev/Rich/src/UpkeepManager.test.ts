import { UpkeepManager } from './UpkeepManager';
import { UpkeepItem } from './UpkeepItem';
import { UpkeepItems } from './UpkeepItemsData';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';
import { InflationManager } from './InflationManager';
import { PlayerStatsController } from './PlayerStatsController';
import { StatType } from './StatType';

// Mock dependencies
const mockGlobalEventEmitterInstance = {
  on: jest.fn(),
  emit: jest.fn(),
};

const TurnManager.instance = {
  currentWeek: 1,
};

const mockInflationManagerInstance = {
  CurrentInflationRate: 0.02, // Default inflation rate for tests
};

const mockPlayerStatsControllerInstance = {
  getPlayerData: jest.fn(),
  decreaseMoney: jest.fn(),
  applyHealthChange: jest.fn(),
  applyHappinessChange: jest.fn(),
  applyStressChange: jest.fn(),
  applyEducationChange: jest.fn(),
  addMoney: jest.fn(),
  addBankBalance: jest.fn(),
};

jest.mock('./GlobalEventEmitter', () => ({
  GlobalEventEmitter: {
    get instance() {
      return mockGlobalEventEmitterInstance;
    },
  },
}));

jest.mock('./TurnManager', () => ({
  TurnManager: {
    get instance() {
      return TurnManager.instance;
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

jest.mock('./PlayerStatsController', () => ({
  PlayerStatsController: {
    get instance() {
      return mockPlayerStatsControllerInstance;
    },
  },
}));

describe('UpkeepManager', () => {
  let upkeepManager: UpkeepManager;

  const foodItem: UpkeepItem = UpkeepItems.find(item => item.id === 'food')!;
  const rentItem: UpkeepItem = UpkeepItems.find(item => item.id === 'rent')!;

  beforeEach(() => {
    jest.clearAllMocks();

    

    // Re-initialize UpkeepManager to ensure fresh state for each test
    (UpkeepManager as any).instance = null;
    upkeepManager = UpkeepManager.getInstance();
  });

  // 6.1. เทสว่า Upkeep Item ถูกตรวจสอบตามความถี่ที่ถูกต้อง
  describe('handleWeekStart', () => {
    it('should process upkeep items based on their frequency', () => {
      const spyProcessUpkeepPayment = jest.spyOn(upkeepManager as any, 'processUpkeepPayment');

      // Simulate week 1 (food should be due)
      (upkeepManager as any).handleWeekStart(1);
      expect(spyProcessUpkeepPayment).toHaveBeenCalledWith(foodItem, expect.any(Number));
      expect(spyProcessUpkeepPayment).not.toHaveBeenCalledWith(rentItem, expect.any(Number)); // Rent is every 4 weeks

      spyProcessUpkeepPayment.mockClear();

      // Simulate week 4 (food and rent should be due)
      (upkeepManager as any).handleWeekStart(4);
      expect(spyProcessUpkeepPayment).toHaveBeenCalledWith(foodItem, expect.any(Number));
      expect(spyProcessUpkeepPayment).toHaveBeenCalledWith(rentItem, expect.any(Number));

      spyProcessUpkeepPayment.mockRestore();
    });
  });

  // 6.2. เทสการปรับค่าใช้จ่ายตามเงินเฟ้อ
  describe('adjusted cost calculation', () => {
    it('should calculate adjusted cost based on inflation rate', () => {
      InflationManager.instance.CurrentInflationRate = 0.05; // 5% inflation
      const expectedAdjustedCost = foodItem.baseCost * (1 + 0.05);

      const spyProcessUpkeepPayment = jest.spyOn(upkeepManager as any, 'processUpkeepPayment');
      (upkeepManager as any).handleWeekStart(1);
      expect(spyProcessUpkeepPayment).toHaveBeenCalledWith(foodItem, expectedAdjustedCost);
      spyProcessUpkeepPayment.mockRestore();
    });
  });

  // 6.3. เทสกรณีจ่ายสำเร็จ (หักเงิน, เปลี่ยนค่าสถานะ, แจ้งเตือน)
  describe('processUpkeepPayment (success)', () => {
    it('should deduct money, apply success stat change, and emit event if money is sufficient', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 1000,
        health: 100,
      } as any);
      const adjustedCost = 51;

      (upkeepManager as any).processUpkeepPayment(foodItem, adjustedCost);

      expect(PlayerStatsController.instance.decreaseMoney).toHaveBeenCalledWith(adjustedCost);
      expect(PlayerStatsController.instance.applyHealthChange).toHaveBeenCalledWith(foodItem.statChangeOnSuccess);
      expect(GlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onUpkeepPaid', foodItem, adjustedCost);
      expect(console.log).toHaveBeenCalledWith(`Paid for ${foodItem.itemName}. Cost: ${adjustedCost.toFixed(2)}.`);
    });
  });

  // 6.4. เทสกรณีจ่ายไม่สำเร็จ (ไม่หักเงิน, ลงโทษ, แจ้งเตือน)
  describe('processUpkeepPayment (failure)', () => {
    it('should apply failure stat change and emit event if money is insufficient', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 10,
        health: 100,
      } as any);
      const adjustedCost = 51;

      (upkeepManager as any).processUpkeepPayment(foodItem, adjustedCost);

      expect(PlayerStatsController.instance.decreaseMoney).not.toHaveBeenCalled();
      expect(PlayerStatsController.instance.applyHealthChange).toHaveBeenCalledWith(foodItem.statChangeOnFailure);
      expect(GlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onUpkeepMissed', foodItem, adjustedCost);
      expect(console.warn).toHaveBeenCalledWith(`Missed payment for ${foodItem.itemName}. Penalty applied.`);
    });
  });
});