import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyFinanceState, issueLoan, weeklyRepayment, openInvestment, evaluateInvestments, withdrawInvestment, earlyRepayLoan } from '../finance.js';

test('AC1: issueLoan increases money and sets schedule length', () => {
  let st = emptyFinanceState(100);
  const r = issueLoan(st, { amount: 500, weeklyRate: 0.05, termWeeks: 5, startWeek: 0, penaltyRate: 10 });
  assert.equal(r.ok, true);
  if (r.ok) {
    st = r.value.state;
    assert.equal(st.money, 600); // +500
    assert.equal(st.loans.length, 1);
    assert.equal(st.loans[0].termWeeks, 5);
  }
});

test('AC2 & AC3: weeklyRepayment reduces principal or marks overdue with penalty', () => {
  let st = emptyFinanceState(0);
  const loanIssue = issueLoan(st, { amount: 100, weeklyRate: 0.1, termWeeks: 4, startWeek: 0, penaltyRate: 5 });
  assert.ok(loanIssue.ok);
  st = loanIssue.ok ? loanIssue.value.state : st;
  // Give just enough money for first payment, then none for second
  st = { ...st, money: 200 } as any; // create new mutable copy with adjusted money
  const rep1 = weeklyRepayment(st, 0, { penaltyRate: 5 });
  assert.ok(rep1.ok);
  st = rep1.ok ? rep1.value.state : st;
  const loan1 = st.loans[0];
  assert.ok(loan1.principalRemaining < loan1.principalOriginal); // principal reduced
  // Zero out money to force overdue
  st = { ...st, money: 0 } as any;
  const rep2 = weeklyRepayment(st, 1, { penaltyRate: 5 });
  assert.ok(rep2.ok);
  st = rep2.ok ? rep2.value.state : st;
  const loan2 = st.loans[0];
  assert.equal(loan2.overdue, true);
  assert.ok(loan2.penaltyApplied >= 5);
});

test('AC4: openInvestment deducts money and records startWeek', () => {
  let st = emptyFinanceState(1000);
  const inv = openInvestment(st, { amount: 200, growthRate: 0.1, startWeek: 5 });
  assert.ok(inv.ok);
  st = inv.ok ? inv.value.state : st;
  assert.equal(st.money, 800);
  assert.equal(st.investments.length, 1);
  assert.equal(st.investments[0].startWeek, 5);
});

test('AC5: evaluateInvestments after 1 week shows growth when positive rate', () => {
  let st = emptyFinanceState(1000);
  const inv = openInvestment(st, { amount: 100, growthRate: 0.2, startWeek: 3 });
  assert.ok(inv.ok); st = inv.ok ? inv.value.state : st;
  const values0 = evaluateInvestments(st, 3);
  const id = st.investments[0].id;
  assert.equal(values0.values[id], 100); // same week no growth
  const values1 = evaluateInvestments(st, 4); // +1 week
  assert.ok(values1.values[id] > 100);
});

test('AC6: withdraw before 1 week rejected MIN_HOLDING', () => {
  let st = emptyFinanceState(500);
  const inv = openInvestment(st, { amount: 100, growthRate: 0.1, startWeek: 10 });
  assert.ok(inv.ok); st = inv.ok ? inv.value.state : st;
  const w = withdrawInvestment(st, st.investments[0].id, 10); // same week
  assert.equal(w.ok, false);
  if (!w.ok) assert.equal(w.error.code, 'FIN_MIN_HOLDING');
});

test('Edge: negative rates treated as zero (loan & investment)', () => {
  let st = emptyFinanceState(0);
  const loanIssue = issueLoan(st, { amount: 50, weeklyRate: -0.5, termWeeks: 5, startWeek: 0, penaltyRate: 2 });
  assert.ok(loanIssue.ok); st = loanIssue.ok ? loanIssue.value.state : st;
  st = { ...st, money: 100 } as any; // copy with funds
  const rep = weeklyRepayment(st, 0, { penaltyRate: 2 });
  assert.ok(rep.ok); st = rep.ok ? rep.value.state : st;
  assert.ok(st.loans[0].interestAccumulated <= 0.01); // near zero interest
  // investment
  st = { ...st, money: st.money + 100 } as any;
  const inv = openInvestment(st, { amount: 50, growthRate: -0.3, startWeek: 1 });
  assert.ok(inv.ok); st = inv.ok ? inv.value.state : st;
  const val = evaluateInvestments(st, 5);
  const id = st.investments[0].id;
  assert.equal(val.values[id], 50); // no growth
});

test('Edge: withdraw after many weeks compound correct', () => {
  let st = emptyFinanceState(1000);
  const invR = openInvestment(st, { amount: 100, growthRate: 0.1, startWeek: 0 });
  assert.ok(invR.ok); st = invR.ok ? invR.value.state : st;
  const w = withdrawInvestment(st, st.investments[0].id, 5); // 5 weeks
  assert.ok(w.ok);
  if (w.ok) {
    const expected = 100 * Math.pow(1.1, 5);
    assert.ok(Math.abs(w.value.value - expected) < 1e-9);
  }
});

test('Early repayment reduces principal and money, allows full payoff', () => {
  let st = emptyFinanceState(1000);
  const loanR = issueLoan(st, { amount: 300, weeklyRate: 0.1, termWeeks: 6, startWeek: 0, penaltyRate: 5 });
  assert.ok(loanR.ok); st = loanR.ok ? loanR.value.state : st;
  // early repay part
  const loanId = st.loans[0].id;
  const er1 = earlyRepayLoan(st, loanId, 120);
  assert.ok(er1.ok); st = er1.ok ? er1.value.state : st;
  assert.ok(st.loans[0].principalRemaining < st.loans[0].principalOriginal);
  // repay rest
  const remaining = st.loans[0].principalRemaining;
  const er2 = earlyRepayLoan(st, loanId, remaining + 50); // attempt overpay -> capped
  assert.ok(er2.ok); st = er2.ok ? er2.value.state : st;
  assert.equal(st.loans[0].principalRemaining <= 1e-9, true);
});

test('Early repayment errors on invalid cases', () => {
  let st = emptyFinanceState(100);
  const loanR = issueLoan(st, { amount: 50, weeklyRate: 0.1, termWeeks: 5, startWeek: 0, penaltyRate: 1 });
  assert.ok(loanR.ok); st = loanR.ok ? loanR.value.state : st;
  const loanId = st.loans[0].id;
  const e1 = earlyRepayLoan(st, loanId, 0); assert.equal(e1.ok, false);
  const e2 = earlyRepayLoan(st, 'nope', 10); assert.equal(e2.ok, false);
  // repay fully then try again
  const er = earlyRepayLoan(st, loanId, 50); assert.ok(er.ok); st = er.ok ? er.value.state : st;
  const e3 = earlyRepayLoan(st, loanId, 1); assert.equal(e3.ok, false);
});
