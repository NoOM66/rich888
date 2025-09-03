import Phaser from 'phaser';
import { GameManager, GameState } from './GameManager';
import { TurnManager } from './TurnManager';
import { PlayerStatsController } from './PlayerStatsController';
import { StatType } from './StatType';
import { SaveLoadManager } from './SaveLoadManager';
import { GlobalEventEmitter } from './GlobalEventEmitter';

class MainScene extends Phaser.Scene {
  private gameManager: GameManager;
  private turnManager: TurnManager;
  private playerStatsController: PlayerStatsController;
  private saveLoadManager: SaveLoadManager;

  private stateText!: Phaser.GameObjects.Text;
  private weekText!: Phaser.GameObjects.Text;
  private budgetText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private happinessText!: Phaser.GameObjects.Text;
  private educationText!: Phaser.GameObjects.Text;
  private stressText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
    this.gameManager = GameManager.instance;
    this.turnManager = TurnManager.instance;
    this.playerStatsController = PlayerStatsController.instance;
    this.saveLoadManager = SaveLoadManager.instance;

    // Make Managers globally accessible for Playwright E2E tests
    (window as any).GameManager = this.gameManager;
    (window as any).TurnManager = this.turnManager;
    (window as any).PlayerStatsController = this.playerStatsController;
    (window as any).SaveLoadManager = this.saveLoadManager;
  }

  preload() {
    // No assets to preload for now
  }

  create() {
    this.stateText = this.add.text(400, 50, `Current State: ${GameState[this.gameManager.CurrentState]}`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.weekText = this.add.text(400, 100, `Week: ${this.turnManager.currentWeek}`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.budgetText = this.add.text(400, 150, `Time Budget: ${this.turnManager.timeBudget} hours`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Player Stats UI
    this.moneyText = this.add.text(100, 250, '', { fontSize: '20px', color: '#ffffff' });
    this.healthText = this.add.text(100, 280, '', { fontSize: '20px', color: '#ffffff' });
    this.happinessText = this.add.text(100, 310, '', { fontSize: '20px', color: '#ffffff' });
    this.educationText = this.add.text(100, 340, '', { fontSize: '20px', color: '#ffffff' });
    this.stressText = this.add.text(100, 370, '', { fontSize: '20px', color: '#ffffff' });

    this.add.text(400, 450, 'Click to change game state', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const spendTimeButton = this.add.text(200, 500, 'Spend 24 Hours', {
      fontSize: '24px',
      color: '#00ff00',
      backgroundColor: '#333333',
      padding: 10
    }).setOrigin(0.5).setInteractive();

    const endWeekButton = this.add.text(600, 500, 'End Week', {
      fontSize: '24px',
      color: '#ff0000',
      backgroundColor: '#333333',
      padding: 10
    }).setOrigin(0.5).setInteractive();

    const addMoneyButton = this.add.text(100, 550, 'Add Money', {
      fontSize: '20px',
      color: '#00ffff',
      backgroundColor: '#333333',
      padding: 8
    }).setOrigin(0.5).setInteractive();

    const decreaseHealthButton = this.add.text(300, 550, 'Dec Health', {
      fontSize: '20px',
      color: '#ff8800',
      backgroundColor: '#333333',
      padding: 8
    }).setOrigin(0.5).setInteractive();

    const saveGameButton = this.add.text(500, 550, 'Save Game', {
      fontSize: '20px',
      color: '#ffff00',
      backgroundColor: '#333333',
      padding: 8
    }).setOrigin(0.5).setInteractive();

    const loadGameButton = this.add.text(700, 550, 'Load Game', {
      fontSize: '20px',
      color: '#00ff00',
      backgroundColor: '#333333',
      padding: 8
    }).setOrigin(0.5).setInteractive();

    // Subscribe to global events
    GlobalEventEmitter.instance.on('onGameStateChanged', this.handleGameStateChange, this);
    GlobalEventEmitter.instance.on('onWeekStart', this.handleWeekStart, this);
    GlobalEventEmitter.instance.on('onWeekEnd', this.handleWeekEnd, this);
    GlobalEventEmitter.instance.on('onStatChanged', this.handleStatChanged, this);
    GlobalEventEmitter.instance.on('onPlayerLost', this.handlePlayerLost, this);

    // Add click listener to change game state for demonstration
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Only change game state if not clicking on buttons
      if (pointer.event.target !== spendTimeButton.canvas &&
          pointer.event.target !== endWeekButton.canvas &&
          pointer.event.target !== addMoneyButton.canvas &&
          pointer.event.target !== decreaseHealthButton.canvas &&
          pointer.event.target !== saveGameButton.canvas &&
          pointer.event.target !== loadGameButton.canvas) {
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

    addMoneyButton.on('pointerdown', () => {
      this.playerStatsController.addMoney(100);
    });

    decreaseHealthButton.on('pointerdown', () => {
      this.playerStatsController.applyHealthChange(-20);
    });

    saveGameButton.on('pointerdown', () => {
      this.saveLoadManager.saveGame();
    });

    loadGameButton.on('pointerdown', () => {
      this.saveLoadManager.loadGame();
      this.updateTurnUI();
      this.updatePlayerStatsUI();
    });

    // Initial UI update
    this.updateTurnUI();
    this.updatePlayerStatsUI();
  }

  private handleGameStateChange(newState: GameState): void {
    console.log('Game state changed to:', GameState[newState]);
    this.stateText.setText(`Current State: ${GameState[newState]}`);
    this.updateTurnUI();
    this.updatePlayerStatsUI();
  }

  private handleWeekStart(week: number): void {
    console.log(`Event: Week ${week} started.`);
    this.updateTurnUI();
    this.updatePlayerStatsUI();
  }

  private handleWeekEnd(week: number): void {
    console.log(`Event: Week ${week} ended.`);
    // updateTurnUI will be called by handleWeekStart after endCurrentWeek calls startNewWeek
  }

  private handleStatChanged(statType: StatType, newValue: number, oldValue: number): void {
    console.log(`Event: ${statType} changed from ${oldValue} to ${newValue}.`);
    this.updatePlayerStatsUI();
  }

  private handlePlayerLost(): void {
    console.log('Event: Player Lost!');
    // GameManager will handle the state change to GameOver
  }

  private updateTurnUI(): void {
    this.weekText.setText(`Week: ${this.turnManager.currentWeek}`);
    this.budgetText.setText(`Time Budget: ${this.turnManager.timeBudget} hours`);
  }

  private updatePlayerStatsUI(): void {
    const playerData = this.playerStatsController.getPlayerData();
    this.moneyText.setText(`Money: ${playerData.money}`);
    this.healthText.setText(`Health: ${playerData.health}`);
    this.happinessText.setText(`Happiness: ${playerData.happiness}`);
    this.educationText.setText(`Education: ${playerData.education}`);
    this.stressText.setText(`Stress: ${playerData.stress}`);
  }

  // Don't forget to clean up event listeners when the scene is destroyed
  destroy() {
    // Unsubscribe from global events
    GlobalEventEmitter.instance.off('onGameStateChanged', this.handleGameStateChange, this);
    GlobalEventEmitter.instance.off('onWeekStart', this.handleWeekStart, this);
    GlobalEventEmitter.instance.off('onWeekEnd', this.handleWeekEnd, this);
    GlobalEventEmitter.instance.off('onStatChanged', this.handleStatChanged, this);
    GlobalEventEmitter.instance.off('onPlayerLost', this.handlePlayerLost, this);
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
