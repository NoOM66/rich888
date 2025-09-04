# STORY-009 Week Summary & Reporting

Context:
สรุปผลสัปดาห์เพื่อให้ผู้เล่นเข้าใจผลการตัดสินใจ และรับคำแนะนำ

Goal:
Aggregate execution logs + penalties + finance changes เป็น report เดียว

Scope (Included):
- buildWeekSummary(executionLog, penalties, financeChanges, upgradesApplied)
- Outputs: {resourceTotals, penaltiesApplied, advisoryMessages[], upgradeROI[]}
- หาก log entries > maxEntries -> group เหลือ categories
- Advisory rule: ถ้า net progression (sum key bars delta) <0 -> add advisory "Consider Upgrades"

Out of Scope:
- Visualization formatting
- Multi-week trend analytics

Dependencies:
- STORY-003 log, STORY-005 penalties, STORY-006 upgrades, STORY-007 finance

Acceptance Criteria:
1. Given executionLog รวม rewards -> resourceTotals ตรงรวม
2. Log length > maxEntries -> grouped flag = true
3. Negative net progression -> advisoryMessages contains "Consider Upgrades"
4. penaltiesApplied length = penalties.length
5. upgradeROI คำนวณ (deltaBenefit / cost) สำหรับ upgradesApplied ที่มี benefit data
6. Pure function: input เดิม -> output เดิม

Edge Cases:
- No penalties -> penaltiesApplied=[]
- No upgrades -> upgradeROI=[]

Definition of Done Checkboxes:
- [x] Context
- [x] Acceptance Criteria (6)
- [x] Dependencies
- [x] No ambiguity

Implementation Notes:
- buildWeekSummary เป็น pure function (ไม่เปลี่ยน executionLog/payload)
- grouping แค่ตั้ง flag (อนาคตอาจ aggregate ตาม category)
- advisory ปัจจุบันใช้เกณฑ์ summation ของ resourceTotals ทั้งหมด < 0 (อาจขยาย rule set ภายหลัง)
- upgradeROI: รวม benefit values / cost แล้วปัด 4 ทศนิยม


Test Notes:
- test grouping
