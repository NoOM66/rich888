import { Housing } from './Housing';
import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';
import { InflationManager } from './InflationManager';
import { StatType } from './StatType';
import { HousingOptions } from './HousingData'; // Import HousingOptions data

class HousingManager {
    private static instance: HousingManager;
    private currentHome: Housing | null = null; // Reference to the player's current home

    private constructor() {
        GlobalEventEmitter.instance.on('onWeekStart', this.handleWeekStart, this);
    }

    public static getInstance(): HousingManager {
        if (!HousingManager.instance) {
            HousingManager.instance = new HousingManager();
        }
        return HousingManager.instance;
    }

    public getCurrentHome(): Housing | null {
        return this.currentHome;
    }

    public selectHome(home: Housing): void {
        this.currentHome = home;
        PlayerStatsController.instance.updateCurrentHome(home);
        GlobalEventEmitter.instance.emit('onHomeSelected', home);
        console.log(`Home selected: ${home.homeName}`);
    }

    private handleWeekStart(currentWeek: number): void {
        if (!this.currentHome) {
            return; // No home selected, no upkeep to pay
        }

        // Check for rent payment (every 4 weeks)
        if (currentWeek % 4 === 0) {
            const adjustedRent = this.currentHome.baseRent * (1 + InflationManager.instance.CurrentInflationRate);
            console.log(`Rent due for ${this.currentHome.homeName}. Adjusted rent: ${adjustedRent.toFixed(2)}`);
            this.processHousingPayment(adjustedRent, 'rent');
        }

        // Check for utilities payment (every 4 weeks, assuming same frequency as rent for simplicity)
        if (currentWeek % 4 === 0) {
            const adjustedUtilities = this.currentHome.baseUtilitiesCost * (1 + InflationManager.instance.CurrentInflationRate);
            console.log(`Utilities due for ${this.currentHome.homeName}. Adjusted utilities: ${adjustedUtilities.toFixed(2)}`);
            this.processHousingPayment(adjustedUtilities, 'utilities');
        }
    }

    private processHousingPayment(cost: number, type: 'rent' | 'utilities'): void {
        const playerData = PlayerStatsController.instance.getPlayerData();
        if (playerData.money >= cost) {
            // Player has enough money
            PlayerStatsController.instance.decreaseMoney(cost);
            // Apply happiness bonus if it's rent and paid successfully
            if (type === 'rent' && this.currentHome) {
                PlayerStatsController.instance.applyHappinessChange(this.currentHome.happinessBonus);
            }
            GlobalEventEmitter.instance.emit(`on${type === 'rent' ? 'RentPaid' : 'UtilitiesPaid'}`, this.currentHome, cost);
            console.log(`Paid for ${type} for ${this.currentHome?.homeName}. Cost: ${cost.toFixed(2)}.`);
        } else {
            // Player does not have enough money, apply penalty
            if (type === 'rent') {
                PlayerStatsController.instance.applyStressChange(10); // Example penalty: +10 Stress
                PlayerStatsController.instance.applyHappinessChange(-5); // Example penalty: -5 Happiness
                GlobalEventEmitter.instance.emit('onRentMissed', this.currentHome, cost);
                console.warn(`Missed rent payment for ${this.currentHome?.homeName}. Penalty applied.`);
            } else if (type === 'utilities') {
                PlayerStatsController.instance.applyStressChange(5); // Example penalty: +5 Stress
                GlobalEventEmitter.instance.emit('onUtilitiesMissed', this.currentHome, cost);
                console.warn(`Missed utilities payment for ${this.currentHome?.homeName}. Penalty applied.`);
            }
            // Optional: Consider eviction mechanism if multiple payments are missed (Task 6.3)
        }
    }

    public canUpgradeHome(): boolean {
        if (!this.currentHome || !this.currentHome.upgradeOptionId) {
            return false; // No current home or no upgrade option
        }
        const nextHome = HousingOptions.find(h => h.id === this.currentHome?.upgradeOptionId);
        if (!nextHome) {
            console.warn(`Upgrade option with ID ${this.currentHome.upgradeOptionId} not found.`);
            return false;
        }
        // Check if player has enough money for the next home's base rent (as a proxy for affordability)
        return PlayerStatsController.instance.getPlayerData().money >= nextHome.baseRent;
    }

    public upgradeHome(): boolean {
        if (!this.canUpgradeHome()) {
            console.warn("Cannot upgrade home. Requirements not met or no upgrade option.");
            return false;
        }
        const nextHome = HousingOptions.find(h => h.id === this.currentHome?.upgradeOptionId);
        if (!nextHome) {
            console.error("Next home option not found during upgrade.");
            return false;
        }

        this.currentHome = nextHome;
        PlayerStatsController.instance.updateCurrentHome(nextHome);
        GlobalEventEmitter.instance.emit('onHomeUpgraded', nextHome);
        console.log(`Home upgraded to: ${nextHome.homeName}`);
        return true;
    }

    public canMoveToHome(newHome: Housing): boolean {
        if (this.currentHome?.id === newHome.id) {
            console.warn("Already living in this home.");
            return false;
        }
        // Check if player has enough money for the new home's base rent (as a proxy for affordability)
        return PlayerStatsController.instance.getPlayerData().money >= newHome.baseRent;
    }

    public moveToHome(newHome: Housing): boolean {
        if (!this.canMoveToHome(newHome)) {
            console.warn("Cannot move to this home. Requirements not met.");
            return false;
        }
        this.currentHome = newHome;
        PlayerStatsController.instance.updateCurrentHome(newHome);
        GlobalEventEmitter.instance.emit('onHomeMoved', newHome);
        console.log(`Moved to new home: ${newHome.homeName}`);
        return true;
    }
}