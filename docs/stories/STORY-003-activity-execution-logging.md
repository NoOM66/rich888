# STORY-003 Activity Execution & Logging

Context:
ดำเนินกิจกรรมตามลำดับที่ล็อคไว้ ใช้เวลาจาก WeekState และผลิต ResourceDeltas บันทึก ActivityLog

Goal:
ให้ระบบอื่น (Obligations, Summary) อ่าน log deterministic และใช้ delta ได้ถูกต้อง

Scope (Included):
- ฟังก์ชัน executePlan(lockedPlan, timeBudget)
- สำหรับแต่ละ activity: ตรวจเวลาพอ -> หักเวลา -> คำนวณ reward (ยังไม่รวม multiplier ใน story นี้)
- Log entry: {id, startOrder, timeCost, rewards, status}
- หากเวลาพอไม่เต็มกิจกรรม -> status=TRUNCATED และไม่ให้ reward partial (design: all-or-nothing V1)
- Clamp reward เมื่อ config ผิด (negative ที่ห้าม) -> status=ADJUSTED

Out of Scope:
- Multipliers (Story แยก)
- Diminishing repeats (Story แยก)

Dependencies:
- STORY-001 WeekState
- STORY-002 Travel commit เรียบร้อยก่อน execution

Acceptance Criteria:
1. Given lockedPlan 2 activities เวลาเพียงพอ -> log 2 entries status=OK
2. Given activity timeCost > remaining -> log entry status=SKIPPED (หรือไม่มี entry?) (เลือก: สร้าง entry status=SKIPPED) และหยุด loop
3. If reward config negative disallowed -> clamp 0 และ status=ADJUSTED
4. totalTimeSpentActivity = Σ timeCost ของ entries OK/ADJUSTED
5. Function returns ResourceDeltas = sum rewards ของ entries OK/ADJUSTED เท่านั้น
6. Execution deterministic: สองรัน input เดิม → log identical

Edge Cases:
- Negative reward -> clamp
- Time exhausted mid-loop -> skip rest

Definition of Done Checkboxes:
- [x] Context
- [x] Acceptance Criteria (6)
- [x] No ambiguous words
- [x] Dependencies clear

Test Notes:
- snapshot test log ordering
