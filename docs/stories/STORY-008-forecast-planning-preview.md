# STORY-008 Forecast & Planning Preview

Context:
สร้างการคาดการณ์ผลรวม (เวลาที่ใช้, delta bars, cost) ก่อนผู้เล่นยืนยันแผน ลดการลองผิดลองถูก

Goal:
จำลองผลแบบไม่มี side effect ให้ผลสรุป preview

Scope (Included):
- simulatePlan(tentativePlan, currentState, multipliers, travelCalc)
- คืน: {netDeltas, expectedCost, timeUsage, warnings:[]}
- Debounce responsibility อยู่ layer UI (ไม่รวมใน story ฟังก์ชันนี้ pure)
- Detect risk: obligation ที่ยังไม่อยู่ใน plan -> warnings push

Out of Scope:
- UI Debounce
- Discrepancy correction banner (future)

Dependencies:
- STORY-002 travel, STORY-006 multipliers, STORY-005 obligations config (เพื่อเตือน)

Acceptance Criteria:
1. Given tentativePlan กิจกรรมที่รวม reward บวก -> netDeltas รวมเท่าที่คำนวณถูกต้อง
2. If travelCalc ส่งเวลารวม + activity time > effectiveHours -> warnings มี OVER_TIME
3. If obligation tag ไม่มีใน tentativePlan -> warnings รวม MISSING_<tag>
4. expectedCost = Σ cost activities ที่มี field cost
5. Function ไม่เปลี่ยน currentState / tentativePlan (pure)
6. เรียกสองครั้ง input เดิม -> output เดิม

Edge Cases:
- Empty plan -> netDeltas=0, timeUsage=0, warnings=[]

Definition of Done Checkboxes:
- [ ] Context
- [ ] Acceptance Criteria (6)
- [ ] Dependencies
- [ ] No ambiguity

Test Notes:
- plan missing obligation
