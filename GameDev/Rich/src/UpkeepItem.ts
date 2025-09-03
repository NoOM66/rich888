// GameDev/Rich/src/UpkeepItem.ts
import { StatType } from './StatType'; // Assuming StatType is defined elsewhere

export interface UpkeepItem {
    id: string;
    itemName: string;
    baseCost: number;
    frequencyInWeeks: number;
    statAffectedOnSuccess: StatType;
    statChangeOnSuccess: number;
    statAffectedOnFailure: StatType;
    statChangeOnFailure: number;
}
