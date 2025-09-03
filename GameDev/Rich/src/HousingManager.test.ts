import { HousingManager } from './HousingManager';
import { Housing } from './Housing';
import { HousingOptions } from './HousingData';
import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';
import { InflationManager } from './InflationManager';
import { StatType } from './StatType';

// Mock dependencies
jest.mock('./PlayerStatsController');
jest.mock('./GlobalEventEmitter');
jest.mock('./TurnManager');
jest.mock('./InflationManager');

describe('HousingManager', () => {
  let housingManager: HousingManager;
  let mockPlayerStatsController: jest.Mocked<typeof PlayerStatsController>;
  let mockGlobalEventEmitter: jest.Mocked<typeof GlobalEventEmitter>;
  let mockTurnManager: jest.Mocked<typeof TurnManager>;
  let mockInflationManager: jest.Mocked<typeof InflationManager>;

  const smallApartment: Housing = HousingOptions.find(h => h.id === 'small_apartment')!;
  const mediumApartment: Housing = HousingOptions.find(h => h.id === 'medium_apartment')!;
  const house: Housing = HousingOptions.find(h => h.id === 'house')!;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPlayerStatsController = PlayerStatsController as jest.Mocked<typeof PlayerStatsController>;
    mockPlayerStatsController.instance = {
      getPlayerData: jest.fn(() => ({
        money: 1000,
        health: 100,
        happiness: 100,
        stress: 0,
        currentHome: null,
      })),
      updateCurrentHome: jest.fn(),
      decreaseMoney: jest.fn(),
      applyHappinessChange: jest.fn(),
      applyStressChange: jest.fn(),
    } as any;

    mockGlobalEventEmitter = GlobalEventEmitter as jest.Mocked<typeof GlobalEventEmitter>;
    mockGlobalEventEmitter.instance = {
      on: jest.fn(),
      emit: jest.fn(),
    } as any;

    mockTurnManager = TurnManager as jest.Mocked<typeof TurnManager>;
    mockTurnManager.instance = {
      currentWeek: 1,
    } as any;

    mockInflationManager = InflationManager as jest.Mocked<typeof InflationManager>;
    mockInflationManager.instance = {
      CurrentInflationRate: 0.02,
    } as any;

    // Re-initialize HousingManager to ensure fresh state for each test
    (HousingManager as any).instance = null;
    housingManager = HousingManager.getInstance();
  });

  // 9.1. เทสการเลือกที่อยู่อาศัย
  describe('selectHome', () => {
    it('should set the current home and update player data', () => {
      housingManager.selectHome(smallApartment);
      expect(housingManager.getCurrentHome()).toBe(smallApartment);
      expect(mockPlayerStatsController.instance.updateCurrentHome).toHaveBeenCalledWith(smallApartment);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onHomeSelected', smallApartment);
    });
  });

  // 9.2. เทสการหักค่าเช่า/ค่าสาธารณูปโภค (สำเร็จ/ไม่สำเร็จ) และการปรับตามเงินเฟ้อ
  describe('handleWeekStart (upkeep payments)', () => {
    beforeEach(() => {
      housingManager.selectHome(smallApartment);
      mockPlayerStatsController.instance.decreaseMoney.mockClear();
      mockGlobalEventEmitter.instance.emit.mockClear();
      jest.spyOn(housingManager as any, 'processHousingPayment');
    });

    it('should process rent and utilities payments on week 4 (and multiples of 4)', () => {
      (housingManager as any).handleWeekStart(4);
      expect((housingManager as any).processHousingPayment).toHaveBeenCalledWith(smallApartment.baseRent * (1 + mockInflationManager.instance.CurrentInflationRate), 'rent');
      expect((housingManager as any).processHousingPayment).toHaveBeenCalledWith(smallApartment.baseUtilitiesCost * (1 + mockInflationManager.instance.CurrentInflationRate), 'utilities');
    });

    it('should not process payments on other weeks', () => {
      (housingManager as any).handleWeekStart(1);
      expect((housingManager as any).processHousingPayment).not.toHaveBeenCalled();
    });
  });

  describe('processHousingPayment (success/failure)', () => {
    beforeEach(() => {
      housingManager.selectHome(smallApartment);
      mockPlayerStatsController.instance.decreaseMoney.mockClear();
      mockPlayerStatsController.instance.applyHappinessChange.mockClear();
      mockPlayerStatsController.instance.applyStressChange.mockClear();
      mockGlobalEventEmitter.instance.emit.mockClear();
    });

    // 6.3. เทสกรณีจ่ายสำเร็จ (หักเงิน, เปลี่ยนค่าสถานะ, แจ้งเตือน)
    it('should deduct money and apply happiness bonus for successful rent payment', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({ money: 200 } as any);
      const adjustedRent = smallApartment.baseRent * (1 + mockInflationManager.instance.CurrentInflationRate);
      (housingManager as any).processHousingPayment(adjustedRent, 'rent');
      expect(mockPlayerStatsController.instance.decreaseMoney).toHaveBeenCalledWith(adjustedRent);
      expect(mockPlayerStatsController.instance.applyHappinessChange).toHaveBeenCalledWith(smallApartment.happinessBonus);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onRentPaid', smallApartment, adjustedRent);
    });

    it('should deduct money for successful utilities payment', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({ money: 200 } as any);
      const adjustedUtilities = smallApartment.baseUtilitiesCost * (1 + mockInflationManager.instance.CurrentInflationRate);
      (housingManager as any).processHousingPayment(adjustedUtilities, 'utilities');
      expect(mockPlayerStatsController.instance.decreaseMoney).toHaveBeenCalledWith(adjustedUtilities);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onUtilitiesPaid', smallApartment, adjustedUtilities);
    });

    // 6.4. เทสบทลงโทษเมื่อจ่ายไม่สำเร็จ
    it('should apply penalties for missed rent payment', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({ money: 10 } as any);
      const adjustedRent = smallApartment.baseRent * (1 + mockInflationManager.instance.CurrentInflationRate);
      (housingManager as any).processHousingPayment(adjustedRent, 'rent');
      expect(mockPlayerStatsController.instance.decreaseMoney).not.toHaveBeenCalled();
      expect(mockPlayerStatsController.instance.applyStressChange).toHaveBeenCalledWith(10);
      expect(mockPlayerStatsController.instance.applyHappinessChange).toHaveBeenCalledWith(-5);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onRentMissed', smallApartment, adjustedRent);
    });

    it('should apply penalties for missed utilities payment', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({ money: 10 } as any);
      const adjustedUtilities = smallApartment.baseUtilitiesCost * (1 + mockInflationManager.instance.CurrentInflationRate);
      (housingManager as any).processHousingPayment(adjustedUtilities, 'utilities');
      expect(mockPlayerStatsController.instance.decreaseMoney).not.toHaveBeenCalled();
      expect(mockPlayerStatsController.instance.applyStressChange).toHaveBeenCalledWith(5);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onUtilitiesMissed', smallApartment, adjustedUtilities);
    });
  });

  // 9.3. เทสกลไกการอัปเกรด/ย้ายที่อยู่อาศัย
  describe('upgradeHome', () => {
    beforeEach(() => {
      housingManager.selectHome(smallApartment);
      mockPlayerStatsController.instance.updateCurrentHome.mockClear();
      mockGlobalEventEmitter.instance.emit.mockClear();
    });

    it('should allow upgrading home if requirements are met', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({ money: 1000 } as any);
      const result = housingManager.upgradeHome();
      expect(result).toBe(true);
      expect(housingManager.getCurrentHome()).toBe(mediumApartment);
      expect(mockPlayerStatsController.instance.updateCurrentHome).toHaveBeenCalledWith(mediumApartment);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onHomeUpgraded', mediumApartment);
    });

    it('should not allow upgrading if no current home or no upgrade option', () => {
      housingManager.selectHome(house);
      const result = housingManager.upgradeHome();
      expect(result).toBe(false);
      expect(housingManager.getCurrentHome()).toBe(house);
      expect(mockPlayerStatsController.instance.updateCurrentHome).not.toHaveBeenCalled();
    });

    it('should not allow upgrading if not enough money', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({ money: 10 } as any);
      const result = housingManager.upgradeHome();
      expect(result).toBe(false);
      expect(housingManager.getCurrentHome()).toBe(smallApartment);
      expect(mockPlayerStatsController.instance.updateCurrentHome).not.toHaveBeenCalled();
    });
  });

  describe('moveToHome', () => {
    beforeEach(() => {
      housingManager.selectHome(smallApartment);
      mockPlayerStatsController.instance.updateCurrentHome.mockClear();
      mockGlobalEventEmitter.instance.emit.mockClear();
    });

    it('should allow moving to a new home if requirements are met', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({ money: 1000 } as any);
      const result = housingManager.moveToHome(mediumApartment);
      expect(result).toBe(true);
      expect(housingManager.getCurrentHome()).toBe(mediumApartment);
      expect(mockPlayerStatsController.instance.updateCurrentHome).toHaveBeenCalledWith(mediumApartment);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onHomeMoved', mediumApartment);
    });

    it('should not allow moving to the same home', () => {
      const result = housingManager.moveToHome(smallApartment);
      expect(result).toBe(false);
      expect(housingManager.getCurrentHome()).toBe(smallApartment);
      expect(mockPlayerStatsController.instance.updateCurrentHome).not.toHaveBeenCalled();
    });

    it('should not allow moving if not enough money', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({ money: 10 } as any);
      const result = housingManager.moveToHome(mediumApartment);
      expect(result).toBe(false);
      expect(housingManager.getCurrentHome()).toBe(smallApartment);
      expect(mockPlayerStatsController.instance.updateCurrentHome).not.toHaveBeenCalled();
    });
  });
});