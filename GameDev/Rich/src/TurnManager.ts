// Minimal TurnManager for Phaser/TypeScript project

type Listener = (...args: any[]) => void;

export class SimpleEventEmitter {
  private listeners = new Map<string, Listener[]>();

  on(event: string, fn: Listener) {
    const list = this.listeners.get(event) ?? [];
    list.push(fn);
    this.listeners.set(event, list);
  }

  off(event: string, fn?: Listener) {
    if (!fn) { this.listeners.delete(event); return; }
    const list = this.listeners.get(event) ?? [];
    this.listeners.set(event, list.filter(l => l !== fn));
  }

  emit(event: string, ...args: any[]) {
    const list = this.listeners.get(event) ?? [];
    for (const fn of list) fn(...args);
  }
}

export interface TurnPayload { currentWeek: number; timeBudget: number }

export class TurnManager {
  public static DEFAULT_WEEKLY_BUDGET = 168;
  public currentWeek = 0;
  public timeBudget = TurnManager.DEFAULT_WEEKLY_BUDGET;
  public events: any; // can be Phaser.Events.EventEmitter or SimpleEventEmitter

  private static _instance: TurnManager | null = null;

  static get instance() {
    if (!this._instance) this._instance = new TurnManager();
    return this._instance;
  }

  // allow injecting an external event emitter (e.g., GameManager.events or Phaser.Events.EventEmitter)
  constructor(emitter?: any) {
    // prefer Phaser.Events.EventEmitter when provided or available
    if (emitter) {
      this.events = emitter;
    } else {
      // try to use global Phaser if present
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Phaser = require('phaser');
        this.events = new Phaser.Events.EventEmitter();
      } catch (e) {
        this.events = new SimpleEventEmitter();
      }
    }
  }

  private emitWeekStart() {
    this.events.emit('onWeekStart', { currentWeek: this.currentWeek, timeBudget: this.timeBudget } as TurnPayload);
  }

  private emitWeekEnd() {
    this.events.emit('onWeekEnd', { currentWeek: this.currentWeek, timeBudget: this.timeBudget } as TurnPayload);
  }

  public startNewWeek(): void {
    this.currentWeek += 1;
    this.timeBudget = TurnManager.DEFAULT_WEEKLY_BUDGET;
    this.emitWeekStart();
  }

  public endCurrentWeek(): void {
    this.emitWeekEnd();
    this.startNewWeek();
  }

  public trySpendTime(hours: number): boolean {
    if (hours <= 0) return false;
    if (this.timeBudget >= hours) {
      this.timeBudget -= hours;
      this.events.emit('timeBudgetChanged', { currentWeek: this.currentWeek, timeBudget: this.timeBudget } as TurnPayload);
      if (this.timeBudget <= 0) this.endCurrentWeek();
      return true;
    }
    return false;
  }
}

export default TurnManager.instance;
