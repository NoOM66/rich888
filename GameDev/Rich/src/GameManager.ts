export enum GameState {
  MainMenu = 'MainMenu',
  GamePlaying = 'GamePlaying',
  Paused = 'Paused',
  GameOver = 'GameOver',
}

export type EventHandler = (...args: unknown[]) => void;

export interface EventEmitterLike {
  on(event: string, handler: EventHandler): void;
  off(event: string, handler?: EventHandler): void;
  emit(event: string, ...args: unknown[]): void;
}

// Minimal internal EventEmitter to avoid requiring Phaser in tests.
class SimpleEmitter implements EventEmitterLike {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler?: EventHandler): void {
    if (!this.listeners.has(event)) return;
    if (!handler) {
      this.listeners.delete(event);
      return;
    }
    this.listeners.get(event)!.delete(handler);
  }

  emit(event: string, ...args: unknown[]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const h of Array.from(set)) h(...args);
  }
}

export class GameManager {
  private static _instance: GameManager | null = null;
  private emitter: EventEmitterLike;
  private _currentState: GameState;

  private constructor(emitter?: EventEmitterLike) {
    this.emitter = emitter ?? new SimpleEmitter();
    this._currentState = GameState.MainMenu;
  }

  static init(emitter?: EventEmitterLike): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager(emitter);
    }
    return GameManager._instance;
  }

  static get instance(): GameManager {
    if (!GameManager._instance) throw new Error('GameManager not initialized');
    return GameManager._instance;
  }

  get currentState(): GameState {
    return this._currentState;
  }

  onStateChanged(handler: (state: GameState) => void): void {
    const wrapper: EventHandler = (s: unknown) => handler(s as GameState);
    // store wrapper reference if needed (not exposed) — simple approach
    this.emitter.on('stateChanged', wrapper);
  }

  offStateChanged(handler?: (state: GameState) => void): void {
    if (!handler) {
      this.emitter.off('stateChanged');
      return;
    }
    const wrapper: EventHandler = (s: unknown) => handler(s as GameState);
    this.emitter.off('stateChanged', wrapper);
  }

  private changeState(newState: GameState): void {
    if (this._currentState === newState) return;
    this._currentState = newState;
    this.emitter.emit('stateChanged', newState);
  }

  startNewGame(): void {
    this.changeState(GameState.GamePlaying);
  }

  pauseGame(): void {
    this.changeState(GameState.Paused);
  }

  goToMainMenu(): void {
    this.changeState(GameState.MainMenu);
  }

  endGame(): void {
    this.changeState(GameState.GameOver);
  }

  // For test/cleanup convenience
  static _resetForTests(): void {
    GameManager._instance = null;
  }
}

export default GameManager;
