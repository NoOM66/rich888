import Phaser from 'phaser';
import { GameManager, GameState } from './GameManager';
import { TurnManager } from './TurnManager';
import { PlayerStatsController } from './PlayerStatsController';
import { StatType } from './StatType';
import { SaveLoadManager } from './SaveLoadManager';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { InflationManager } from './InflationManager';
import { BankingManager } from './BankingManager';
import { Loan } from './Loan';
import { UIScene } from './scenes/UIScene';
import { FinancialDashboardScene } from './scenes/FinancialDashboardScene';

export class MainScene extends Phaser.Scene {
  private gameManager: GameManager;
  private turnManager: TurnManager;
  private playerStatsController: PlayerStatsController;
  private saveLoadManager: SaveLoadManager;
  private inflationManager: InflationManager;
  private bankingManager: BankingManager;

  private stateText!: Phaser.GameObjects.Text;
  private weekText!: Phaser.GameObjects.Text;
  private budgetText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private happinessText!: Phaser.GameObjects.Text;
  private educationText!: Phaser.GameObjects.Text;
  private stressText!: Phaser.GameObjects.Text;
  private inflationText!: Phaser.GameObjects.Text;
  private bankBalanceText!: Phaser.GameObjects.Text;
  private loanText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
    this.gameManager = GameManager.instance;
    this.turnManager = TurnManager.instance;
    this.playerStatsController = PlayerStatsController.instance;
    this.saveLoadManager = SaveLoadManager.instance;
    this.inflationManager = InflationManager.instance;
    this.bankingManager = BankingManager.instance;
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

    this.inflationText = this.add.text(400, 200, `Inflation: ${this.inflationManager.CurrentInflationRate * 100}%`, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Player Stats UI
    this.moneyText = this.add.text(100, 250, '', { fontSize: '20px', color: '#ffffff' });
    this.healthText = this.add.text(100, 280, '', { fontSize: '20px', color: '#ffffff' });
    this.happinessText = this.add.text(100, 310, '', { fontSize: '20px', color: '#ffffff' });
    this.educationText = this.add.text(100, 340, '', { fontSize: '20px', color: '#ffffff' });
    this.stressText = this.add.text(100, 370, '', { fontSize: '20px', color: '#ffffff' });

    // Banking UI
    this.bankBalanceText = this.add.text(500, 250, '', { fontSize: '20px', color: '#ffffff' });
    this.loanText = this.add.text(500, 280, '', { fontSize: '20px', color: '#ffffff' });

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

    const depositButton = this.add.text(100, 400, 'Deposit 100', {
      fontSize: '20px',
      color: '#00ff00',
      backgroundColor: '#333333',
      padding: 8
    }).setOrigin(0.5).setInteractive();

    const withdrawButton = this.add.text(300, 400, 'Withdraw 50', {
      fontSize: '20px',
      color: '#ff0000',
      backgroundColor: '#333333',
      padding: 8
    }).setOrigin(0.5).setInteractive();

    const takeLoanButton = this.add.text(500, 400, 'Take Loan 1000', {
      fontSize: '20px',
      color: '#00ffff',
      backgroundColor: '#333333',
      padding: 8
    }).setOrigin(0.5).setInteractive();

    const payLoanButton = this.add.text(700, 400, 'Pay Loan', {
      fontSize: '20px',
      color: '#ff8800',
      backgroundColor: '#333333',
      padding: 8
    }).setOrigin(0.5).setInteractive();

    // Add buttons to open UIScene and FinancialDashboardScene
    const openUISceneButton = this.add.text(200, 600, 'Open UI Scene', {
      fontSize: '24px',
      color: '#00ff00',
      backgroundColor: '#333333',
      padding: 10
    }).setOrigin(0.5).setInteractive();

    const openFinancialDashboardButton = this.add.text(600, 600, 'Open Financial Dashboard', {
      fontSize: '24px',
      color: '#00ff00',
      backgroundColor: '#333333',
      padding: 10
    }).setOrigin(0.5).setInteractive();

    openUISceneButton.on('pointerdown', async () => {
      await GameManager.instance.loadUIScene();
      this.scene.launch('UIScene'); // Use launch to run alongside MainScene
    });

    openFinancialDashboardButton.on('pointerdown', async () => {
      await GameManager.instance.loadFinancialDashboardScene();
      this.scene.launch('FinancialDashboardScene'); // Use launch to run alongside MainScene
    });

    // Subscribe to global events
    GlobalEventEmitter.instance.on('onGameStateChanged', this.handleGameStateChange, this);
    GlobalEventEmitter.instance.on('onWeekStart', this.handleWeekStart, this);
    GlobalEventEmitter.instance.on('onWeekEnd', this.handleWeekEnd, this);
    GlobalEventEmitter.instance.on('onStatChanged', this.handleStatChanged, this);
    GlobalEventEmitter.instance.on('onPlayerLost', this.handlePlayerLost, this);
    GlobalEventEmitter.instance.on('onInflationChanged', this.handleInflationChanged, this);
    GlobalEventEmitter.instance.on('onDeposit', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.on('onWithdrawal', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.on('onLoanTaken', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.on('onLoanPaymentMade', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.on('onMissedPayment', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.on('onLoanFullyPaid', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.on('onLoanPenaltyApplied', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.on('onBankruptcy', this.handleBankingEvent, this);

    // Add click listener to change game state for demonstration
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Only change game state if not clicking on buttons
      if (pointer.event.target !== spendTimeButton.canvas &&
          pointer.event.target !== endWeekButton.canvas &&
          pointer.event.target !== addMoneyButton.canvas &&
          pointer.event.target !== decreaseHealthButton.canvas &&
          pointer.event.target !== saveGameButton.canvas &&
          pointer.event.target !== loadGameButton.canvas &&
          pointer.event.target !== depositButton.canvas &&
          pointer.event.target !== withdrawButton.canvas &&
          pointer.event.target !== takeLoanButton.canvas &&
          pointer.event.target !== payLoanButton.canvas) {
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
      this.updateInflationUI();
      this.updateBankingUI();
    });

    depositButton.on('pointerdown', () => {
      if (this.gameManager.CurrentState === GameState.GamePlaying) {
        this.bankingManager.deposit(100);
      } else {
        console.warn('Can only deposit in GamePlaying state.');
      }
    });

    withdrawButton.on('pointerdown', () => {
      if (this.gameManager.CurrentState === GameState.GamePlaying) {
        this.bankingManager.withdraw(50);
      } else {
        console.warn('Can only withdraw in GamePlaying state.');
      }
    });

    takeLoanButton.on('pointerdown', () => {
      if (this.gameManager.CurrentState === GameState.GamePlaying) {
        this.bankingManager.takeLoan(1000);
      } else {
        console.warn('Can only take loan in GamePlaying state.');
      }
    });

    payLoanButton.on('pointerdown', () => {
      if (this.gameManager.CurrentState === GameState.GamePlaying) {
        const loans = this.playerStatsController.getPlayerData().activeLoans;
        if (loans.length > 0) {
          this.bankingManager.makeLoanPayment(loans[0], loans[0].paymentAmount);
        } else {
          console.warn('No active loans to pay.');
        }
      } else {
        console.warn('Can only pay loan in GamePlaying state.');
      }
    });

    // Initial UI update
    this.updateTurnUI();
    this.updatePlayerStatsUI();
    this.updateInflationUI();
    this.updateBankingUI();
  }

  private handleGameStateChange(newState: GameState): void {
    console.log('Game state changed to:', GameState[newState]);
    this.stateText.setText(`Current State: ${GameState[newState]}`);
    this.updateTurnUI();
    this.updatePlayerStatsUI();
    this.updateInflationUI();
    this.updateBankingUI();
  }

  private handleWeekStart(week: number): void {
    console.log(`Event: Week ${week} started.`);
    this.updateTurnUI();
    this.updatePlayerStatsUI();
    this.updateInflationUI();
    this.updateBankingUI();
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

  private handleInflationChanged(newInflationRate: number): void {
    console.log(`Event: Inflation changed to ${newInflationRate * 100}%.`);
    this.updateInflationUI();
  }

  private handleBankingEvent(...args: any[]): void {
    // Generic handler for banking events to trigger UI update
    this.updateBankingUI();
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

  private updateInflationUI(): void {
    this.inflationText.setText(`Inflation: ${this.inflationManager.CurrentInflationRate * 100}%`);
  }

  private updateBankingUI(): void {
    const playerData = this.playerStatsController.getPlayerData();
    this.bankBalanceText.setText(`Bank: ${playerData.bankBalance.toFixed(2)}`);
    if (playerData.activeLoans.length > 0) {
      const loan = playerData.activeLoans[0]; // Display first loan for simplicity
      this.loanText.setText(`Loan: ${loan.remainingAmount.toFixed(2)} (${loan.remainingPayments} payments)`);
    } else {
      this.loanText.setText('No Loans');
    }
  }

  // Don't forget to clean up event listeners when the scene is destroyed
  destroy() {
    // Unsubscribe from global events
    GlobalEventEmitter.instance.off('onGameStateChanged', this.handleGameStateChange, this);
    GlobalEventEmitter.instance.off('onWeekStart', this.handleWeekStart, this);
    GlobalEventEmitter.instance.off('onWeekEnd', this.handleWeekEnd, this);
    GlobalEventEmitter.instance.off('onStatChanged', this.handleStatChanged, this);
    GlobalEventEmitter.instance.off('onPlayerLost', this.handlePlayerLost, this);
    GlobalEventEmitter.instance.off('onInflationChanged', this.handleInflationChanged, this);
    GlobalEventEmitter.instance.off('onDeposit', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.off('onWithdrawal', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.off('onLoanTaken', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.off('onLoanPaymentMade', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.off('onMissedPayment', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.off('onLoanFullyPaid', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.off('onLoanPenaltyApplied', this.handleBankingEvent, this);
    GlobalEventEmitter.instance.off('onBankruptcy', this.handleBankingEvent, this);
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
  scene: [MainScene, UIScene, FinancialDashboardScene],
  backgroundColor: '#333333'
};

const game = new Phaser.Game(config);
GameManager.instance.setGameInstance(game);
