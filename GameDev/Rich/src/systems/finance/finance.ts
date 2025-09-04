/**
 * Financial System (STORY-007) - Loans & Simple Investments
 */
import { Result, ok, err } from '../../shared/result.js';

let _idSeq = 1;
function nextId(prefix: string) { return `${prefix}_${_idSeq++}`; }

export interface FinanceState {
  money: number;
  loans: Loan[];
  investments: Investment[];
}

export interface Loan {
  id: string;
  principalOriginal: number; // original amount
  principalRemaining: number;
  weeklyRate: number; // treated as simple interest rate per week (>=0)
  termWeeks: number;
  startWeek: number;
  weeksElapsed: number; // how many repayment cycles processed
  overdue: boolean;
  interestAccumulated: number; // total interest charged
  penaltyApplied: number; // total penalty interest added due to overdue events
}

export interface Investment {
  id: string;
  amount: number; // principal invested
  growthRate: number; // weekly compound rate (>=0)
  startWeek: number;
}

export interface IssueLoanInput { amount: number; weeklyRate: number; termWeeks: number; startWeek: number; penaltyRate: number; }
export interface IssueLoanSuccess { state: FinanceState; loan: Loan; }

export type FinanceErrorCode =
  | 'FIN_INVALID_AMOUNT'
  | 'FIN_MIN_HOLDING'
  | 'FIN_UNKNOWN_LOAN'
  | 'FIN_UNKNOWN_INVESTMENT'
  | 'FIN_EARLYPAY_INVALID';

export interface FinanceError { code: FinanceErrorCode; message: string; }

export type IssueLoanResult = Result<IssueLoanSuccess, FinanceError>;

export function emptyFinanceState(money: number = 0): FinanceState {
  return { money, loans: [], investments: [] };
}

function clampNonNegative(v: number) { return v < 0 ? 0 : v; }

export function issueLoan(state: FinanceState, input: IssueLoanInput): IssueLoanResult {
  if (input.amount <= 0 || input.termWeeks <= 0) return err({ code: 'FIN_INVALID_AMOUNT', message: 'amount and termWeeks must be > 0' });
  const weeklyRate = clampNonNegative(input.weeklyRate);
  const penaltyRate = clampNonNegative(input.penaltyRate);
  const loan: Loan = {
    id: nextId('loan'),
    principalOriginal: input.amount,
    principalRemaining: input.amount,
    weeklyRate,
    termWeeks: input.termWeeks,
    startWeek: input.startWeek,
    weeksElapsed: 0,
    overdue: false,
    interestAccumulated: 0,
    penaltyApplied: 0,
  };
  // add cash immediately
  const newState: FinanceState = {
    money: state.money + input.amount,
    loans: [...state.loans, loan],
    investments: [...state.investments],
  };
  return ok({ state: Object.freeze(newState), loan });
}

export interface WeeklyRepaymentConfig { penaltyRate: number; }
export interface WeeklyRepaymentSummary { paidTotal: number; penaltiesApplied: number; }
export type WeeklyRepaymentResult = Result<{ state: FinanceState; summary: WeeklyRepaymentSummary }, FinanceError>;

/**
 * Process one weekly repayment cycle for all active loans.
 * - For each loan not fully repaid and still within term:
 *   principalDue = original / termWeeks (flat schedule)
 *   interest = principalRemaining * weeklyRate
 *   totalDue = principalDue + interest
 *   If insufficient funds -> mark overdue, add penaltyRate to interestAccumulated & penaltyApplied
 *   else deduct money, decrease principalRemaining by principalDue, add interest to interestAccumulated
 */
export function weeklyRepayment(state: FinanceState, currentWeek: number, cfg: WeeklyRepaymentConfig): WeeklyRepaymentResult {
  const penaltyRate = clampNonNegative(cfg.penaltyRate);
  let money = state.money;
  const newLoans: Loan[] = [];
  let paidTotal = 0;
  let penaltiesApplied = 0;
  for (const loan of state.loans) {
    let updated = { ...loan };
    if (updated.principalRemaining > 1e-9 && updated.weeksElapsed < updated.termWeeks) {
      if (currentWeek >= updated.startWeek) {
        const principalDue = updated.principalOriginal / updated.termWeeks;
        const interest = updated.principalRemaining * updated.weeklyRate;
        const totalDue = principalDue + interest;
        if (money + 1e-9 >= totalDue) {
          money -= totalDue;
          updated.principalRemaining = Math.max(0, updated.principalRemaining - principalDue);
          updated.interestAccumulated += interest;
          updated.weeksElapsed += 1;
        } else {
          // insufficient funds -> overdue
          updated.overdue = true;
          updated.interestAccumulated += penaltyRate;
          updated.penaltyApplied += penaltyRate;
          penaltiesApplied += penaltyRate;
        }
        paidTotal += Math.min(totalDue, money >= 0 ? totalDue : 0); // Paid only if sufficient
      }
    }
    newLoans.push(Object.freeze(updated));
  }
  const newState: FinanceState = Object.freeze({ money, loans: newLoans, investments: [...state.investments] });
  return ok({ state: newState, summary: { paidTotal, penaltiesApplied } });
}

export interface OpenInvestmentInput { amount: number; growthRate: number; startWeek: number; }
export type OpenInvestmentResult = Result<{ state: FinanceState; investment: Investment }, FinanceError>;

export function openInvestment(state: FinanceState, input: OpenInvestmentInput): OpenInvestmentResult {
  if (input.amount <= 0) return err({ code: 'FIN_INVALID_AMOUNT', message: 'investment amount must be > 0' });
  if (state.money < input.amount) return err({ code: 'FIN_INVALID_AMOUNT', message: 'insufficient money' });
  const growthRate = clampNonNegative(input.growthRate);
  const inv: Investment = { id: nextId('inv'), amount: input.amount, growthRate, startWeek: input.startWeek };
  const newState: FinanceState = Object.freeze({ money: state.money - input.amount, loans: [...state.loans], investments: [...state.investments, inv] });
  return ok({ state: newState, investment: inv });
}

export function evaluateInvestmentValue(inv: Investment, currentWeek: number): number {
  const weeksHeld = Math.max(0, currentWeek - inv.startWeek);
  return inv.amount * Math.pow(1 + inv.growthRate, weeksHeld);
}

export interface EvaluateInvestmentsResult { values: Record<string, number>; }
export function evaluateInvestments(state: FinanceState, currentWeek: number): EvaluateInvestmentsResult {
  const values: Record<string, number> = {};
  for (const inv of state.investments) {
    values[inv.id] = evaluateInvestmentValue(inv, currentWeek);
  }
  return { values };
}

export type WithdrawResult = Result<{ state: FinanceState; value: number; investmentId: string }, FinanceError>;
export function withdrawInvestment(state: FinanceState, investmentId: string, currentWeek: number): WithdrawResult {
  const idx = state.investments.findIndex(i => i.id === investmentId);
  if (idx === -1) return err({ code: 'FIN_UNKNOWN_INVESTMENT', message: 'investment not found' });
  const inv = state.investments[idx];
  const weeksHeld = currentWeek - inv.startWeek;
  if (weeksHeld < 1) return err({ code: 'FIN_MIN_HOLDING', message: 'must hold at least 1 week' });
  const value = evaluateInvestmentValue(inv, currentWeek);
  const newInvestments = [...state.investments];
  newInvestments.splice(idx, 1);
  const newState: FinanceState = Object.freeze({ money: state.money + value, loans: [...state.loans], investments: newInvestments });
  return ok({ state: newState, value, investmentId });
}

export type EarlyRepayResult = Result<{ state: FinanceState; loan: Loan; amountApplied: number; fullyRepaid: boolean }, FinanceError>;
/**
 * Early loan repayment (principal only):
 * - amount must be >0 and <= available money
 * - find loan by id and reduce principalRemaining by amount (capped at remaining)
 * - deduct money by applied amount
 * - does NOT modify weeksElapsed or interestAccumulated immediately
 */
export function earlyRepayLoan(state: FinanceState, loanId: string, amount: number): EarlyRepayResult {
  if (amount <= 0) return err({ code: 'FIN_EARLYPAY_INVALID', message: 'amount must be > 0' });
  if (state.money < amount) return err({ code: 'FIN_EARLYPAY_INVALID', message: 'insufficient funds' });
  const idx = state.loans.findIndex(l => l.id === loanId);
  if (idx === -1) return err({ code: 'FIN_UNKNOWN_LOAN', message: 'loan not found' });
  const loan = state.loans[idx];
  if (loan.principalRemaining <= 1e-9) return err({ code: 'FIN_EARLYPAY_INVALID', message: 'loan already repaid' });
  const applied = Math.min(amount, loan.principalRemaining);
  const updated: Loan = Object.freeze({ ...loan, principalRemaining: loan.principalRemaining - applied });
  const newLoans = [...state.loans];
  newLoans[idx] = updated;
  const newState: FinanceState = Object.freeze({ money: state.money - applied, loans: newLoans, investments: [...state.investments] });
  return ok({ state: newState, loan: updated, amountApplied: applied, fullyRepaid: updated.principalRemaining <= 1e-9 });
}
