import Phaser from 'phaser';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { StatType } from './StatType';

class InflationManager {
  private static _instance: InflationManager;

  public CurrentInflationRate: number;
  private weeksSinceLastChange: number;

  private readonly MIN_INFLATION_RATE: number = 0.01; // 1%
  private readonly MAX_INFLATION_RATE: number = 0.05; // 5%
  private readonly INFLATION_CHANGE_INTERVAL_WEEKS: number = 4;

  public static get instance(): InflationManager {
    if (!InflationManager._instance) {
      InflationManager._instance = new InflationManager();
    }
    return InflationManager._instance;
  }

  private constructor() {
    this.CurrentInflationRate = this.MIN_INFLATION_RATE; // Initial rate
    this.weeksSinceLastChange = 0;

    GlobalEventEmitter.instance.on('onWeekStart', this.handleWeekStart, this);

    console.log('InflationManager initialized.');
  }

  private handleWeekStart(week: number): void {
    this.weeksSinceLastChange++;

    if (this.weeksSinceLastChange >= this.INFLATION_CHANGE_INTERVAL_WEEKS) {
      this.changeInflationRate();
      this.weeksSinceLastChange = 0;
    }
  }

  private changeInflationRate(): void {
    const newRate = Phaser.Math.FloatBetween(this.MIN_INFLATION_RATE, this.MAX_INFLATION_RATE);
    this.CurrentInflationRate = parseFloat(newRate.toFixed(4)); // Round to 4 decimal places
    GlobalEventEmitter.instance.emit('onInflationChanged', this.CurrentInflationRate);
    console.log(`Inflation rate changed to: ${this.CurrentInflationRate}`);
  }

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

export { InflationManager };
