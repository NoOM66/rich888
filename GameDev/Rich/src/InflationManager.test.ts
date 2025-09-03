import { InflationManager } from './InflationManager';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { GameManager, GameState } from './GameManager';

// Mock GlobalEventEmitter
jest.mock('./GlobalEventEmitter', () => ({
  GlobalEventEmitter: {
    instance: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  },
}));

// Mock Phaser.Math.FloatBetween
jest.mock('phaser', () => ({
  Math: {
    FloatBetween: jest.fn((min, max) => (min + max) / 2), // Return midpoint for predictable testing
    Clamp: jest.fn((value, min, max) => Math.max(min, Math.min(value, max))), // Keep Clamp mock
  },
  Events: {
    EventEmitter: jest.fn(), // Keep EventEmitter mock
  },
}));

describe('InflationManager', () => {
  let inflationManager: InflationManager;
  let globalEventEmitterMock: typeof GlobalEventEmitter.instance;
  let onWeekStartCallback: Function;

  beforeEach(() => {
    // Reset the singleton instance before each test
    // @ts-ignore
    InflationManager._instance = null;

    globalEventEmitterMock = GlobalEventEmitter.instance; // Get the mock instance first
    jest.clearAllMocks(); // Clear mocks before instantiation

    inflationManager = InflationManager.instance; // InflationManager constructor is called here

    // Capture the onWeekStart callback
    onWeekStartCallback = (globalEventEmitterMock.on as jest.Mock).mock.calls.find(call => call[0] === 'onWeekStart')[1];
  });

  it('should be a singleton', () => {
    const instance1 = InflationManager.instance;
    const instance2 = InflationManager.instance;
    expect(instance1).toBe(instance2);
  });

  it('should initialize with a default inflation rate', () => {
    expect(inflationManager.CurrentInflationRate).toBe(0.01); // MIN_INFLATION_RATE
  });

  it('should change inflation rate after INFLATION_CHANGE_INTERVAL_WEEKS', () => {
    const emitSpy = jest.spyOn(globalEventEmitterMock, 'emit');

    // Simulate weeks passing without change
    for (let i = 0; i < 3; i++) { // 3 weeks (interval is 4)
      onWeekStartCallback.call(inflationManager, i + 1);
      expect(emitSpy).not.toHaveBeenCalledWith('onInflationChanged', expect.any(Number));
    }

    // Simulate the 4th week, should trigger change
    onWeekStartCallback.call(inflationManager, 4);
    expect(emitSpy).toHaveBeenCalledWith('onInflationChanged', 0.03); // Expected rounded value
    expect(inflationManager.CurrentInflationRate).toBe(0.03);

    // Simulate another week, should not change yet
    emitSpy.mockClear();
    onWeekStartCallback.call(inflationManager, 5);
    expect(emitSpy).not.toHaveBeenCalledWith('onInflationChanged', expect.any(Number));
  });

  it('should emit onInflationChanged event when rate changes', () => {
    const emitSpy = jest.spyOn(globalEventEmitterMock, 'emit');
    // Manually trigger changeInflationRate for direct test
    // @ts-ignore - Access private method for testing
    inflationManager.changeInflationRate();
    expect(emitSpy).toHaveBeenCalledWith('onInflationChanged', expect.any(Number));
  });

  it('should ensure new inflation rate is within min/max bounds', () => {
    // Since FloatBetween is mocked to return midpoint, this test primarily checks clamping logic if any
    // @ts-ignore
    inflationManager.changeInflationRate();
    expect(inflationManager.CurrentInflationRate).toBeGreaterThanOrEqual(0.01);
    expect(inflationManager.CurrentInflationRate).toBeLessThanOrEqual(0.05);
  });
});