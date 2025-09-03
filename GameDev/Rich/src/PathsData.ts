// GameDev/Rich/src/PathsData.ts
import { Path } from './Path';

export const Paths: Path[] = [
    {
        id: 'home_to_workplace',
        fromLocationId: 'home',
        toLocationId: 'workplace',
        travelTimeCost: 2, // 2 hours
    },
    {
        id: 'workplace_to_home',
        fromLocationId: 'workplace',
        toLocationId: 'home',
        travelTimeCost: 2, // 2 hours
    },
    {
        id: 'home_to_bank',
        fromLocationId: 'home',
        toLocationId: 'bank',
        travelTimeCost: 1, // 1 hour
    },
    {
        id: 'bank_to_home',
        fromLocationId: 'bank',
        toLocationId: 'home',
        travelTimeCost: 1, // 1 hour
    },
    {
        id: 'home_to_supermarket',
        fromLocationId: 'home',
        toLocationId: 'supermarket',
        travelTimeCost: 1.5, // 1.5 hours
    },
    {
        id: 'supermarket_to_home',
        fromLocationId: 'supermarket',
        toLocationId: 'home',
        travelTimeCost: 1.5, // 1.5 hours
    },
    // Add more paths as needed
];
