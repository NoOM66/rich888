import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { InflationManager } from './InflationManager';
import { Loan } from './Loan';
import { TurnManager } from './TurnManager';
import { GameManager, GameState } from './GameManager'; // Import GameManager and GameState

export class BankingManager {
    private static instance: BankingManager;
    private weekCounter: number = 0;
    private readonly INTEREST_CALCULATION_INTERVAL: number = 4;
    private readonly DEPOSIT_INTEREST_RATE_OFFSET: number = 0.005;
    private readonly LOAN_INTEREST_RATE_OFFSET: number = 0.01;
    private readonly MISSED_PAYMENT_PENALTY_RATE: number = 0.05; // 5% penalty on remaining payment

    private constructor() {
        GlobalEventEmitter.instance.on('onWeekStart', this.handleWeekStart, this);
    }

    public static getInstance(): BankingManager {
        if (!BankingManager.instance) {
            BankingManager.instance = new BankingManager();
        }
        return BankingManager.instance;
    }

    private handleWeekStart(currentWeek: number): void {
        this.weekCounter++;
        if (this.weekCounter % this.INTEREST_CALCULATION_INTERVAL === 0) {
            this.calculateDepositInterest();
            this.handleLoanPaymentsAndPenalties(currentWeek); // Call new method
        }
    }

    private calculateDepositInterest(): void {
        const currentBankBalance = PlayerStatsController.instance.getPlayerData().bankBalance;
        if (currentBankBalance <= 0) {
            console.log("No bank balance to calculate interest for.");
            return;
        }

        const currentInflationRate = InflationManager.instance.CurrentInflationRate;
        const depositInterestRate = Math.max(0, currentInflationRate - this.DEPOSIT_INTEREST_RATE_OFFSET);

        const interestAmount = currentBankBalance * depositInterestRate;
        PlayerStatsController.instance.addBankBalance(interestAmount);
        console.log(`Calculated ${interestAmount.toFixed(2)} interest. New bank balance: ${PlayerStatsController.instance.getPlayerData().bankBalance.toFixed(2)}`);
        GlobalEventEmitter.instance.emit('onDepositInterestCalculated', interestAmount);
    }

    private handleLoanPaymentsAndPenalties(currentWeek: number): void {
        const activeLoans = PlayerStatsController.instance.getPlayerData().activeLoans;
        const loansToProcess = [...activeLoans]; // Create a copy to avoid modification issues during iteration

        loansToProcess.forEach(loan => {
            if (currentWeek >= loan.nextPaymentWeek) {
                console.log(`Loan ${loan.id} payment due. Amount: ${loan.paymentAmount.toFixed(2)}`);
                const playerMoney = PlayerStatsController.instance.getPlayerData().money;

                if (playerMoney >= loan.paymentAmount) {
                    // Player has enough money, make payment
                    this.makeLoanPayment(loan, loan.paymentAmount);
                    loan.nextPaymentWeek = currentWeek + this.INTEREST_CALCULATION_INTERVAL; // Set next due date
                    PlayerStatsController.instance.updateLoan(loan);
                } else {
                    // Player does not have enough money, apply penalty
                    const penaltyAmount = loan.paymentAmount * this.MISSED_PAYMENT_PENALTY_RATE;
                    const totalPenalty = loan.paymentAmount + penaltyAmount;
                    console.warn(`Missed payment for loan ${loan.id}. Penalty: ${penaltyAmount.toFixed(2)}. Total due: ${totalPenalty.toFixed(2)}`);

                    GlobalEventEmitter.instance.emit('onMissedPayment', loan, penaltyAmount);

                    // Attempt to deduct what's possible, or trigger bankruptcy
                    if (playerMoney > 0) {
                        PlayerStatsController.instance.decreaseMoney(playerMoney);
                        loan.remainingAmount -= playerMoney;
                    }

                    // Check for bankruptcy
                    if (PlayerStatsController.instance.getPlayerData().money <= 0 && loan.remainingAmount > 0) {
                        GlobalEventEmitter.instance.emit('onBankruptcy');
                        GameManager.instance.gameOver();
                        console.error("Player is bankrupt due to missed loan payments!");
                    }
                    loan.nextPaymentWeek = currentWeek + this.INTEREST_CALCULATION_INTERVAL;
                    PlayerStatsController.instance.updateLoan(loan);
                }
            }
        });
    }

    public deposit(amount: number): boolean {
        if (amount <= 0) {
            console.warn("Deposit amount must be positive.");
            return false;
        }
        const currentMoney = PlayerStatsController.instance.getPlayerData().money;
        if (currentMoney < amount) {
            console.warn("Not enough cash to deposit.");
            return false;
        }

        PlayerStatsController.instance.decreaseMoney(amount);
        PlayerStatsController.instance.addBankBalance(amount);
        GlobalEventEmitter.instance.emit('onDeposit', amount);
        console.log(`Deposited ${amount}. New bank balance: ${PlayerStatsController.instance.getPlayerData().bankBalance}`);
        return true;
    }

    public withdraw(amount: number): boolean {
        if (amount <= 0) {
            console.warn("Withdraw amount must be positive.");
            return false;
        }
        const currentBankBalance = PlayerStatsController.instance.getPlayerData().bankBalance;
        if (currentBankBalance < amount) {
            console.warn("Not enough bank balance to withdraw.");
            return false;
        }

        PlayerStatsController.instance.decreaseBankBalance(amount);
        PlayerStatsController.instance.addMoney(amount);
        GlobalEventEmitter.instance.emit('onWithdrawal', amount);
        console.log(`Withdrew ${amount}. New cash: ${PlayerStatsController.instance.getPlayerData().money}`);
        return true;
    }

    public takeLoan(amount: number): Loan | null {
        if (amount <= 0) {
            console.warn("Loan amount must be positive.");
            return null;
        }

        const currentInflationRate = InflationManager.instance.CurrentInflationRate;
        const loanInterestRate = currentInflationRate + this.LOAN_INTEREST_RATE_OFFSET;

        const numberOfPayments = 12;
        const paymentAmount = (amount * (1 + loanInterestRate)) / numberOfPayments;

        const newLoan: Loan = {
            id: `loan-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            amount: amount,
            interestRate: loanInterestRate,
            originalAmount: amount,
            remainingAmount: amount * (1 + loanInterestRate),
            remainingPayments: numberOfPayments,
            paymentAmount: paymentAmount,
            nextPaymentWeek: TurnManager.instance.currentWeek + this.INTEREST_CALCULATION_INTERVAL,
        };

        PlayerStatsController.instance.addLoan(newLoan);
        PlayerStatsController.instance.addMoney(amount);

        GlobalEventEmitter.instance.emit('onLoanTaken', newLoan);
        console.log(`Loan taken: ${amount}. Total to repay: ${newLoan.remainingAmount.toFixed(2)}`);
        return newLoan;
    }

    public makeLoanPayment(loan: Loan, amount: number): boolean {
        if (amount <= 0) {
            console.warn("Payment amount must be positive.");
            return false;
        }
        if (PlayerStatsController.instance.getPlayerData().money < amount) {
            console.warn("Not enough cash to make loan payment.");
            return false;
        }

        PlayerStatsController.instance.decreaseMoney(amount);
        loan.remainingAmount -= amount;
        loan.remainingPayments--;

        if (loan.remainingAmount <= 0 || loan.remainingPayments <= 0) {
            PlayerStatsController.instance.removeLoan(loan.id);
            GlobalEventEmitter.instance.emit('onLoanPaid', loan);
            console.log(`Loan ${loan.id} fully paid.`);
        } else {
            PlayerStatsController.instance.updateLoan(loan);
            GlobalEventEmitter.instance.emit('onLoanPaymentMade', loan, amount);
            console.log(`Payment of ${amount} made for loan ${loan.id}. Remaining: ${loan.remainingAmount.toFixed(2)}`);
        }
        return true;
    }
}