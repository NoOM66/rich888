// GameDev/Rich/src/Path.ts
export interface Path {
    id: string;
    fromLocationId: string;
    toLocationId: string;
    travelTimeCost: number; // In hours
}
