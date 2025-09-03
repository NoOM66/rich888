import Phaser from 'phaser';
import { GlobalEventEmitter } from './GlobalEventEmitter';

enum GameState {
  MainMenu,
  GamePlaying,
  Paused,
  GameOver,
}

class GameManager {
  private static _instance: GameManager;
  private _currentState: GameState;

  public static get instance(): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager();
    }
    return GameManager._instance;
  }

  private constructor() {
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
    GlobalEventEmitter.instance.emit('onGameStateChanged', this._currentState);
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
}

export { GameManager, GameState };
