import { UpkeepItem } from './UpkeepItem';
import { UpkeepItems } from './UpkeepItemsData';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';
import { InflationManager } from './InflationManager';
import { PlayerStatsController } from './PlayerStatsController';
import { StatType } from './StatType'; // Import StatType

class UpkeepManager {
    private static instance: UpkeepManager;
    private upkeepItems: UpkeepItem[] = UpkeepItems; // List of all upkeep items

    private constructor() {
        GlobalEventEmitter.instance.on('onWeekStart', this.handleWeekStart, this);
    }

    public static getInstance(): UpkeepManager {
        if (!UpkeepManager.instance) {
            UpkeepManager.instance = new UpkeepManager();
        }
        return UpkeepManager.instance;
    }

    private handleWeekStart(currentWeek: number): void {
        this.upkeepItems.forEach(item => {
            if (currentWeek % item.frequencyInWeeks === 0) {
                // It's time to pay for this upkeep item
                const adjustedCost = item.baseCost * (1 + InflationManager.instance.CurrentInflationRate);
                console.log(`Upkeep item ${item.itemName} due. Adjusted cost: ${adjustedCost.toFixed(2)}`);
                this.processUpkeepPayment(item, adjustedCost);
            }
        });
    }

    private processUpkeepPayment(item: UpkeepItem, cost: number): void {
        const playerData = PlayerStatsController.instance.getPlayerData();
        if (playerData.money >= cost) {
            // Player has enough money
            PlayerStatsController.instance.decreaseMoney(cost);
            // Apply success stat change
            switch (item.statAffectedOnSuccess) {
                case StatType.Health:
                    PlayerStatsController.instance.applyHealthChange(item.statChangeOnSuccess);
                    break;
                case StatType.Happiness:
                    PlayerStatsController.instance.applyHappinessChange(item.statChangeOnSuccess);
                    break;
                case StatType.Stress:
                    PlayerStatsController.instance.applyStressChange(item.statChangeOnSuccess);
                    break;
                case StatType.Education:
                    PlayerStatsController.instance.applyEducationChange(item.statChangeOnSuccess);
                    break;
                case StatType.Money: // Should not happen for success, but for completeness
                    PlayerStatsController.instance.addMoney(item.statChangeOnSuccess);
                    break;
                case StatType.BankBalance: // Should not happen for success
                    PlayerStatsController.instance.addBankBalance(item.statChangeOnSuccess);
                    break;
            }
            GlobalEventEmitter.instance.emit('onUpkeepPaid', item, cost);
            console.log(`Paid for ${item.itemName}. Cost: ${cost.toFixed(2)}.`);
        } else {
            // Player does not have enough money
            // Apply failure stat change
            switch (item.statAffectedOnFailure) {
                case StatType.Health:
                    PlayerStatsController.instance.applyHealthChange(item.statChangeOnFailure);
                    break;
                case StatType.Happiness:
                    PlayerStatsController.instance.applyHappinessChange(item.statChangeOnFailure);
                    break;
                case StatType.Stress:
                    PlayerStatsController.instance.applyStressChange(item.statChangeOnFailure);
                    break;
                case StatType.Education:
                    PlayerStatsController.instance.applyEducationChange(item.statChangeOnFailure);
                    break;
                case StatType.Money: // Should not happen for failure
                    PlayerStatsController.instance.addMoney(item.statChangeOnFailure);
                    break;
                case StatType.BankBalance: // Should not happen for failure
                    PlayerStatsController.instance.addBankBalance(item.statChangeOnFailure);
                    break;
            }
            GlobalEventEmitter.instance.emit('onUpkeepMissed', item, cost);
            console.warn(`Missed payment for ${item.itemName}. Penalty applied.`);
        }
    }

    // TODO: Implement UpkeepManager logic here
}
