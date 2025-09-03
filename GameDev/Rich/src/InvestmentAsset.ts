// GameDev/Rich/src/InvestmentAsset.ts
export interface InvestmentAsset {
    id: string;
    assetName: string;
    description: string;
    baseVolatility: number; // e.g., 0.05 for 5% volatility
    baseReturnRate: number; // e.g., 0.03 for 3% return
}
