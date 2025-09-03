import { InvestmentManager } from './InvestmentManager';
import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { InflationManager } from './InflationManager';
import { TurnManager } from './TurnManager';
import { InvestmentAsset } from './InvestmentAsset';
import { InvestmentAssets } from './InvestmentAssetsData';

// Mock dependencies
const mockPlayerStatsControllerInstance = {
  getPlayerData: jest.fn(),
  decreaseMoney: jest.fn(),
  addMoney: jest.fn(),
  updateInvestmentHoldings: jest.fn(),
};

const mockGlobalEventEmitterInstance = {
  on: jest.fn(),
  emit: jest.fn(),
};

const mockInflationManagerInstance = {
  CurrentInflationRate: 0.02,
};

const mockTurnManagerInstance = {
  currentWeek: 1,
};

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

jest.mock('./TurnManager', () => ({
  TurnManager: {
    get instance() {
      return mockTurnManagerInstance;
    },
  },
}));

describe('InvestmentManager', () => {
  let investmentManager: InvestmentManager;

  const mockGoldAsset: InvestmentAsset = InvestmentAssets.find(asset => asset.id === 'gold')!;
  const mockStocksAsset: InvestmentAsset = InvestmentAssets.find(asset => asset.id === 'stocks')!;

  beforeEach(() => {
    jest.clearAllMocks();

    

    // Re-initialize InvestmentManager to ensure fresh state for each test
    // This is a workaround for the singleton pattern in tests
    (InvestmentManager as any).instance = null;
    investmentManager = InvestmentManager.getInstance();
  });

  // 8.1. เทสกลไกซื้อ/ขาย และกรณีขอบเขต
  describe('buyInvestment', () => {
    it('should allow buying investment if cash is sufficient', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 1000,
        bankBalance: 0,
        activeLoans: [],
        investmentHoldings: {},
      });
      const initialPrice = investmentManager.getAssetCurrentPrice(mockGoldAsset.id);
      const quantity = 10;
      const totalCost = initialPrice * quantity;

      const result = investmentManager.buyInvestment(mockGoldAsset, quantity);

      expect(result).toBe(true);
      expect(PlayerStatsController.instance.decreaseMoney).toHaveBeenCalledWith(totalCost);
      expect(PlayerStatsController.instance.updateInvestmentHoldings).toHaveBeenCalledWith(mockGoldAsset.id, quantity);
      expect(GlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onInvestmentBought', mockGoldAsset, quantity, totalCost);
    });

    it('should not allow buying negative or zero quantity', () => {
      const result = investmentManager.buyInvestment(mockGoldAsset, -5);
      expect(result).toBe(false);
      expect(PlayerStatsController.instance.decreaseMoney).not.toHaveBeenCalled();
    });

    it('should not allow buying if cash is insufficient', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 5, // Not enough
        bankBalance: 0,
        activeLoans: [],
        investmentHoldings: {},
      });
      const result = investmentManager.buyInvestment(mockGoldAsset, 10);
      expect(result).toBe(false);
      expect(PlayerStatsController.instance.decreaseMoney).not.toHaveBeenCalled();
    });
  });

  describe('sellInvestment', () => {
    it('should allow selling investment if holdings are sufficient', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 1000,
        bankBalance: 0,
        activeLoans: [],
        investmentHoldings: { [mockGoldAsset.id]: 20 }, // Has 20 units
      });
      const initialPrice = investmentManager.getAssetCurrentPrice(mockGoldAsset.id);
      const quantity = 10;
      const totalRevenue = initialPrice * quantity;

      const result = investmentManager.sellInvestment(mockGoldAsset, quantity);

      expect(result).toBe(true);
      expect(PlayerStatsController.instance.updateInvestmentHoldings).toHaveBeenCalledWith(mockGoldAsset.id, 10); // 20 - 10 = 10 remaining
      expect(PlayerStatsController.instance.addMoney).toHaveBeenCalledWith(totalRevenue);
      expect(GlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onInvestmentSold', mockGoldAsset, quantity, totalRevenue);
    });

    it('should not allow selling negative or zero quantity', () => {
      const result = investmentManager.sellInvestment(mockGoldAsset, -5);
      expect(result).toBe(false);
      expect(PlayerStatsController.instance.addMoney).not.toHaveBeenCalled();
    });

    it('should not allow selling if holdings are insufficient', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 1000,
        bankBalance: 0,
        activeLoans: [],
        investmentHoldings: { [mockGoldAsset.id]: 5 }, // Has 5 units
      });
      const result = investmentManager.sellInvestment(mockGoldAsset, 10);
      expect(result).toBe(false);
      expect(PlayerStatsController.instance.addMoney).not.toHaveBeenCalled();
    });
  });

  // 8.2. เทสการคำนวณมูลค่าผันผวนของสินทรัพย์
  describe('calculateMarketPrices', () => {
    it('should update market prices based on volatility and inflation', () => {
      // Mock Math.random to control volatility for predictable testing
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.75); // Returns 0.75, so (0.75 * 2 - 1) = 0.5

      (investmentManager as any).calculateMarketPrices(); // Call private method

      InvestmentAssets.forEach(asset => {
        const expectedPriceChange = asset.baseReturnRate - InflationManager.instance.CurrentInflationRate + (0.5 * asset.baseVolatility);
        const expectedNewPrice = (asset.baseReturnRate * 100) * (1 + expectedPriceChange);
        expect(investmentManager.getAssetCurrentPrice(asset.id)).toBeCloseTo(Math.max(1, expectedNewPrice));
        expect(GlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onMarketPriceUpdated', asset.id, expect.any(Number));
      });

      mockRandom.mockRestore();
    });

    it('should ensure prices do not go below 1', () => {
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0); // Returns 0, so (0 * 2 - 1) = -1
      InflationManager.instance.CurrentInflationRate = 0.5; // High inflation to drive price down

      // Set initial prices very low to test floor
      (investmentManager as any).currentMarketPrices = {
        [mockGoldAsset.id]: 0.5,
        [mockStocksAsset.id]: 0.5,
      };

      (investmentManager as any).calculateMarketPrices();

      InvestmentAssets.forEach(asset => {
        expect(investmentManager.getAssetCurrentPrice(asset.id)).toBeGreaterThanOrEqual(1);
      });

      mockRandom.mockRestore();
    });
  });

  // 8.3. เทสการคำนวณมูลค่าพอร์ตการลงทุนรวม
  describe('getTotalPortfolioValue', () => {
    it('should calculate the total value of all investment holdings', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 1000,
        bankBalance: 0,
        activeLoans: [],
        investmentHoldings: {
          [mockGoldAsset.id]: 10,
          [mockStocksAsset.id]: 5,
        },
      });

      // Set predictable current market prices for testing
      (investmentManager as any).currentMarketPrices = {
        [mockGoldAsset.id]: 100,
        [mockStocksAsset.id]: 200,
      };

      const expectedTotalValue = (10 * 100) + (5 * 200);
      const totalValue = investmentManager.getTotalPortfolioValue();
      expect(totalValue).toBe(expectedTotalValue);
    });

    it('should return 0 if there are no investment holdings', () => {
      PlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 1000,
        bankBalance: 0,
        activeLoans: [],
        investmentHoldings: {},
      });
      const totalValue = investmentManager.getTotalPortfolioValue();
      expect(totalValue).toBe(0);
    });
  });
});