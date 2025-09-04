# STORY-001 Time & Turn Management System Foundation

Context:
ระบบนี้กำหนดกรอบเวลาต่อสัปดาห์ (เช่น 40 ชั่วโมง base) และทำให้ระบบอื่นสามารถอ้างอิงเวลาที่เหลือ ใช้เป็นฐานสำหรับ travel + กิจกรรม + penalty ลดเวลา

Business / Design Goal:
ให้ผู้เล่นรู้สึกว่าการจัดลำดับเส้นทางและกิจกรรมมีต้นทุนจริง (เวลา) และผล penalty ส่งผลรอบถัดไป

Scope (Included):
- โครงสร้างข้อมูล WeekState (baseHours, effectiveHours, spentTravel, spentActivity)
- ฟังก์ชัน initWeek(baseHours, carryOverPenalty)
- ฟังก์ชัน allocateTravel(hours) / allocateActivity(hours)
- Safety floor effectiveHours >= 0.1 * baseHours
- ตรวจ block เมื่อ travel+activity > effectiveHours

Out of Scope (Explicit):
- Persistence (save/load) (รอภายหลัง)
- UI Layer

Dependencies:
- ไม่มี (รากฐาน)

Acceptance Criteria:
1. Given baseHours=40 และ carryOverPenalty=0 เมื่อ initWeek -> effectiveHours=40
2. Given baseHours=40 และ carryOverPenalty=8 เมื่อ initWeek -> effectiveHours=32
3. When allocateTravel(5) เรียกสองครั้ง -> spentTravel=10 และ remaining=effectiveHours - (spentTravel+spentActivity)
4. When allocateActivity(38) ในสัปดาห์ effectiveHours=40 หลัง allocateTravel(3) -> allocateActivity ต้อง reject (state ไม่เปลี่ยน) ถ้าทำให้ spentActivity+spentTravel > 40 (No partial allocation)
5. Given carryOverPenalty มากจน effectiveHours < 0.1*baseHours -> effectiveHours ถูกตั้งเป็น floor = 4 (ถ้า base=40)
6. If function receive allocateTravel hours ทำให้รวมเกิน effectiveHours -> ฟังก์ชันคืน error code/block และ state ไม่เปลี่ยน

Edge Cases Documented:
- Penalty เกิน -> floor
- Over-allocation -> block (no partial)

Glossary Ambiguity Check: ไม่มีคำว่า "ประมาณ", "some", "ต่าง ๆ"

Definition of Done Checkboxes:
- [x] Context ชัด
- [x] Acceptance Criteria ตรวจได้ (6 ข้อ)
- [x] ไม่มีคำกำกวม
- [x] Dependencies ระบุแล้ว

Test Notes:
- Unit test ควรครอบ allocateTravel, allocateActivity, floor logic, block over-allocation

Implementation Specification (เพิ่มรายละเอียด):
- Formula: effective = baseHours - carryOverPenalty; if effective < baseHours * 0.1 -> effective = baseHours * 0.1 (ปัดเป็นทศนิยม 2 ตำแหน่งถ้าจำเป็น)
- Allocation Policy: ฟังก์ชัน allocate* เป็น atomic & synchronous ไม่แก้ state ถ้า error
- No Partial: ถ้า hours ทำให้เกิน limit -> reject พร้อม error code OVER_ALLOCATION
- Hours Validation: hours ต้อง > 0 มิฉะนั้น error NEGATIVE_OR_ZERO_HOURS
- Remaining = effectiveHours - (spentTravel + spentActivity)
- Precision: เก็บชั่วโมงเป็นเลขทศนิยม (สูงสุด 2 ตำแหน่ง) หลังคำนวณ

Error Codes:
- NEGATIVE_OR_ZERO_HOURS: ป้อนชั่วโมง ≤ 0
- OVER_ALLOCATION: การจัดสรรจะทำให้รวมเกิน effectiveHours

Determinism & Concurrency:
- ฟังก์ชันทั้งหมดเป็น pure-ish (คืน state ใหม่) ไม่มี mutation ในที่เดิม -> ป้องกัน race ง่ายในอนาคตถ้าใช้กับ async queue

Glossary Update: "reject" หมายถึงคืน Result แบบ error โดยไม่แก้ไข state เดิม
