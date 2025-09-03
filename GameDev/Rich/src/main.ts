import Phaser from 'phaser';
import { GameManager, GameState } from './GameManager';
import { TurnManager } from './TurnManager';

class MainScene extends Phaser.Scene {
  private gameManager: GameManager;
  private turnManager: TurnManager;
  private stateText!: Phaser.GameObjects.Text;
  private weekText!: Phaser.GameObjects.Text;
  private budgetText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
    this.gameManager = GameManager.instance;
    this.turnManager = TurnManager.instance;

    // Make GameManager globally accessible for Playwright E2E tests
    (window as any).GameManager = this.gameManager;
    // Make TurnManager globally accessible for Playwright E2E tests
    (window as any).TurnManager = this.turnManager;
  }

  preload() {
    // No assets to preload for now
  }

  create() {
    this.stateText = this.add.text(400, 100, `Current State: ${GameState[this.gameManager.CurrentState]}`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.weekText = this.add.text(400, 150, `Week: ${this.turnManager.currentWeek}`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.budgetText = this.add.text(400, 200, `Time Budget: ${this.turnManager.timeBudget} hours`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(400, 300, 'Click to change game state', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const spendTimeButton = this.add.text(200, 400, 'Spend 24 Hours', {
      fontSize: '24px',
      color: '#00ff00',
      backgroundColor: '#333333',
      padding: 10
    }).setOrigin(0.5).setInteractive();

    const endWeekButton = this.add.text(600, 400, 'End Week', {
      fontSize: '24px',
      color: '#ff0000',
      backgroundColor: '#333333',
      padding: 10
    }).setOrigin(0.5).setInteractive();

    // Subscribe to game state changes
    this.gameManager.on('onGameStateChanged', this.handleGameStateChange, this);

    // Subscribe to turn manager events
    this.turnManager.on('onWeekStart', this.handleWeekStart, this);
    this.turnManager.on('onWeekEnd', this.handleWeekEnd, this);

    // Add click listener to change game state for demonstration
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Only change game state if not clicking on buttons
      if (pointer.event.target !== spendTimeButton.canvas && pointer.event.target !== endWeekButton.canvas) {
        switch (this.gameManager.CurrentState) {
          case GameState.MainMenu:
            this.gameManager.startGame();
            break;
          case GameState.GamePlaying:
            this.gameManager.pauseGame();
            break;
          case GameState.Paused:
            this.gameManager.gameOver();
            break;
          case GameState.GameOver:
            this.gameManager.goToMainMenu();
            break;
        }
      }
    });

    spendTimeButton.on('pointerdown', () => {
      if (this.gameManager.CurrentState === GameState.GamePlaying) {
        this.turnManager.trySpendTime(24);
        this.updateTurnUI();
      } else {
        console.warn('Can only spend time in GamePlaying state.');
      }
    });

    endWeekButton.on('pointerdown', () => {
      if (this.gameManager.CurrentState === GameState.GamePlaying) {
        this.turnManager.endCurrentWeek();
      } else {
        console.warn('Can only end week in GamePlaying state.');
      }
    });

    // Initial UI update
    this.updateTurnUI();
  }

  private handleGameStateChange(newState: GameState): void {
    console.log('Game state changed to:', GameState[newState]);
    this.stateText.setText(`Current State: ${GameState[newState]}`);
    // If game starts, ensure TurnManager starts its first week
    if (newState === GameState.GamePlaying && this.turnManager.currentWeek === 0) {
      // This is handled by TurnManager listening to GameManager, so no direct call here
    }
    this.updateTurnUI();
  }

  private handleWeekStart(week: number): void {
    console.log(`Event: Week ${week} started.`);
    this.updateTurnUI();
  }

  private handleWeekEnd(week: number): void {
    console.log(`Event: Week ${week} ended.`);
    // updateTurnUI will be called by handleWeekStart after endCurrentWeek calls startNewWeek
  }

  private updateTurnUI(): void {
    this.weekText.setText(`Week: ${this.turnManager.currentWeek}`);
    this.budgetText.setText(`Time Budget: ${this.turnManager.timeBudget} hours`);
  }

  // Don't forget to clean up event listeners when the scene is destroyed
  destroy() {
    this.gameManager.off('onGameStateChanged', this.handleGameStateChange, this);
    this.turnManager.off('onWeekStart', this.handleWeekStart, this);
    this.turnManager.off('onWeekEnd', this.handleWeekEnd, this);
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }
    }
  },
  scene: MainScene,
  backgroundColor: '#333333'
};

new Phaser.Game(config);