# STORY-007 Financial Loans & Simple Investments

Context:
เพิ่มระบบเงินกู้และการลงทุนง่าย ๆ เพื่อเร่ง progression และสร้างภาระจ่ายคืน

Goal:
สร้าง loan issuance + repayment schedule + basic investment growth (ไม่ซับซ้อน)

Scope (Included):
- issueLoan(amount, rate, weeks) -> loanId + schedule
- weeklyRepayment(loanState, weekTick)
- openInvestment(amount, growthRate)
- evaluateInvestments(weeksHeld)
- Overdue: เมื่อเงินไม่พอจ่าย -> mark overdue + เพิ่ม penaltyInterestRate (config)
- Min holding period สำหรับถอน (1 week)

Out of Scope:
- Compound complexity beyond (1+rate)^weeks
- Refinance mechanics

Dependencies:
- STORY-004 (เงิน), STORY-006 (แข่งขันใช้เงินซื้อ upgrade)

Acceptance Criteria:
1. issueLoan เพิ่มเงินสด = amount และสร้าง schedule length=weeks
2. weeklyRepayment หักเงิน และลด remaining principal ตามตาราง
3. เงินไม่พอ -> mark overdue=true และเพิ่ม interestAccumulated = interestAccumulated + penaltyRate
4. openInvestment ลดเงินสด amount และบันทึก startWeek
5. evaluateInvestments หลัง 1 สัปดาห์ -> value > principal (ถ้า rate >0)
6. พยายามถอนก่อน 1 week -> reject (MIN_HOLDING)

Edge Cases:
- rate <0 -> treat 0
- withdraw after many weeks -> compound correct

Definition of Done Checkboxes:
- [x] Context
- [x] Acceptance Criteria (6)
- [x] Dependencies
- [x] No ambiguity

Implementation Notes:
- ใช้ flat principal schedule: principalDue = original / termWeeks ต่อสัปดาห์
- interest = principalRemaining * weeklyRate (simple interest per week)
- เงินไม่พอชำระ totalDue -> ไม่ลด principal, set overdue=true, บวก penaltyRate (เพิ่มทั้ง interestAccumulated และ penaltyApplied)
- investment มูลค่า = amount * (1 + growthRate)^weeksHeld (growthRate clamp >=0)
- withdraw < 1 week -> FIN_MIN_HOLDING error
- ใช้ shared Result pattern (ok/err)
- State objects freeze เพื่อกัน mutation ตรง

Further Integration (Next Story Candidates):
- รวมกับ weeklyFlow เพื่อ sync bars.money ↔ financeState.money
- รายงาน cashflow (paid interest, penalties, investment returns)

Test Notes:
- test overdue penalty
