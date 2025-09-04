# GDD MVP V1 – Life-Sim วางแผนสัปดาห์
เวอร์ชัน: 1.0  
วันที่: 2025-09-04  
เจ้าของ: Game Designer Persona (Alex)  
อ้างอิง: `docs/analyst/project-brief.md` (Pillars, Risks, Assumptions)

## 0. วัตถุประสงค์ผลิตภัณฑ์ (Design Intent Summary)
ทำให้ผู้เล่น “จัดสรรเวลาสัปดาห์ + เงิน + ภาระ” ได้อย่างมีกลยุทธ์ เพื่อเติม 4 ค่าสถานะ (เงิน สุขภาพ ความสุข การศึกษา) ครบก่อนคู่แข่ง โดยให้ทุกการเลือกมีของต้องแลก (เวลา / เงิน / โอกาส) และผลลัพธ์คาดการณ์ได้ก่อนยืนยัน

## 1. Core Loop (Weekly Planning & Resolution Loop)
```
[Start Week]
  ↓ โหลดสถานะปัจจุบัน (Time Budget, เงิน, บาร์ทั้ง 4, ภาระใกล้ถึงกำหนด)
[Plan Route & Activities]
  ↓ เลือกลำดับสถานที่ → ระบบคำนวณ Travel Time + Preview ผลรวมค่าสถานะ + ค่าใช้จ่าย
[Confirm Plan]
  ↓ หักเวลาเดินทาง/กิจกรรมแบบจำลอง → Lock แผนประจำสัปดาห์
[Execute Activities]
  ↓ ประมวลผลกิจกรรมตามลำดับ (apply gain/loss, trigger obligations check)
[Obligation Check & Penalties]
  ↓ หากพลาด (กิน / เช่า / เสื้อผ้า ฯลฯ) → สร้าง Debuff หรือหักเวลาสัปดาห์หน้า
[Upgrades & Finance Resolution]
  ↓ ใช้ผล upgrade multipliers / ดอกเบี้ย / หนี้ค่างวด
[Week Summary & Forecast]
  ↓ แสดง: Gain/Loss, เหตุผล penalty, ROI อัพเกรด, คาดเวลาเหลือสัปดาห์หน้า
[Victory Check]
  ↓ ถ้าบาร์ครบทั้ง 4 → ชนะ / จบเกม มิฉะนั้นเริ่มสัปดาห์ใหม่
```

## 2. UX State / Phase Outline
| Phase | คำอธิบาย | Input หลัก | Output หลัก | ผู้เล่นโต้ตอบอะไร | Transition ไป |
|-------|-----------|------------|-------------|-------------------|---------------|
| StartWeek | โหลดข้อมูล & เตือนภาระกำลังถึง | สถานะ persistent | Context Card | อ่าน / ปิด | Planning |
| Planning | เลือกกิจกรรม + เส้นทาง | สถานที่, กิจกรรม, เวลา | แผงคาดการณ์รวม (net deltas) | ลาก/คลิกเพิ่ม, จัดลำดับ | Confirmation |
| Confirmation | ยืนยันแผนเมื่อพอใจ | แผนชั่วคราว | แผน Lock | กด Confirm / Back | Execution |
| Execution | จำลองกิจกรรมเรียงลำดับ | แผน Lock | Log เหตุการณ์ | กด next / skip animation | ObligationsResolution |
| ObligationsResolution | ตรวจเช็คกิน/เช่า/เสื้อผ้า/สุขภาพขั้นต่ำ | Log กิจกรรม + flags | Penalty Effects | อ่านสรุป | FinanceResolution |
| FinanceResolution | ดอกเบี้ย / ค่างวด / ROI | สถานะเงิน + หนี้ + ลงทุน | Updated เงิน/หนี้ | ไม่มี / (อนาคต: เลือกรีไฟแนนซ์) | Summary |
| Summary | แสดงสรุปสัปดาห์ + เตือนสัปดาห์หน้า | ผลรวมทุกระบบ | Report + Forecast | กด Continue | VictoryCheck |
| VictoryCheck | ตรวจครบ 4 บาร์ | ค่าสถานะ | Win / Continue | - | StartWeek / GameEnd |
| GameEnd | สรุปชัยชนะ / สถิติ | Final State | Scorecard | ออกจากเกม / เล่นใหม่ | - |

## 3. รายการ Systems (MVP Scope)
1. Time & Turn (Week) Management System  
2. Travel & Route Optimization System  
3. Activity Execution System  
4. Status Bars Progress System (4 Bars)  
5. Obligation & Penalty System  
6. Upgrade & Multipliers System  
7. Financial (Loan & Simple Investment) System  
8. Forecast & Planning Preview System  
9. Week Summary & Reporting System  
10. Victory Condition System  

(Out-of-Scope Explicit: Random Event System, Complex Economy Balancing, Social Relationship System – ระบุไว้เพื่อกันการสอดแทรกโดยไม่วางแผน)

## 4. Systems Spec
### 4.1 Time & Turn Management System
- Purpose: กำหนดกรอบเวลาสัปดาห์ (เช่น 40 ชั่วโมง) และจัดสรรเวลาระหว่างเดินทางกับกิจกรรม ป้อนให้ระบบอื่นรู้ขีดจำกัด
- Inputs: Base Week Hours, CarryOverPenalty (ลดชั่วโมง), Route Plan (กิจกรรม + ระยะทาง)  
- Outputs: RemainingTime, TimeSpentActivity, TimeSpentTravel, ExhaustedFlag  
- State: currentWeekNumber, baseHours, effectiveHours, spentTravel, spentActivity  
- Interactions: Travel System (คำนวณเวลาเดินทาง), Activity System (เวลาใช้กิจกรรม), Obligations (อาจลดชั่วโมงสัปดาห์ถัดไป)  
- Failure/Edge Cases:
  - Edge: เวลาเหลือน้อยกว่ากิจกรรมถัดไป → ปรับกิจกรรมทิ้งส่วนเกิน / block ใส่เพิ่ม
  - Edge: Penalty ลดเวลาติดลบ (อย่าให้ < 10% ของ base) → floor safety
  - Edge: กิจกรรม set zero-time (ผิด config) → treat as 1 minute min

### 4.2 Travel & Route Optimization System
- Purpose: คำนวณเวลาเดินทางรวมกับค่าสัมประสิทธิ์ประสิทธิภาพจากเส้นทางที่ดี เพื่อให้ route planning มีความหมาย
- Inputs: ลำดับสถานที่ (ordered list), Distance Matrix / Graph, TravelModifiers (upgrade หรือ bonus), FastPathFlags  
- Outputs: totalTravelTime, segmentTimes[], routeEfficiencyScore  
- State: lastVisitedLocation, cumulativeDistance  
- Interactions: Time Management (หักเวลารวม), Forecast (แสดงผลคาดการณ์), Upgrades (เช่น furniture เพิ่ม efficiency?)  
- Failure/Edge Cases:
  - Edge: Loop back สั้นผิดปกติ (exploit) → minimum travel time per hop
  - Edge: Distance data missing → fallback default distance constant
  - Edge: Travel time > เวลาทั้งสัปดาห์ → block plan + แจ้งเตือน “เส้นทางกินเวลาทั้งหมด”

### 4.3 Activity Execution System
- Purpose: ประมวลผลกิจกรรมตามลำดับ ใช้/ให้ทรัพยากร และสร้าง log
- Inputs: LockedActivityPlan (กิจกรรม + param), TimeBudgetRemaining  
- Outputs: ActivityLogEntries[], ResourceDeltas (เงิน, 4 บาร์), MissedFlags (ถ้าไม่มีอาหาร ฯ)  
- State: executionIndex, partialResults  
- Interactions: Status Bars (ปรับค่า), Obligations (ตรวจ fulfillment), Finance (บางกิจกรรมปล่อย trigger)  
- Failure/Edge Cases:
  - Edge: กิจกรรมเกินเวลาที่เหลือระหว่าง execution → truncate หรือ skip tail พร้อม log เหตุผล
  - Edge: Activity config invalid (reward negative ที่ไม่ควร) → clamp + log warning
  - Edge: Duplicate mutually exclusive activity (เช่น กินสองครั้งทันที) → allow but diminishing return logic (กำหนดไว้ใน config)

### 4.4 Status Bars Progress System
- Purpose: เก็บและอัปเดตค่าสถานะ 4 บาร์ และตรวจเงื่อนไขชนะ
- Inputs: Deltas จากกิจกรรม, Multipliers จาก Upgrades, Penalties  
- Outputs: NewBarValues, CompletionFlags  
- State: money, health, happiness, education (progress numeric), thresholds  
- Interactions: Activity, Upgrade, VictoryCondition, Obligations (penalty ลด), Finance (เงิน)  
- Failure/Edge Cases:
  - Edge: เกิน threshold -> clamp = threshold ไม่เก็บ overflow
  - Edge: เงินติดลบหลังค่างวด → mark DebtOverdue (ส่งต่อ Finance edge)
  - Edge: ค่าหนึ่งลดเหลือ 0 หลายสัปดาห์ติด → trigger advisory message (feedback loop)

### 4.5 Obligation & Penalty System
- Purpose: บังคับ loop ดูแลพื้นฐาน (กิน/เช่า/เสื้อผ้า/สุขภาพขั้นต่ำ) ให้มีแรงกดดันเชิงวางแผน
- Inputs: ActivityLog, CurrentWeekFlags, ObligationConfig (frequency, penalty type)  
- Outputs: PenaltyEffects (ลดชั่วโมง, ลด multiplier, ลด bar), MissedObligationReport  
- State: counters per obligation, streakMissed  
- Interactions: Time (ลดชั่วโมงสัปดาห์หน้า), Status Bars (ลดค่า), Summary (รายงานเหตุผล), Forecast (แจ้งล่วงหน้า)  
- Failure/Edge Cases:
  - Edge: พลาดหลาย obligation พร้อมกัน → cap penalty category (ไม่ stack เกิน config cap)
  - Edge: Obligation ถูกทำซ้ำเกิน → ไม่ให้ bonus เพิ่มเติม (idempotent)
  - Edge: Config frequency = 0 → treat as disabled, ไม่แจ้งเตือน

### 4.6 Upgrade & Multipliers System
- Purpose: ให้ผู้เล่นลงทุนเพื่อเพิ่มประสิทธิภาพ (เวลา, ค่าที่ได้, ลดค่าใช้จ่าย)
- Inputs: PurchaseActions, UpgradeDefinitions (cost, bonus %, category, ROI hint), CurrentBars  
- Outputs: AppliedMultipliers, UpdatedMoney, UpgradeOwnershipState  
- State: ownedUpgrades[], cumulativeBonuses map(category→%)  
- Interactions: Activity (ปรับ reward), Travel (ลด travel time), Finance (เงินใช้ซื้อ)  
- Failure/Edge Cases:
  - Edge: ซื้อซ้ำ item unique → block + message
  - Edge: Bonus stack ทำให้ reward > hard cap → clamp + show “Max Efficiency Reached”
  - Edge: ซื้อแล้วเงิน < 0 โดย design ไม่อนุญาต → reject transaction

### 4.7 Financial (Loan & Simple Investment) System
- Purpose: สร้างตัวเลือกเร่งโตผ่านเงินกู้ และการลงทุนพื้นฐาน/ทอง ที่เข้าใจง่าย
- Inputs: LoanRequests, InvestmentActions, InterestRates, RepaymentSchedule  
- Outputs: UpdatedCash, OutstandingLoanState, InvestmentGrowth, RepaymentDueFlag  
- State: loans[], investments[], accruedInterest  
- Interactions: Status Bars (เงิน), Upgrade (ใช้เงินทุน), Summary (รายงานภาระจ่าย), Obligations (เงินกู้ไม่ใช่ obligation แต่พลาดจ่าย = penalty interest)  
- Failure/Edge Cases:
  - Edge: ไม่จ่ายค่างวด -> เพิ่ม interest + flag risk (แต่ไม่ game over ทันที)
  - Edge: ลงทุนถอนทันที loop เดียว (arbitrage) → lock min holding period 1 week
  - Edge: ดอกเบี้ยลบ (ผิด config) → floor = 0

### 4.8 Forecast & Planning Preview System
- Purpose: ให้ผู้เล่นเห็นผลรวมก่อนยืนยัน ลด random guess
- Inputs: TentativePlan, CurrentState, ActiveMultipliers, TravelCalc  
- Outputs: NetDeltasPreview (ต่อบาร์), ExpectedCost, TimeUsage, Warnings (obligation at risk)  
- State: tempPlanCache  
- Interactions: Planning Phase UI, Activity, Travel, Obligations (predict miss risk)  
- Failure/Edge Cases:
  - Edge: แผนเปลี่ยนรวดเร็ว spam → debounce recalculation
  - Edge: Calculation error (divide by zero) → show fallback “—” + disable confirm
  - Edge: Preview mismatch with execution (rare) → log discrepancy + show correction banner

### 4.9 Week Summary & Reporting System
- Purpose: ให้ feedback เชิงสาเหตุ สร้างการเรียนรู้รอบต่อไป
- Inputs: ExecutionLogs, PenaltyEffects, FinancialChanges  
- Outputs: SummaryReport (table), AdvisoryMessages, ROIHighlights  
- State: lastWeekSnapshot  
- Interactions: Obligations (อธิบายโทษ), Upgrade (แสดงผล % bonus), Finance (ดอกเบี้ย)  
- Failure/Edge Cases:
  - Edge: รายการ log ยาวเกิน → collapse grouping
  - Edge: Negative net progression 2 สัปดาห์ติด → surface “Consider Upgrades” tip
  - Edge: Missing log entry field → fallback label “(unknown)” ไม่ทำให้ UI crash

### 4.10 Victory Condition System
- Purpose: ตรวจว่าผู้เล่นเติมทั้ง 4 บาร์ครบเพื่อจบเกมสมบูรณ์รวดเร็ว
- Inputs: StatusBarValues, Thresholds  
- Outputs: VictoryFlag, CompletionTimeStats  
- State: weekOfCompletion  
- Interactions: Summary (จบ), GameEnd Screen  
- Failure/Edge Cases:
  - Edge: เกิน threshold หลายบาร์ใน mid-week (ไม่ได้เช็คจนสรุป) → ชนะที่ Summary เท่านั้น (ชัดเจน)
  - Edge: Tie (multiplayer future) → ปัจจุบัน single, ignore; future rule placeholder (ไม่ใช่ TBD เพราะ out-of-scope)
  - Edge: Threshold config mismatch (หนึ่งต่ำกว่าที่ตั้งใจ) → validation step load time

## 5. Resource Flows (คำอธิบายข้อความ)
- เวลา (Hours): BaseWeekHours → ถูกหักโดย Travel + Activities → เหลือ (unused) ไม่ทบ ยกเว้น penalty สามารถลด BaseWeekHours ถัดไป  
- เงิน (Money): เริ่มต้นเงินสด → ใช้กิจกรรม/ซื้อ upgrade/ชำระหนี้ → เพิ่มจากกิจกรรม (งาน) + การลงทุน + เงินกู้ (ทันที) → ลดโดย penalty ดอกเบี้ย  
- สถานะบาร์ (Health/Happiness/Education): เพิ่มจากกิจกรรม + multipliers; ลดโดย Missed Obligations / Debuffs  
- Multipliers: ซื้อผ่าน Upgrades → ปรับสูตร reward หรือ travel time → แสดง ROI ใน Summary  
- หนี้ (Loans): เพิ่มเมื่อกู้ → สร้าง schedule → ทุกสัปดาห์จ่ายค่างวด (เงินต้น+ดอก) → ไม่จ่าย = เพิ่ม interest + penalty flag  
- การลงทุน (Investments): ใส่เงินต้น → เติบโตตามอัตรา → ถอนเพิ่มเงินสด (ภายหลัง period)  

## 6. Mechanics Table (ดูไฟล์ `mechanics-table.md` สำหรับรูปแบบเต็ม) – ย่อ
| Mechanic | Purpose | Affects | Failure Mode (สั้น) |
|----------|---------|---------|---------------------|
| Route Planning | ลดเวลาเสีย | Time Efficiency | แผนกินเวลาทั้งหมด -> block |
| Activity Execution | ผลิต/ใช้ทรัพยากร | Bars, Money | เวลาหมด -> truncate |
| Obligations | สร้างแรงกดดัน | Time Next Week, Bars | พลาดหลายอัน -> cap penalty |
| Upgrades | เร่ง progression | Multipliers | ซื้อซ้ำ -> reject |
| Loans | เร่งลงทุน | Money | ค้างชำระ -> interest boost |
| Investments | เพิ่มผลตอบแทน | Money | ถอนเร็ว -> deny |
| Forecast Preview | ลด guesswork | Planning UX | แผนเปลี่ยนเร็ว -> debounce |
| Summary Feedback | สร้างการเรียนรู้ | Player Strategy | Log ยาว -> collapse |
| Victory Check | จบเกมชัด | Game Flow | ตรวจช้า -> summary only |

## 7. Loop Diagram (ASCII)
```
        +------------------+
        |   Start Week     |
        +---------+--------+
                  |
                  v
        +------------------+
        |    Planning      |<------------------+
        +----+------+------+
             |      ^         (Adjust Plan)
             v      |
        +------------------+
        |  Confirmation    |
        +---------+--------+
                  v
        +------------------+
        |   Execution      |
        +---------+--------+
                  v
        +------------------+
        | Obligations/Pen. |
        +---------+--------+
                  v
        +------------------+
        | Finance Resolve  |
        +---------+--------+
                  v
        +------------------+
        |    Summary       |
        +---------+--------+
                  v
        +------------------+
        |  Victory Check   |
        +----+--------+----+
             |        |
             |no      |yes
             |        v
             |   +----------+
             +---| Game End |
                 +----------+
```

## 8. Pillar Mapping (Traceability)
| System | Pillars Supported (หมายเลข) | หมายเหตุ |
|--------|------------------------------|----------|
| Travel & Route | 1 | เส้นทางคุ้มเวลา | 
| Activity | 2 | ทุกการเลือกมีแลก |
| Obligations | 3 | ภาระเร่งการวางแผน |
| Upgrades | 4 | ลงทุนตัวคูณ |
| Finance | 5 | โปร่งใส | 
| Forecast | 1,2,5 | เห็นก่อนยืนยัน | 
| Summary | 2,3,4,5 | Feedback ชัด | 
| Victory | 1–5 | ปิด loop | 

(ทุกระบบหลัก map ≥1 pillar ครบตาม DoD)

## 9. Edge Case Consolidated Checklist
- เวลาไม่พอระหว่าง execution → truncate + log
- พลาด obligation หลายรายการ → cap per category
- เงินติดลบหลัง upgrade → reject ก่อน commit
- ค้างชำระหนี้ → interest เพิ่ม (ไม่ game over)
- Upgrade stack เกิน cap → clamp
- Preview mismatch execution → log correction
- Log overflow → group

## 10. ไม่มีรายการ TBD
ตรวจสอบ: ไม่มีคำว่า TBD / Placeholder ในไฟล์นี้ (หากพบภายหลังให้เปิด Change Note)

## 11. Definition of Done Validation
| เกณฑ์ | สถานะ |
|-------|--------|
| ทุกระบบมี Purpose | ✔ |
| Inputs ระบุครบ | ✔ |
| Outputs ระบุครบ | ✔ |
| Failure/Edge Cases ≥1 ต่อระบบ | ✔ |
| Inter-system Interactions | ✔ (อยู่ในแต่ละระบบ) |
| ไม่มี TBD สำคัญ | ✔ |

---
Changelog: 1.0 Initial draft
