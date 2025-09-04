# STORY-004 Status Bars Progress & Victory Hook

Context:
อัปเดตค่า 4 บาร์จาก ResourceDeltas และตรวจ threshold เพื่อให้ระบบ Victory ทำงานภายหลัง

Goal:
รวม update logic + clamp + produce completion flags

Scope (Included):
- ฟังก์ชัน applyDeltas(currentBars, deltas, multipliers?) -> newBars
- Clamp max = threshold, min = 0
- money, health, happiness, education
- Return completionFlags (boolean per bar)
- ถ้าเงินติดลบ -> flag debtOverdraft

Out of Scope:
- Multipliers (จะเพิ่มใน Story multipliers)
- Advisory triggers (separate)

Dependencies:
- STORY-003 (ดึง deltas) *money delta* สามารถมาจากกิจกรรม

Acceptance Criteria:
1. Given delta ทำให้ bar เกิน threshold -> set = threshold
2. Given delta ทำให้ bar < 0 -> set 0
3. If money < 0 after apply -> debtOverdraft=true
4. Return completionFlags= true สำหรับทุก bar ที่ == threshold
5. Pure function: เรียกซ้ำ input เดิม -> output เดิม
6. ไม่แก้ไข object input (immutability)

Edge Cases:
- all bars complete -> flags all true
- large negative money -> clamp then overdraft

Definition of Done Checkboxes:
- [ ] Context
- [ ] Acceptance Criteria (6)
- [ ] Dependencies
- [ ] No ambiguity

Test Notes:
- immutability check (reference compare)
