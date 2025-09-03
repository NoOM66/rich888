// GameDev/Rich/src/UpkeepItemsData.ts
import { UpkeepItem } from './UpkeepItem';
import { StatType } from './StatType';

export const UpkeepItems: UpkeepItem[] = [
    {
        id: 'food',
        itemName: 'อาหาร',
        baseCost: 50,
        frequencyInWeeks: 1, // Weekly
        statAffectedOnSuccess: StatType.Health,
        statChangeOnSuccess: 0, // Health maintained
        statAffectedOnFailure: StatType.Health,
        statChangeOnFailure: -10, // Health decreases if not paid
    },
    {
        id: 'rent',
        itemName: 'ค่าเช่า',
        baseCost: 200,
        frequencyInWeeks: 4, // Every 4 weeks
        statAffectedOnSuccess: StatType.Happiness,
        statChangeOnSuccess: 0, // Happiness maintained
        statAffectedOnFailure: StatType.Stress,
        statChangeOnFailure: 15, // Stress increases if not paid
    },
    {
        id: 'clothing',
        itemName: 'เสื้อผ้า',
        baseCost: 100,
        frequencyInWeeks: 6, // Every 6 weeks
        statAffectedOnSuccess: StatType.Happiness,
        statChangeOnSuccess: 0, // Happiness maintained
        statAffectedOnFailure: StatType.Happiness,
        statChangeOnFailure: -5, // Happiness decreases if not paid
    },
];
