import { EconomicEvent, EconomicEventType } from './EconomicEvent';
import { EconomicEvents } from './EconomicEventsData';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';
import { PlayerStatsController } from './PlayerStatsController'; // Import PlayerStatsController
import { InflationManager } from './InflationManager'; // Import InflationManager
import { StatType } from './StatType'; // Import StatType

class EconomicEventManager {
    private static instance: EconomicEventManager;
    private events: EconomicEvent[] = EconomicEvents; // List of all economic events

    private constructor() {
        GlobalEventEmitter.instance.on('onWeekStart', this.handleWeekStart, this);
    }

    public static getInstance(): EconomicEventManager {
        if (!EconomicEventManager.instance) {
            EconomicEventManager.instance = new EconomicEventManager();
        }
        return EconomicEventManager.instance;
    }

    private handleWeekStart(currentWeek: number): void {
        this.triggerRandomEvent();
    }

    private triggerRandomEvent(): void {
        this.events.forEach(event => {
            if (Math.random() < event.triggerChancePerWeek) {
                console.log(`Triggering economic event: ${event.eventName}`);
                this.applyEventEffects(event);
            }
        });
    }

    private applyEventEffects(event: EconomicEvent): void {
        // Apply money change
        if (event.moneyChange) {
            if (event.moneyChange > 0) {
                PlayerStatsController.instance.addMoney(event.moneyChange);
            } else {
                PlayerStatsController.instance.decreaseMoney(Math.abs(event.moneyChange));
            }
        }

        // Apply health change
        if (event.healthChange) {
            PlayerStatsController.instance.applyHealthChange(event.healthChange);
        }

        // Apply happiness change
        if (event.happinessChange) {
            PlayerStatsController.instance.applyHappinessChange(event.happinessChange);
        }

        // Apply education change
        if (event.educationChange) {
            PlayerStatsController.instance.applyEducationChange(event.educationChange);
        }

        // Apply stress change
        if (event.stressChange) {
            PlayerStatsController.instance.applyStressChange(event.stressChange);
        }

        // Apply inflation rate change
        if (event.inflationRateChange) {
            InflationManager.instance.adjustInflationRate(event.inflationRateChange);
        }

        // Emit UI Notification
        GlobalEventEmitter.instance.emit('onShowNotification', event.eventName, event.description);
        GlobalEventEmitter.instance.emit('onEconomicEventTriggered', event); // Emit a specific event for this
    }

    // TODO: Implement EconomicEventManager logic here
}
