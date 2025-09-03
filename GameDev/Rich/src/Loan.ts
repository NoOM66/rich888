export interface Loan {
  id: string; // Unique identifier for the loan
  amount: number;
  interestRate: number; // Annual interest rate
  originalAmount: number; // Original amount of the loan
  remainingAmount: number; // Remaining principal + interest
  remainingPayments: number; // Number of payments left
  paymentAmount: number; // Amount per payment
  nextPaymentWeek: number; // Week when the next payment is due
}
