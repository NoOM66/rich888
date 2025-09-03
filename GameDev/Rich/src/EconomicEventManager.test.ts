import { EconomicEventManager } from './EconomicEventManager';
import { EconomicEvent, EconomicEventType } from './EconomicEvent';
import { EconomicEvents } from './EconomicEventsData';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { PlayerStatsController } from './PlayerStatsController';
import { InflationManager } from './InflationManager';
import { TurnManager } from './TurnManager';

// Mock dependencies
jest.mock('./GlobalEventEmitter');
jest.mock('./PlayerStatsController');
jest.mock('./InflationManager');
jest.mock('./TurnManager');

describe('EconomicEventManager', () => {
  let economicEventManager: EconomicEventManager;
  let mockGlobalEventEmitter: jest.Mocked<typeof GlobalEventEmitter>;
  let mockPlayerStatsController: jest.Mocked<typeof PlayerStatsController>;
  let mockInflationManager: jest.Mocked<typeof InflationManager>;
  let mockTurnManager: jest.Mocked<typeof TurnManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGlobalEventEmitter = GlobalEventEmitter as jest.Mocked<typeof GlobalEventEmitter>;
    mockGlobalEventEmitter.instance = {
      on: jest.fn(),
      emit: jest.fn(),
    } as any;

    mockPlayerStatsController = PlayerStatsController as jest.Mocked<typeof PlayerStatsController>;
    mockPlayerStatsController.instance = {
      addMoney: jest.fn(),
      decreaseMoney: jest.fn(),
      applyHealthChange: jest.fn(),
      applyHappinessChange: jest.fn(),
      applyEducationChange: jest.fn(),
      applyStressChange: jest.fn(),
    } as any;

    mockInflationManager = InflationManager as jest.Mocked<typeof InflationManager>;
    mockInflationManager.instance = {
      adjustInflationRate: jest.fn(),
    } as any;

    mockTurnManager = TurnManager as jest.Mocked<typeof TurnManager>;
    mockTurnManager.instance = {
      currentWeek: 1,
    } as any;

    // Re-initialize EconomicEventManager to ensure fresh state for each test
    (EconomicEventManager as any).instance = null;
    economicEventManager = EconomicEventManager.getInstance();
  });

  // 6.1. เทสว่า Event ถูกเรียกใช้ตามโอกาสที่กำหนด (อาจต้องรันหลายครั้งหรือใช้ Mock Random)
  describe('triggerRandomEvent', () => {
    it('should trigger events based on their triggerChancePerWeek', () => {
      const mockEvent: EconomicEvent = {
        id: 'test_event',
        eventName: 'Test Event',
        description: 'A test event',
        eventType: EconomicEventType.Neutral,
        triggerChancePerWeek: 0.8, // High chance for testing
      };
      // Temporarily replace the events list with our mock event
      (economicEventManager as any).events = [mockEvent];

      const spyApplyEventEffects = jest.spyOn(economicEventManager as any, 'applyEventEffects');

      // Mock Math.random to ensure event triggers
      jest.spyOn(Math, 'random').mockReturnValue(0.5); // 0.5 < 0.8, so it should trigger

      (economicEventManager as any).triggerRandomEvent();

      expect(spyApplyEventEffects).toHaveBeenCalledWith(mockEvent);
      expect(console.log).toHaveBeenCalledWith(`Triggering economic event: ${mockEvent.eventName}`);

      jest.spyOn(Math, 'random').mockRestore(); // Restore original Math.random
      spyApplyEventEffects.mockRestore();
    });

    it('should not trigger events if random value is higher than triggerChancePerWeek', () => {
      const mockEvent: EconomicEvent = {
        id: 'test_event_no_trigger',
        eventName: 'No Trigger Event',
        description: 'This event should not trigger',
        eventType: EconomicEventType.Neutral,
        triggerChancePerWeek: 0.1, // Low chance
      };
      (economicEventManager as any).events = [mockEvent];

      const spyApplyEventEffects = jest.spyOn(economicEventManager as any, 'applyEventEffects');

      jest.spyOn(Math, 'random').mockReturnValue(0.9); // 0.9 > 0.1, so it should not trigger

      (economicEventManager as any).triggerRandomEvent();

      expect(spyApplyEventEffects).not.toHaveBeenCalled();

      jest.spyOn(Math, 'random').mockRestore();
      spyApplyEventEffects.mockRestore();
    });
  });

  // 6.2. เทสว่า `ApplyEventEffects` ปรับค่าสถานะผู้เล่นและอัตราเงินเฟ้อได้ถูกต้อง
  describe('applyEventEffects', () => {
    it('should apply money change correctly', () => {
      const event: EconomicEvent = {
        id: 'money_event', eventName: 'Money Event', description: '', eventType: EconomicEventType.Positive, triggerChancePerWeek: 0, moneyChange: 100,
      };
      (economicEventManager as any).applyEventEffects(event);
      expect(mockPlayerStatsController.instance.addMoney).toHaveBeenCalledWith(100);

      const negativeEvent: EconomicEvent = {
        id: 'negative_money_event', eventName: 'Negative Money Event', description: '', eventType: EconomicEventType.Negative, triggerChancePerWeek: 0, moneyChange: -50,
      };
      (economicEventManager as any).applyEventEffects(negativeEvent);
      expect(mockPlayerStatsController.instance.decreaseMoney).toHaveBeenCalledWith(50);
    });

    it('should apply health, happiness, education, stress changes correctly', () => {
      const event: EconomicEvent = {
        id: 'stat_event', eventName: 'Stat Event', description: '', eventType: EconomicEventType.Neutral, triggerChancePerWeek: 0,
        healthChange: 10, happinessChange: -5, educationChange: 2, stressChange: -3,
      };
      (economicEventManager as any).applyEventEffects(event);
      expect(mockPlayerStatsController.instance.applyHealthChange).toHaveBeenCalledWith(10);
      expect(mockPlayerStatsController.instance.applyHappinessChange).toHaveBeenCalledWith(-5);
      expect(mockPlayerStatsController.instance.applyEducationChange).toHaveBeenCalledWith(2);
      expect(mockPlayerStatsController.instance.applyStressChange).toHaveBeenCalledWith(-3);
    });

    it('should adjust inflation rate correctly', () => {
      const event: EconomicEvent = {
        id: 'inflation_event', eventName: 'Inflation Event', description: '', eventType: EconomicEventType.Negative, triggerChancePerWeek: 0, inflationRateChange: 0.01,
      };
      (economicEventManager as any).applyEventEffects(event);
      expect(mockInflationManager.instance.adjustInflationRate).toHaveBeenCalledWith(0.01);
    });
  });

  // 6.3. เทสว่ามีการยิง Event สำหรับ UI Notification เมื่อ Event เกิดขึ้น
  describe('UI Notification Event Emission', () => {
    it('should emit onShowNotification and onEconomicEventTriggered events', () => {
      const event: EconomicEvent = {
        id: 'ui_event', eventName: 'UI Event', description: 'This is a UI notification', eventType: EconomicEventType.Neutral, triggerChancePerWeek: 0,
      };
      (economicEventManager as any).applyEventEffects(event);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onShowNotification', event.eventName, event.description);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onEconomicEventTriggered', event);
    });
  });
});