import Phaser from 'phaser';
import { PlayerStatsController } from './PlayerStatsController';
import { BankingManager } from './BankingManager';
import { InvestmentManager } from './InvestmentManager';
import { InflationManager } from './InflationManager';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { TurnManager } from './TurnManager'; // Import TurnManager

class FinancialDashboardScene extends Phaser.Scene {
  private incomeExpenseText!: Phaser.GameObjects.Text;
  private assetsText!: Phaser.GameObjects.Text;
  private liabilitiesText!: Phaser.GameObjects.Text;
  private graphContainer!: Phaser.GameObjects.Container; // For the graph
  private assetHistory: { week: number, totalAssets: number, inflationRate: number }[] = [];
  private graphGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'FinancialDashboardScene' });
  }

  preload() {
    // No assets to preload for now
  }

  create() {
    this.add.text(400, 50, 'Financial Dashboard', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

    // Income/Expense Summary
    this.incomeExpenseText = this.add.text(100, 100, 'Income/Expenses:', { fontSize: '20px', color: '#ffffff' });

    // Asset Details
    this.assetsText = this.add.text(100, 200, 'Assets:', { fontSize: '20px', color: '#ffffff' });

    // Liabilities
    this.liabilitiesText = this.add.text(100, 300, 'Liabilities:', { fontSize: '20px', color: '#ffffff' });

    // Graph Placeholder
    this.graphContainer = this.add.container(400, 400);
    this.graphGraphics = this.add.graphics();
    this.graphContainer.add(this.graphGraphics);
    this.graphContainer.add(this.add.text(0, -100, 'Asset Growth vs Inflation', { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5));


    // Back Button
    const backButton = this.add.text(50, 550, 'Back', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#555555',
      padding: 10
    }).setInteractive();

    backButton.on('pointerdown', () => {
      this.scene.stop('FinancialDashboardScene');
      this.scene.resume('MainScene'); // Assuming MainScene is the previous scene
    });

    // Subscribe to events
    GlobalEventEmitter.instance.on('onStatChanged', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onLoanTaken', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onLoanPaymentMade', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onInvestmentBought', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onInvestmentSold', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onInflationChanged', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onDeposit', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onWithdrawal', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onUpkeepPaid', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onUpkeepMissed', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onSalaryReceived', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onPromoted', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onJobQuit', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onCourseEnrolled', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onCourseCompleted', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onHomeSelected', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.on('onRentPaid', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onRentMissed', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onUtilitiesPaid', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onUtilitiesMissed', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onHomeUpgraded', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onHomeMoved', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onEconomicEventTriggered', this.handleUpdateUI, this);

    // Subscribe to OnWeekStart for history
    GlobalEventEmitter.instance.on('onWeekStart', this.handleWeekStart, this);

    // Initial UI update
    this.updateFinancialDataUI();
    this.updateGraph();
  }

  private handleUpdateUI(): void {
    this.updateFinancialDataUI();
    this.updateGraph();
  }

  private handleWeekStart(week: number): void {
    const totalAssets = PlayerStatsController.instance.getPlayerData().money +
                        PlayerStatsController.instance.getPlayerData().bankBalance +
                        InvestmentManager.instance.getTotalPortfolioValue();
    const inflationRate = InflationManager.instance.CurrentInflationRate;
    this.assetHistory.push({ week, totalAssets, inflationRate });
    // Keep history limited to a certain number of weeks for performance/display
    if (this.assetHistory.length > 20) {
      this.assetHistory.shift();
    }
    this.updateGraph();
  }

  private updateFinancialDataUI(): void {
    const playerData = PlayerStatsController.instance.getPlayerData();
    const loans = playerData.activeLoans;
    const totalLoans = loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);

    this.incomeExpenseText.setText([
      'Income/Expenses:',
      '  Weekly Income: N/A (To be implemented)',
      '  Weekly Expenses: N/A (To be implemented)',
    ]);

    this.assetsText.setText([
      'Assets:',
      `  Cash: ${playerData.money.toFixed(2)}`,
      `  Bank Balance: ${playerData.bankBalance.toFixed(2)}`,
      `  Investments: ${InvestmentManager.instance.getTotalPortfolioValue().toFixed(2)}`,
    ]);

    this.liabilitiesText.setText([
      'Liabilities:',
      `  Total Loans: ${totalLoans.toFixed(2)}`,
    ]);
  }

  private updateGraph(): void {
    this.graphGraphics.clear();
    if (this.assetHistory.length < 2) {
      this.graphGraphics.lineStyle(2, 0xcccccc);
      this.graphGraphics.strokeRect(-150, -80, 300, 160); // Draw a box for the graph area
      this.graphGraphics.fillStyle(0xcccccc, 1);
      this.graphGraphics.fillText('Not enough data for graph', -100, 0);
      return;
    }

    const graphWidth = 300;
    const graphHeight = 150;
    const padding = 10;
    const xOffset = -graphWidth / 2;
    const yOffset = -graphHeight / 2;

    // Draw background and border
    this.graphGraphics.lineStyle(1, 0x444444);
    this.graphGraphics.strokeRect(xOffset, yOffset, graphWidth, graphHeight);

    // Find min/max values for scaling
    const minAsset = Math.min(...this.assetHistory.map(data => data.totalAssets));
    const maxAsset = Math.max(...this.assetHistory.map(data => data.totalAssets));
    const minInflation = Math.min(...this.assetHistory.map(data => data.inflationRate));
    const maxInflation = Math.max(...this.assetHistory.map(data => data.inflationRate));

    const assetRange = maxAsset - minAsset;
    const inflationRange = maxInflation - minInflation;

    // Draw Asset Growth line
    this.graphGraphics.lineStyle(2, 0x00ff00); // Green for assets
    this.graphGraphics.beginPath();
    this.assetHistory.forEach((data, index) => {
      const x = xOffset + (index / (this.assetHistory.length - 1)) * graphWidth;
      const y = yOffset + graphHeight - ((data.totalAssets - minAsset) / assetRange) * graphHeight;
      if (index === 0) {
        this.graphGraphics.moveTo(x, y);
      } else {
        this.graphGraphics.lineTo(x, y);
      }
    });
    this.graphGraphics.strokePath();

    // Draw Inflation line
    this.graphGraphics.lineStyle(2, 0xff0000); // Red for inflation
    this.graphGraphics.beginPath();
    this.assetHistory.forEach((data, index) => {
      const x = xOffset + (index / (this.assetHistory.length - 1)) * graphWidth;
      const y = yOffset + graphHeight - ((data.inflationRate - minInflation) / inflationRange) * graphHeight;
      if (index === 0) {
        this.graphGraphics.moveTo(x, y);
      } else {
        this.graphGraphics.lineTo(x, y);
      }
    });
    this.graphGraphics.strokePath();
  }

  destroy() {
    // Unsubscribe from events
    GlobalEventEmitter.instance.off('onStatChanged', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onLoanTaken', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onLoanPaymentMade', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onInvestmentBought', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onInvestmentSold', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onInflationChanged', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onDeposit', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onWithdrawal', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onUpkeepPaid', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onUpkeepMissed', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onSalaryReceived', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onPromoted', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onJobQuit', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onCourseEnrolled', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onCourseCompleted', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onHomeSelected', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onRentPaid', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onRentMissed', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onUtilitiesPaid', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onUtilitiesMissed', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onHomeUpgraded', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onHomeMoved', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onEconomicEventTriggered', this.handleUpdateUI, this);
    GlobalEventEmitter.instance.off('onWeekStart', this.handleWeekStart, this);
  }
}

export { FinancialDashboardScene };
