import Phaser from 'phaser';
import { PlayerData, DefaultPlayerData } from './PlayerData';
import { StatType } from './StatType';
import { GameManager, GameState } from './GameManager';
import { GlobalEventEmitter } from './GlobalEventEmitter';

class PlayerStatsController {
  private static _instance: PlayerStatsController;
  private playerData: PlayerData;

  // Stat min/max values
  private readonly MIN_STAT_VALUE: number = 0;
  private readonly MAX_HEALTH_HAPPINESS: number = 100;
  private readonly MAX_EDUCATION: number = 100;
  private readonly MAX_STRESS: number = 100;

  public static get instance(): PlayerStatsController {
    if (!PlayerStatsController._instance) {
      PlayerStatsController._instance = new PlayerStatsController();
    }
    return PlayerStatsController._instance;
  }

  private constructor() {
    this.playerData = { ...DefaultPlayerData }; // Initialize with default data

    // Listen to inflation changes
    GlobalEventEmitter.instance.on('onInflationChanged', this.handleInflationChanged, this);

    console.log('PlayerStatsController initialized.');
  }

  public getPlayerData(): PlayerData {
    return { ...this.playerData }; // Return a copy to prevent direct modification
  }

  public loadPlayerData(data: PlayerData): void {
    this.playerData = { ...data };
    // Emit events for all loaded stats to update UI
    for (const stat in StatType) {
      if (isNaN(Number(stat))) { // Filter out numeric enum keys
        GlobalEventEmitter.instance.emit('onStatChanged', stat as StatType, this.playerData[stat as keyof PlayerData]);
      }
    }
    console.log('Player data loaded.', this.playerData);
  }

  private clampStat(statType: StatType, value: number): number {
    switch (statType) {
      case StatType.Health:
      case StatType.Happiness:
        return Phaser.Math.Clamp(value, this.MIN_STAT_VALUE, this.MAX_HEALTH_HAPPINESS);
      case StatType.Education:
        return Phaser.Math.Clamp(value, this.MIN_STAT_VALUE, this.MAX_EDUCATION);
      case StatType.Stress:
        return Phaser.Math.Clamp(value, this.MIN_STAT_VALUE, this.MAX_STRESS);
      case StatType.Money:
      case StatType.BankBalance:
        return Math.max(value, this.MIN_STAT_VALUE); // Money and BankBalance can be very high, only clamp min
      default:
        return value;
    }
  }

  private applyStatChange(statType: StatType, amount: number): void {
    const oldValue = this.playerData[statType]; // Direct access
    let newValue = oldValue + amount;

    newValue = this.clampStat(statType, newValue);

    if (newValue !== oldValue) {
      this.playerData[statType] = newValue; // Direct assignment
      GlobalEventEmitter.instance.emit('onStatChanged', statType, newValue, oldValue);
      console.log(`${statType} changed from ${oldValue} to ${newValue}.`);

      // Check for player lost condition
      if ((statType === StatType.Health || statType === StatType.Happiness) && newValue <= this.MIN_STAT_VALUE) {
        GlobalEventEmitter.instance.emit('onPlayerLost');
        GameManager.instance.gameOver(); // Notify GameManager
        console.log('Player lost!');
      }
    }
  }

  private handleInflationChanged(newInflationRate: number): void {
    const oldMoney = this.playerData.money;
    // Reduce purchasing power by directly reducing money for simplicity in this story
    this.playerData.money = parseFloat((this.playerData.money * (1 - newInflationRate)).toFixed(2));
    // Ensure money doesn't go below 0
    this.playerData.money = Math.max(this.playerData.money, this.MIN_STAT_VALUE);
    GlobalEventEmitter.instance.emit('onStatChanged', StatType.Money, this.playerData.money, oldMoney);
    console.log(`Money adjusted due to inflation (${newInflationRate * 100}%): ${oldMoney} -> ${this.playerData.money}`);
  }

  // Public methods to change stats
  public addMoney(amount: number): void { this.applyStatChange(StatType.Money, amount); }
  public decreaseMoney(amount: number): void { this.applyStatChange(StatType.Money, -amount); }

  public addBankBalance(amount: number): void { this.applyStatChange(StatType.BankBalance, amount); }
  public decreaseBankBalance(amount: number): void { this.applyStatChange(StatType.BankBalance, -amount); }

  public addLoan(loan: Loan): void {
    this.playerData.activeLoans.push(loan);
    GlobalEventEmitter.instance.emit('onLoanAdded', loan);
    console.log(`Loan ${loan.id} added.`);
  }

  public removeLoan(loanId: string): void {
    const index = this.playerData.activeLoans.findIndex(l => l.id === loanId);
    if (index !== -1) {
      const removedLoan = this.playerData.activeLoans.splice(index, 1)[0];
      GlobalEventEmitter.instance.emit('onLoanRemoved', removedLoan);
      console.log(`Loan ${loanId} removed.`);
    }
  }

  public updateLoan(updatedLoan: Loan): void {
    const index = this.playerData.activeLoans.findIndex(l => l.id === updatedLoan.id);
    if (index !== -1) {
      this.playerData.activeLoans[index] = updatedLoan;
      GlobalEventEmitter.instance.emit('onLoanUpdated', updatedLoan);
      console.log(`Loan ${updatedLoan.id} updated.`);
    }
  }

  public updateInvestmentHoldings(assetId: string, quantity: number): void {
    this.playerData.investmentHoldings[assetId] = quantity;
    GlobalEventEmitter.instance.emit('onInvestmentHoldingsUpdated', assetId, quantity);
    console.log(`Investment holdings for ${assetId} updated to ${quantity}.`);
  }

  public updateCurrentJob(job: Job | null): void {
    this.playerData.currentJob = job;
    GlobalEventEmitter.instance.emit('onCurrentJobUpdated', job);
    console.log(`Current job updated to: ${job ? job.jobName : 'None'}.`);
  }

  public updateJobExperience(experience: number): void {
    this.playerData.jobExperience = experience;
    GlobalEventEmitter.instance.emit('onJobExperienceUpdated', experience);
    console.log(`Job experience updated to: ${experience}.`);
  }

  public updateCurrentCourse(course: Course | null): void {
    this.playerData.currentCourse = course;
    GlobalEventEmitter.instance.emit('onCurrentCourseUpdated', course);
    console.log(`Current course updated to: ${course ? course.courseName : 'None'}.`);
  }

  public updateCurrentEducationLevel(level: number): void {
    this.playerData.currentEducationLevel = level;
    GlobalEventEmitter.instance.emit('onCurrentEducationLevelUpdated', level);
    console.log(`Current education level updated to: ${level}.`);
  }

  public updateCurrentLocation(location: Location | null): void {
    this.playerData.currentLocation = location;
    GlobalEventEmitter.instance.emit('onCurrentLocationUpdated', location);
    console.log(`Current location updated to: ${location ? location.locationName : 'None'}.`);
  }

  public applyHealthChange(amount: number): void { this.applyStatChange(StatType.Health, amount); }
  public applyHappinessChange(amount: number): void { this.applyStatChange(StatType.Happiness, amount); }
  public applyEducationChange(amount: number): void { this.applyStatChange(StatType.Education, amount); }
  public applyStressChange(amount: number): void { this.applyStatChange(StatType.Stress, amount); }

  // Event listener methods (delegated from GlobalEventEmitter)
  public on(event: string | symbol, fn: Function, context?: any): this {
    GlobalEventEmitter.instance.on(event, fn, context);
    return this;
  }

  public off(event: string | symbol, fn?: Function, context?: any, once?: boolean): this {
    GlobalEventEmitter.instance.off(event, fn, context, once);
    return this;
  }
}

export { PlayerStatsController };