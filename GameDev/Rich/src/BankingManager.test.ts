import { BankingManager } from './BankingManager';
import { PlayerStatsController } from './PlayerStatsController';
import { GlobalEventEmitter } from './GlobalEventEmitter';
import { InflationManager } from './InflationManager';
import { TurnManager } from './TurnManager';
import { Loan } from './Loan';

// Mock dependencies
jest.mock('./PlayerStatsController');
jest.mock('./GlobalEventEmitter');
jest.mock('./InflationManager');
jest.mock('./TurnManager');

describe('BankingManager', () => {
  let bankingManager: BankingManager;
  let mockPlayerStatsController: jest.Mocked<typeof PlayerStatsController>;
  let mockGlobalEventEmitter: jest.Mocked<typeof GlobalEventEmitter>;
  let mockInflationManager: jest.Mocked<typeof InflationManager>;
  let mockTurnManager: jest.Mocked<typeof TurnManager>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock PlayerStatsController instance
    mockPlayerStatsController = PlayerStatsController as jest.Mocked<typeof PlayerStatsController>;
    mockPlayerStatsController.instance = {
      getPlayerData: jest.fn(() => ({
        money: 1000,
        bankBalance: 500,
        activeLoans: [],
      })),
      addMoney: jest.fn(),
      decreaseMoney: jest.fn(),
      addBankBalance: jest.fn(),
      decreaseBankBalance: jest.fn(),
      addLoan: jest.fn(),
      removeLoan: jest.fn(),
      updateLoan: jest.fn(),
    } as any; // Cast to any to bypass strict type checking for mocks

    // Mock GlobalEventEmitter instance
    mockGlobalEventEmitter = GlobalEventEmitter as jest.Mocked<typeof GlobalEventEmitter>;
    mockGlobalEventEmitter.instance = {
      on: jest.fn(),
      emit: jest.fn(),
    } as any;

    // Mock InflationManager instance
    mockInflationManager = InflationManager as jest.Mocked<typeof InflationManager>;
    mockInflationManager.instance = {
      CurrentInflationRate: 0.02, // Default inflation rate for tests
    } as any;

    // Mock TurnManager instance
    mockTurnManager = TurnManager as jest.Mocked<typeof TurnManager>;
    mockTurnManager.instance = {
      currentWeek: 1,
    } as any;

    // Get a new instance of BankingManager for each test
    bankingManager = BankingManager.getInstance();
  });

  // 8.1. เทสกลไกฝาก/ถอนเงิน และกรณีขอบเขต (เช่น ถอนเกินยอด)
  describe('deposit', () => {
    it('should allow depositing money if cash is sufficient', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValueOnce({
        money: 1000,
        bankBalance: 500,
        activeLoans: [],
      });
      const result = bankingManager.deposit(100);
      expect(result).toBe(true);
      expect(mockPlayerStatsController.instance.decreaseMoney).toHaveBeenCalledWith(100);
      expect(mockPlayerStatsController.instance.addBankBalance).toHaveBeenCalledWith(100);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onDeposit', 100);
    });

    it('should not allow depositing negative or zero amount', () => {
      const result = bankingManager.deposit(-50);
      expect(result).toBe(false);
      expect(mockPlayerStatsController.instance.decreaseMoney).not.toHaveBeenCalled();
      expect(mockPlayerStatsController.instance.addBankBalance).not.toHaveBeenCalled();
    });

    it('should not allow depositing money if cash is insufficient', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValueOnce({
        money: 50,
        bankBalance: 500,
        activeLoans: [],
      });
      const result = bankingManager.deposit(100);
      expect(result).toBe(false);
      expect(mockPlayerStatsController.instance.decreaseMoney).not.toHaveBeenCalled();
      expect(mockPlayerStatsController.instance.addBankBalance).not.toHaveBeenCalled();
    });
  });

  describe('withdraw', () => {
    it('should allow withdrawing money if bank balance is sufficient', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValueOnce({
        money: 1000,
        bankBalance: 500,
        activeLoans: [],
      });
      const result = bankingManager.withdraw(100);
      expect(result).toBe(true);
      expect(mockPlayerStatsController.instance.decreaseBankBalance).toHaveBeenCalledWith(100);
      expect(mockPlayerStatsController.instance.addMoney).toHaveBeenCalledWith(100);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onWithdrawal', 100);
    });

    it('should not allow withdrawing negative or zero amount', () => {
      const result = bankingManager.withdraw(-50);
      expect(result).toBe(false);
      expect(mockPlayerStatsController.instance.decreaseBankBalance).not.toHaveBeenCalled();
      expect(mockPlayerStatsController.instance.addMoney).not.toHaveBeenCalled();
    });

    it('should not allow withdrawing money if bank balance is insufficient', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValueOnce({
        money: 1000,
        bankBalance: 50,
        activeLoans: [],
      });
      const result = bankingManager.withdraw(100);
      expect(result).toBe(false);
      expect(mockPlayerStatsController.instance.decreaseBankBalance).not.toHaveBeenCalled();
      expect(mockPlayerStatsController.instance.addMoney).not.toHaveBeenCalled();
    });
  });

  // 8.2. เทสการคำนวณดอกเบี้ยเงินฝาก
  describe('calculateDepositInterest', () => {
    it('should calculate and add interest to bank balance', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 1000,
        bankBalance: 1000,
        activeLoans: [],
      });
      mockInflationManager.instance.CurrentInflationRate = 0.05; // 5% inflation
      // Expected deposit interest rate: 0.05 - 0.005 = 0.045 (4.5%)
      // Interest amount: 1000 * 0.045 = 45
      (bankingManager as any).calculateDepositInterest(); // Call private method
      expect(mockPlayerStatsController.instance.addBankBalance).toHaveBeenCalledWith(45);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onDepositInterestCalculated', 45);
    });

    it('should not calculate interest if bank balance is zero or negative', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 1000,
        bankBalance: 0,
        activeLoans: [],
      });
      (bankingManager as any).calculateDepositInterest();
      expect(mockPlayerStatsController.instance.addBankBalance).not.toHaveBeenCalled();
    });

    it('should ensure deposit interest rate is not negative', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 1000,
        bankBalance: 1000,
        activeLoans: [],
      });
      mockInflationManager.instance.CurrentInflationRate = 0.001; // Very low inflation
      // Expected deposit interest rate: max(0, 0.001 - 0.005) = 0
      (bankingManager as any).calculateDepositInterest();
      expect(mockPlayerStatsController.instance.addBankBalance).toHaveBeenCalledWith(0);
    });
  });

  // 8.3. เทสการสร้างเงินกู้และการชำระเงินกู้
  describe('takeLoan', () => {
    it('should create a new loan and add it to active loans', () => {
      const loanAmount = 1000;
      const loan = bankingManager.takeLoan(loanAmount);
      expect(loan).not.toBeNull();
      expect(loan?.amount).toBe(loanAmount);
      expect(mockPlayerStatsController.instance.addLoan).toHaveBeenCalledWith(expect.any(Object));
      expect(mockPlayerStatsController.instance.addMoney).toHaveBeenCalledWith(loanAmount);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onLoanTaken', expect.any(Object));
    });

    it('should not allow taking negative or zero loan amount', () => {
      const loan = bankingManager.takeLoan(-100);
      expect(loan).toBeNull();
      expect(mockPlayerStatsController.instance.addLoan).not.toHaveBeenCalled();
    });
  });

  describe('makeLoanPayment', () => {
    let testLoan: Loan;

    beforeEach(() => {
      testLoan = {
        id: 'loan-123',
        amount: 1000,
        interestRate: 0.05,
        originalAmount: 1000,
        remainingAmount: 1050,
        remainingPayments: 10,
        paymentAmount: 105,
        nextPaymentWeek: 5,
      };
    });

    it('should make a payment and update loan details', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValueOnce({
        money: 200,
        bankBalance: 0,
        activeLoans: [testLoan],
      });
      const result = bankingManager.makeLoanPayment(testLoan, 105);
      expect(result).toBe(true);
      expect(mockPlayerStatsController.instance.decreaseMoney).toHaveBeenCalledWith(105);
      expect(testLoan.remainingAmount).toBeCloseTo(1050 - 105);
      expect(testLoan.remainingPayments).toBe(9);
      expect(mockPlayerStatsController.instance.updateLoan).toHaveBeenCalledWith(testLoan);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onLoanPaymentMade', testLoan, 105);
    });

    it('should mark loan as paid and remove it if remaining amount is zero or less', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValueOnce({
        money: 200,
        bankBalance: 0,
        activeLoans: [testLoan],
      });
      testLoan.remainingAmount = 50; // Set a small remaining amount
      const result = bankingManager.makeLoanPayment(testLoan, 50);
      expect(result).toBe(true);
      expect(mockPlayerStatsController.instance.removeLoan).toHaveBeenCalledWith(testLoan.id);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onLoanPaid', testLoan);
    });

    it('should not allow making negative or zero payment', () => {
      const result = bankingManager.makeLoanPayment(testLoan, -10);
      expect(result).toBe(false);
      expect(mockPlayerStatsController.instance.decreaseMoney).not.toHaveBeenCalled();
    });

    it('should not allow making payment if cash is insufficient', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValueOnce({
        money: 50,
        bankBalance: 0,
        activeLoans: [testLoan],
      });
      const result = bankingManager.makeLoanPayment(testLoan, 105);
      expect(result).toBe(false);
      expect(mockPlayerStatsController.instance.decreaseMoney).not.toHaveBeenCalled();
    });
  });

  // 8.4. เทสการคำนวณบทลงโทษเมื่อผิดนัดชำระ และการจัดการสถานะล้มละลาย
  describe('handleLoanPaymentsAndPenalties', () => {
    let overdueLoan: Loan;

    beforeEach(() => {
      overdueLoan = {
        id: 'loan-overdue',
        amount: 1000,
        interestRate: 0.05,
        originalAmount: 1000,
        remainingAmount: 1050,
        remainingPayments: 1,
        paymentAmount: 105,
        nextPaymentWeek: 1, // Due in week 1
      };
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 100, // Not enough to cover payment
        bankBalance: 0,
        activeLoans: [overdueLoan],
      });
      mockTurnManager.instance.currentWeek = 5; // Current week is past due date
      (bankingManager as any).makeLoanPayment = jest.fn(); // Mock makeLoanPayment
    });

    it('should process overdue loans and apply penalty if cash is insufficient', () => {
      (bankingManager as any).handleLoanPaymentsAndPenalties(mockTurnManager.instance.currentWeek);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onMissedPayment', overdueLoan, overdueLoan.paymentAmount * 0.05);
      expect(mockPlayerStatsController.instance.decreaseMoney).toHaveBeenCalledWith(100); // Deduct all money
      expect(overdueLoan.remainingAmount).toBeCloseTo(1050 - 100); // Remaining amount reduced by deducted money
      expect(mockPlayerStatsController.instance.updateLoan).toHaveBeenCalledWith(overdueLoan);
    });

    it('should trigger bankruptcy if player money is zero and loan remains', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 0, // No money
        bankBalance: 0,
        activeLoans: [overdueLoan],
      });
      (bankingManager as any).handleLoanPaymentsAndPenalties(mockTurnManager.instance.currentWeek);
      expect(mockGlobalEventEmitter.instance.emit).toHaveBeenCalledWith('onBankruptcy');
      expect(GameManager.instance.gameOver).toHaveBeenCalled();
    });

    it('should make payment if player money is sufficient', () => {
      mockPlayerStatsController.instance.getPlayerData.mockReturnValue({
        money: 200, // Enough money
        bankBalance: 0,
        activeLoans: [overdueLoan],
      });
      (bankingManager as any).handleLoanPaymentsAndPenalties(mockTurnManager.instance.currentWeek);
      expect((bankingManager as any).makeLoanPayment).toHaveBeenCalledWith(overdueLoan, overdueLoan.paymentAmount);
      expect(mockGlobalEventEmitter.instance.emit).not.toHaveBeenCalledWith('onMissedPayment', expect.any(Object), expect.any(Number));
    });
  });
});