import Phaser from 'phaser';
import { GameManager, GameState } from './GameManager';

class TurnManager {
  private static _instance: TurnManager;
  private eventEmitter: Phaser.Events.EventEmitter;

  public currentWeek: number;
  public timeBudget: number;

  private readonly DEFAULT_WEEKLY_BUDGET: number = 168; // 24 hours * 7 days

  public static get instance(): TurnManager {
    if (!TurnManager._instance) {
      TurnManager._instance = new TurnManager();
    }
    return TurnManager._instance;
  }

  private constructor() {
    this.eventEmitter = new Phaser.Events.EventEmitter();
    this.currentWeek = 0;
    this.timeBudget = this.DEFAULT_WEEKLY_BUDGET;

    // Listen to GameManager state changes
    GameManager.instance.on('onGameStateChanged', this.handleGameStateChange, this);

    console.log('TurnManager initialized.');
  }

  private handleGameStateChange(newState: GameState): void {
    if (newState === GameState.GamePlaying && this.currentWeek === 0) {
      // Start the first week when the game enters GamePlaying state
      this.startNewWeek();
    }
  }

  public startNewWeek(): void {
    this.currentWeek++;
    this.timeBudget = this.DEFAULT_WEEKLY_BUDGET;
    this.eventEmitter.emit('onWeekStart', this.currentWeek);
    console.log(`Week ${this.currentWeek} started. Time Budget: ${this.timeBudget} hours.`);
  }

  public endCurrentWeek(): void {
    this.eventEmitter.emit('onWeekEnd', this.currentWeek);
    console.log(`Week ${this.currentWeek} ended.`);
    this.startNewWeek(); // Automatically start new week after current one ends
  }

  public trySpendTime(hours: number): boolean {
    if (hours < 0) {
      console.warn('Cannot spend negative time.');
      return false;
    }

    if (this.timeBudget >= hours) {
      this.timeBudget -= hours;
      console.log(`Spent ${hours} hours. Remaining budget: ${this.timeBudget} hours.`);
      return true;
    } else {
      console.warn(`Not enough time. Remaining: ${this.timeBudget}, trying to spend: ${hours}`);
      return false;
    }
  }

  // Event listener methods (delegated from EventEmitter)
  public on(event: string | symbol, fn: Function, context?: any): this {
    this.eventEmitter.on(event, fn, context);
    return this;
  }

  public off(event: string | symbol, fn?: Function, context?: any, once?: boolean): this {
    this.eventEmitter.off(event, fn, context, once);
    return this;
  }
}

export { TurnManager };
