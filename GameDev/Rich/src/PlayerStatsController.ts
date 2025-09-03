import Phaser from 'phaser';
import { PlayerData, DefaultPlayerData } from './PlayerData';
import { StatType } from './StatType';
import { GameManager, GameState } from './GameManager';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager';
import { InflationManager } from './InflationManager';

class PlayerStatsController {
  private static _instance: PlayerStatsController;
  private playerData: PlayerData;

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
    this.playerData = { ...DefaultPlayerData };

    GlobalEventEmitter.instance.on('onWeekEnd', this.handleWeekEnd, this);
    console.log('PlayerStatsController initialized.');
  }

  public getPlayerData(): PlayerData {
    return { ...this.playerData };
  }

  public loadPlayerData(data: PlayerData): void {
    this.playerData = { ...data };
    for (const stat in StatType) {
      if (isNaN(Number(stat))) {
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
        return Math.max(value, this.MIN_STAT_VALUE);
      default:
        return value;
    }
  }

  private applyStatChange(statType: StatType, amount: number): void {
    const oldValue = this.playerData[statType];
    let newValue = oldValue + amount;

    newValue = this.clampStat(statType, newValue);

    if (newValue !== oldValue) {
      this.playerData[statType] = newValue;
      GlobalEventEmitter.instance.emit('onStatChanged', statType, newValue, oldValue);
      console.log(`${statType} changed from ${oldValue} to ${newValue}.`);

      if ((statType === StatType.Health || statType === StatType.Happiness) && newValue <= this.MIN_STAT_VALUE) {
        GlobalEventEmitter.instance.emit('onPlayerLost');
        GameManager.instance.gameOver();
        console.log('Player lost!');
      }
    }
  }

  private handleWeekEnd(week: number): void {
    this.updateFinancialHistory(week);
  }

  public updateFinancialHistory(week: number): void {
    const totalAssets = this.playerData.money + this.playerData.bankBalance; // Simplified
    this.playerData.assetHistory.push({ week, value: totalAssets });

    const currentInflation = InflationManager.instance.CurrentInflationRate;
    this.playerData.inflationHistory.push({ week, value: currentInflation });

    // Prune history to keep it manageable, e.g., last 52 weeks
    if (this.playerData.assetHistory.length > 52) {
      this.playerData.assetHistory.shift();
      this.playerData.inflationHistory.shift();
    }

    GlobalEventEmitter.instance.emit('onHistoryUpdated');
    console.log(`Financial history updated for week ${week}.`);
  }

  public addMoney(amount: number): void { this.applyStatChange(StatType.Money, amount); }
  public decreaseMoney(amount: number): void { this.applyStatChange(StatType.Money, -amount); }

  public addBankBalance(amount: number): void { this.applyStatChange(StatType.BankBalance, amount); }
  public decreaseBankBalance(amount: number): void { this.applyStatChange(StatType.BankBalance, -amount); }

  public applyHealthChange(amount: number): void { this.applyStatChange(StatType.Health, amount); }
  public applyHappinessChange(amount: number): void { this.applyStatChange(StatType.Happiness, amount); }
  public applyEducationChange(amount: number): void { this.applyStatChange(StatType.Education, amount); }
  public applyStressChange(amount: number): void { this.applyStatChange(StatType.Stress, amount); }

  destroy() {
    GlobalEventEmitter.instance.off('onWeekEnd', this.handleWeekEnd, this);
  }
}

export { PlayerStatsController };