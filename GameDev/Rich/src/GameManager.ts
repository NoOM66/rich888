import Phaser from 'phaser';

enum GameState {
  MainMenu,
  GamePlaying,
  Paused,
  GameOver,
}

class GameManager {
  private static _instance: GameManager;
  private _currentState: GameState;
  private eventEmitter: Phaser.Events.EventEmitter;

  public static get instance(): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager();
    }
    return GameManager._instance;
  }

  private constructor() {
    this.eventEmitter = new Phaser.Events.EventEmitter();
    this._currentState = GameState.MainMenu; // Initial state
    console.log('GameManager initialized. Initial state:', GameState[this._currentState]);
  }

  public get CurrentState(): GameState {
    return this._currentState;
  }

  public changeState(newState: GameState): void {
    if (this._currentState === newState) {
      console.warn('Attempted to change to the same state:', GameState[newState]);
      return;
    }

    console.log('Changing state from', GameState[this._currentState], 'to', GameState[newState]);
    this._currentState = newState;
    this.eventEmitter.emit('onGameStateChanged', this._currentState);
  }

  // Public functions for state changes
  public startGame(): void {
    this.changeState(GameState.GamePlaying);
  }

  public pauseGame(): void {
    this.changeState(GameState.Paused);
  }

  public resumeGame(): void {
    // Only resume if currently paused
    if (this._currentState === GameState.Paused) {
      this.changeState(GameState.GamePlaying);
    } else {
      console.warn('Cannot resume game, not in Paused state.');
    }
  }

  public goToMainMenu(): void {
    this.changeState(GameState.MainMenu);
  }

  public gameOver(): void {
    this.changeState(GameState.GameOver);
  }

  // Event listener methods
  public on(event: string | symbol, fn: Function, context?: any): this {
    this.eventEmitter.on(event, fn, context);
    return this;
  }

  public off(event: string | symbol, fn?: Function, context?: any, once?: boolean): this {
    this.eventEmitter.off(event, fn, context, once);
    return this;
  }
}

export { GameManager, GameState };