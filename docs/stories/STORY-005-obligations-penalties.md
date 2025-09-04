# STORY-005 Obligations Tracking & Penalty Effects

Context:
ตรวจว่าผู้เล่นทำกิจกรรมที่ถือว่าเติมภาระพื้นฐาน (กิน/เช่า/เสื้อผ้า/สุขภาพขั้นต่ำ) มิฉะนั้นสร้าง penalty effects สำหรับสัปดาห์ถัดไป

Goal:
สร้างข้อมูล PenaltyEffects deterministic เพื่อปรับ WeekState และ Bars อื่น

Scope (Included):
- ฟังก์ชัน evaluateObligations(activityLog, obligationConfig)
- obligationConfig: {id, tag, frequencyPerWeek, penaltyType, penaltyValue, capPerCategory}
- Output: {missed:[id], penalties:[{type,value,appliedValue}], reportSummary}
- Cap per penaltyType ไม่เกิน config cap
- Disabled ถ้า frequency=0

Out of Scope:
- UI explanation formatting
- Streak logic (future)

Dependencies:
- STORY-003 activityLog

Acceptance Criteria:
1. Given all required tags present >= frequency -> penalties=[]
2. When one obligation missed -> penalties มี 1 entry ถูกต้องตาม config
3. When multiple missed same type เกิน cap -> appliedValue = cap (ไม่ stack เกิน)
4. frequency=0 -> obligation ไม่ถูกตรวจและไม่อยู่ใน missed
5. Output reportSummary มีจำนวน missed = length(missed)
6. Deterministic: input เดิม -> output เดิม

Edge Cases:
- All missed -> cap per category respected
- Duplicate tag occurrences > frequency -> still counts fulfilled once

Definition of Done Checkboxes:
- [x] Context
- [x] Acceptance Criteria (6)
- [x] Dependencies
- [x] No ambiguity

Implementation Notes:
- Input: activityLog (entries with optional tags), obligationConfig[]
- Count tags only from status OK / ADJUSTED
- frequency=0 => skip entirely
- Aggregate penalties per penaltyType; cap applied by min cap encountered among missed obligations (conservative)
- Output stable ordering (sorted by penaltyType) for determinism
- Missed array lists obligation ids (not tags)

Data Shapes:
- ObligationConfig: {id, tag, frequencyPerWeek, penaltyType, penaltyValue, capPerCategory}
- Result: { missed:string[], penalties:[{type,value,appliedValue}], reportSummary:{missedCount,types,totalApplied} }

Edge Handling:
- Multiple missed same type => aggregated then capped
- Duplicate tag appearances beyond frequency counted but extra ignored (>= suffices)

Determinism:
- Sorting penalties by type; freezing arrays

DoD Verification:
- Unit tests cover AC1..AC6 + edge cases (all missed, duplicates) in obligations.test.ts


Test Notes:
- test cap enforcement
