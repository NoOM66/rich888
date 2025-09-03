import { PlayerStatsController } from './PlayerStatsController';
import { InvestmentAsset } from './InvestmentAsset';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { InflationManager } from './InflationManager';
import { TurnManager } from './TurnManager';
import { InvestmentAssets } from './InvestmentAssetsData';

class InvestmentManager {
    private static instance: InvestmentManager;
    private currentMarketPrices: { [assetId: string]: number } = {}; // To store current market prices

    private constructor() {
        GlobalEventEmitter.instance.on('onWeekStart', this.handleWeekStart, this);
        // Initialize market prices
        InvestmentAssets.forEach(asset => {
            this.currentMarketPrices[asset.id] = asset.baseReturnRate * 100; // Initial price
        });
    }

    public static getInstance(): InvestmentManager {
        if (!InvestmentManager.instance) {
            InvestmentManager.instance = new InvestmentManager();
        }
        return InvestmentManager.instance;
    }

    private handleWeekStart(currentWeek: number): void {
        this.calculateMarketPrices();
    }

    private calculateMarketPrices(): void {
        const currentInflationRate = InflationManager.instance.CurrentInflationRate;

        InvestmentAssets.forEach(asset => {
            // Simple price fluctuation model
            // Price change based on baseReturnRate, baseVolatility, and inflation
            let priceChange = asset.baseReturnRate;

            // Adjust for inflation (real return)
            priceChange -= currentInflationRate;

            // Add volatility
            const volatilityFactor = (Math.random() * 2 - 1) * asset.baseVolatility; // Random between -volatility and +volatility
            priceChange += volatilityFactor;

            // Apply change to current price
            let newPrice = this.currentMarketPrices[asset.id] * (1 + priceChange);

            // Ensure price doesn't go below a certain minimum (e.g., 1)
            newPrice = Math.max(1, newPrice);

            this.currentMarketPrices[asset.id] = newPrice;
            GlobalEventEmitter.instance.emit('onMarketPriceUpdated', asset.id, newPrice);
        });
        console.log("Market prices updated:", this.currentMarketPrices);
    }

    public getAssetCurrentPrice(assetId: string): number {
        return this.currentMarketPrices[assetId];
    }

    public buyInvestment(asset: InvestmentAsset, quantity: number): boolean {
        if (quantity <= 0) {
            console.warn("Quantity to buy must be positive.");
            return false;
        }

        const currentPricePerUnit = this.getAssetCurrentPrice(asset.id);
        const totalCost = currentPricePerUnit * quantity;

        const currentMoney = PlayerStatsController.instance.getPlayerData().money;
        if (currentMoney < totalCost) {
            console.warn("Not enough cash to buy investment.");
            return false;
        }

        PlayerStatsController.instance.decreaseMoney(totalCost);
        const currentHoldings = PlayerStatsController.instance.getPlayerData().investmentHoldings[asset.id] || 0;
        PlayerStatsController.instance.updateInvestmentHoldings(asset.id, currentHoldings + quantity);

        GlobalEventEmitter.instance.emit('onInvestmentBought', asset, quantity, totalCost);
        console.log(`Bought ${quantity} of ${asset.assetName} for ${totalCost.toFixed(2)}.`);
        return true;
    }

    public sellInvestment(asset: InvestmentAsset, quantity: number): boolean {
        if (quantity <= 0) {
            console.warn("Quantity to sell must be positive.");
            return false;
        }

        const currentHoldings = PlayerStatsController.instance.getPlayerData().investmentHoldings[asset.id] || 0;
        if (currentHoldings < quantity) {
            console.warn(`Not enough ${asset.assetName} to sell. Have: ${currentHoldings}, trying to sell: ${quantity}`);
            return false;
        }

        const currentPricePerUnit = this.getAssetCurrentPrice(asset.id);
        const totalRevenue = currentPricePerUnit * quantity;

        PlayerStatsController.instance.updateInvestmentHoldings(asset.id, currentHoldings - quantity);
        PlayerStatsController.instance.addMoney(totalRevenue);

        GlobalEventEmitter.instance.emit('onInvestmentSold', asset, quantity, totalRevenue);
        console.log(`Sold ${quantity} of ${asset.assetName} for ${totalRevenue.toFixed(2)}.`);
        return true;
    }

    public getTotalPortfolioValue(): number {
        let totalValue = 0;
        const playerData = PlayerStatsController.instance.getPlayerData();
        for (const assetId in playerData.investmentHoldings) {
            if (playerData.investmentHoldings.hasOwnProperty(assetId)) {
                const quantity = playerData.investmentHoldings[assetId];
                const currentPrice = this.getAssetCurrentPrice(assetId);
                totalValue += quantity * currentPrice;
            }
        }
        return totalValue;
    }
}