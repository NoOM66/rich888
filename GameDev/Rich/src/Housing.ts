// GameDev/Rich/src/Housing.ts
export interface Housing {
    id: string;
    homeName: string;
    description: string;
    baseRent: number;
    baseUtilitiesCost: number;
    capacity: number; // Number of people it can house
    happinessBonus: number; // Bonus to happiness when living here
    upgradeOptionId: string | null; // ID of the next housing upgrade, null if no upgrade
}
