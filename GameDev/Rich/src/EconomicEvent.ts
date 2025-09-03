// GameDev/Rich/src/EconomicEvent.ts
export enum EconomicEventType {
    Positive = 'Positive',
    Negative = 'Negative',
    Neutral = 'Neutral',
}

export interface EconomicEvent {
    id: string;
    eventName: string;
    description: string;
    eventType: EconomicEventType;
    triggerChancePerWeek: number; // e.g., 0.1 for 10% chance
    moneyChange?: number; // Optional change in money
    healthChange?: number; // Optional change in health
    happinessChange?: number; // Optional change in happiness
    educationChange?: number; // Optional change in education
    stressChange?: number; // Optional change in stress
    inflationRateChange?: number; // Optional change in inflation rate
}
