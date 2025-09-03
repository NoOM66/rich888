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
        return Math.max(value, this.MIN_STAT_VALUE); // Money can be very high, only clamp min
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

  // Public methods to change stats
  public addMoney(amount: number): void { this.applyStatChange(StatType.Money, amount); }
  public decreaseMoney(amount: number): void { this.applyStatChange(StatType.Money, -amount); }

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
