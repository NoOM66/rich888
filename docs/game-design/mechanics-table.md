# Mechanics Table (Full Detail)
เวอร์ชัน: 1.0  
วันที่: 2025-09-04  
อ้างอิง: `gdd-mvp-v1.md`

| Mechanic | Purpose (ทำไมต้องมี) | Inputs | Process (สูตร / กฎ) | Outputs | Affects Systems | Failure / Edge Case Handling | Notes |
|----------|----------------------|--------|----------------------|---------|-----------------|------------------------------|-------|
| Route Planning | ทำให้การจัดลำดับสถานที่มีผลต่อเวลารวม | สถานที่เรียงลำดับ, Distance Matrix, TravelModifiers | sum(distance[i->i+1]) * (1 - travelBonus%) | totalTravelTime, routeEfficiencyScore | Time, Forecast | ถ้า totalTravelTime > effectiveWeekHours -> block แผน | EfficiencyScore = (baselineTime / totalTravelTime) |
| Travel Time Reduction Upgrade | ลดเวลาสูญเสียเพื่อคืนโฟกัสกิจกรรม | UpgradePurchase, BaseTravelCalc | newTime = base * (1 - Σbonus%) (floored ≥50% base) | modifiedTravelTime | Route, Time | หาก stack > 50% ลด → clamp 50% | แสดง % ลดสุทธิใน UI |
| Activity Execution | ผลิต/ใช้ทรัพยากรหลัก | LockedPlan, Multipliers | apply reward * (1+mult%) then clamp | ResourceDeltas, ActivityLog | Bars, Money, Summary | ถ้าเวลาเหลือ < activityRequired -> partial skip | Log reason "TIME_EXHAUSTED" |
| Diminishing Repeat Activity | ป้องกัน spam exploit | ActivityId sequence | baseReward * decayFactor^(repeatCount-1) | AdjustedReward | Activity | decayFactor < 1 (เช่น 0.7) | repeatCount reset weekly |
| Obligation Tracking | บังคับภาระพื้นฐาน | ActivityLog, ObligationConfig | mark fulfilled if activity tag present | MissedFlags | Obligations, Penalty | config frequency 0 → disabled | Weekly counters reset |
| Penalty Application | ลงโทษพลาดภาระ | MissedFlags, PenaltyConfig | accumulate, cap per category | PenaltyEffects | Time, Bars | หากหลาย penalty เกิน cap → reduce extras | Cap per type e.g. max -20% time |
| Upgrade Purchase | เพิ่ม multiplier หรือ discount | MoneyState, UpgradeDef | if affordable & not owned -> deduct + grant bonus | UpdatedMoney, OwnedUpgrades | Upgrades, Forecast | เงิน < cost → reject | Show ROI hint (cost / weeklyGain) |
| Loan Issuance | ให้เงินก้อนเร่งลงทุน | LoanRequest(amount,rate,weeks) | schedule payment = amount/weeks + interest | Cash+, LoanState | Finance | rate <0 → floor 0 | Store APR for display |
| Loan Repayment | ลดหนี้ตามรอบ | LoanState, WeekTick | deduct payment; accrue interest remainder | UpdatedLoanState | Finance, Summary | เงินไม่พอ -> mark overdue + add penalty interest | Overdue counter increments |
| Investment Growth | เพิ่มมูลค่าทุน | InvestmentState, growthRate | value = principal * (1+rate)^(weeksHeld) | UpdatedValue | Finance, Summary | ถอนก่อน minHolding -> deny | Show unrealized gain |
| Forecast Preview | ลดการเดาสุ่ม | TentativePlan, Multipliers | simulate rewards/time w/o side effects | NetDeltasPreview | Forecast, Planning | spam recalculation -> debounce 250ms | Show risk warnings |
| Summary Reporting | ให้ feedback | ExecutionLogs, Penalties | aggregate by category | SummaryTable, Advisories | Summary | log length > limit -> group | Highlight negative deltas |
| Victory Check | จบเกมเมื่อครบ | BarValues, Thresholds | if all >= threshold -> flag | VictoryFlag | Victory | ถ้าพบ mid-week -> delay to end-week | Keeps flow linear |

(ตรวจแล้วไม่มีคำว่า TBD)

Changelog: 1.0 Initial table
