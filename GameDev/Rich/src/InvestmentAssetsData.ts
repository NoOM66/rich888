// GameDev/Rich/src/InvestmentAssetsData.ts
import { InvestmentAsset } from './InvestmentAsset';

export const InvestmentAssets: InvestmentAsset[] = [
    {
        id: 'gold',
        assetName: 'ทองคำ',
        description: 'สินทรัพย์ที่มีความเสี่ยงต่ำ ผลตอบแทนต่ำ เหมาะสำหรับรักษามูลค่า',
        baseVolatility: 0.02,
        baseReturnRate: 0.01,
    },
    {
        id: 'mutual_funds',
        assetName: 'กองทุนรวม',
        description: 'การลงทุนแบบกระจายความเสี่ยงในหลายสินทรัพย์ ความเสี่ยงปานกลาง ผลตอบแทนปานกลาง',
        baseVolatility: 0.05,
        baseReturnRate: 0.04,
    },
    {
        id: 'stocks',
        assetName: 'หุ้น',
        description: 'การลงทุนในบริษัทต่างๆ มีความเสี่ยงสูงกว่ากองทุนรวม แต่มีโอกาสให้ผลตอบแทนสูงกว่า',
        baseVolatility: 0.10,
        baseReturnRate: 0.07,
    },
    {
        id: 'cryptocurrency',
        assetName: 'คริปโตเคอร์เรนซี',
        description: 'สินทรัพย์ดิจิทัลที่มีความผันผวนสูงมาก มีโอกาสให้ผลตอบแทนสูงมาก แต่ก็มีความเสี่ยงสูงมากเช่นกัน',
        baseVolatility: 0.20,
        baseReturnRate: 0.15,
    },
];
