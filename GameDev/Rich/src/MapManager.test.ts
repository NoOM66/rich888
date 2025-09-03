import { MapManager } from './MapManager';
import { Location } from './Location';
import { Path } from './Path';
import { Locations } from './LocationsData';
import { Paths } from './PathsData';
import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';

// Mock dependencies
jest.mock('./PlayerStatsController');
jest.mock('./GlobalEventEmitter');
jest.mock('./TurnManager');

describe('MapManager', () => {
  let mapManager: MapManager;
  let mockPlayerStatsController: jest.Mocked<typeof PlayerStatsController>;
  let mockGlobalEventEmitter: jest.Mocked<typeof GlobalEventEmitter>;
  let mockTurnManager: jest.Mocked<typeof TurnManager>;

  const homeLocation: Location = Locations.find(loc => loc.id === 'home')!;
  const workplaceLocation: Location = Locations.find(loc => loc.id === 'workplace')!;
  const homeToWorkplacePath: Path = Paths.find(path => path.id === 'home_to_workplace')!;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPlayerStatsController = PlayerStatsController as jest.Mocked<typeof PlayerStatsController>;
    mockPlayerStatsController.instance = {
      updateCurrentLocation: jest.fn(),
    } as any;

    mockGlobalEventEmitter = GlobalEventEmitter as jest.Mocked<typeof GlobalEventEmitter>;
    mockGlobalEventEmitter.instance = {
      on: jest.fn(),
      emit: jest.fn(),
    } as any;

    mockTurnManager = TurnManager as jest.Mocked<typeof TurnManager>;
    mockTurnManager.instance = {
      trySpendTime: jest.fn(() => true),
    } as any;

    // Re-initialize MapManager to ensure fresh state for each test
    (MapManager as any).instance = null;
    mapManager = MapManager.getInstance();
  });

  // 7.1. เทส `TryTravelTo` (ทั้งกรณีที่เดินทางได้และเดินทางไม่ได้)
  describe('tryTravelTo', () => {
    it('should allow traveling to a destination if path exists and time is sufficient', () => {
      const result = mapManager.tryTravelTo(workplaceLocation);
      expect(result).toBe(true);
      expect(mapManager.getCurrentLocation()).toBe(workplaceLocation);
    });

    it('should not allow traveling if no current location', () => {
      (mapManager as any).currentLocation = null;
      const result = mapManager.tryTravelTo(workplaceLocation);
      expect(result).toBe(false);
      expect(mapManager.getCurrentLocation()).toBeNull();
    });

    it('should not allow traveling if no direct path exists', () => {
      const unknownLocation: Location = { id: 'unknown', locationName: 'Unknown', description: '', availableActivities: [] };
      const result = mapManager.tryTravelTo(unknownLocation);
      expect(result).toBe(false);
      expect(mapManager.getCurrentLocation()).toBe(homeLocation);
    });

    it('should not allow traveling if time is insufficient', () => {
      mockTurnManager.instance.trySpendTime.mockReturnValue(false);
      const result = mapManager.tryTravelTo(workplaceLocation);
      expect(result).toBe(false);
      expect(mapManager.getCurrentLocation()).toBe(homeLocation);
    });
  });

  // 7.2. เทสการอัปเดต `CurrentLocation`
  describe('currentLocation update', () => {
    it('should update currentLocation in MapManager and PlayerStatsController on successful travel', () => {
      mapManager.tryTravelTo(workplaceLocation);
      expect(mapManager.getCurrentLocation()).toBe(workplaceLocation);
      expect(mockPlayerStatsController.instance.updateCurrentLocation).toHaveBeenCalledWith(workplaceLocation);
    });
  });

  // 7.3. เทสการยิง Event
  describe('Event Emission', () => {
    it('should emit onTravelStarted and onTravelCompleted events on successful travel', () => {
      mapManager.tryTravelTo(workplaceLocation);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onTravelStarted', homeLocation, workplaceLocation, homeToWorkplacePath.travelTimeCost);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onTravelCompleted', workplaceLocation);
    });

    it('should not emit events if travel is unsuccessful', () => {
      mockTurnManager.instance.trySpendTime.mockReturnValue(false);
      mapManager.tryTravelTo(workplaceLocation);
      expect(mockGlobalEventEmitter.instance.emit).not.toHaveBeenCalledWith('onTravelStarted', expect.any(Object), expect.any(Object), expect.any(Number));
      expect(mockGlobalEventEmitter.instance.emit).not.toHaveBeenCalledWith('onTravelCompleted', expect.any(Object));
    });
  });
});