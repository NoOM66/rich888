# STORY-002 Travel & Route Optimization Core

Context:
คำนวณเวลาเดินทางรวมจากลำดับสถานที่ ให้ผลรวมเวลาใช้สำหรับหักจากระบบเวลา และให้ score ประสิทธิภาพเบื้องต้น

Goal:
ทำให้การจัดเรียงสถานที่มีผลชัดเจนต่อเวลารวม (ลด spam / random ordering)

Scope (Included):
- รับ ordered list ของ locationIds
- รับ distance matrix (fallback distanceConst ถ้าไม่มี entry)
- คำนวณ totalTravelTime = Σ distance(i,i+1) * (1 - travelBonus%)
- คืน segmentTimes[]
- routeEfficiencyScore = baselineLinear / totalTravelTime (baselineLinear = Σ direct distances)
- Minimum per-hop time (config) ป้องกัน exploit loop back

Out of Scope:
- Algorithm improvement (TSP optimization)
- UI visual path

Dependencies:
- STORY-001 (ต้องใช้เวลาที่เหลือเพื่อตรวจ block)
- Upgrade multipliers (ยัง mock 0%)

Acceptance Criteria:
1. Given 3 nodes A->B->C distances (A,B)=5 (B,C)=7 baseline -> totalTravelTime=12 เมื่อไม่มี bonus
2. Given bonus 20% -> totalTravelTime=(5+7)*0.8 = 9.6 (ปัดทศนิยมตาม config - ยังไม่ implement rounding ใน scope นี้)
3. If missing distance (X,Y) -> ใช้ distanceConst (เช่น 10)
4. If any hop computed time < minHopTime (เช่น 1) -> ใช้ minHopTime แทน
5. routeEfficiencyScore = (baselineLinear / totalTravelTime) ≥ 1 เมื่อมี bonus หรือ minHopTime ไม่ trigger
6. เมื่อ totalTravelTime > remainingHours (จาก WeekState) -> return error/block ไม่ commit เวลา

Edge Cases:
- Missing distance -> fallback
- Loop back rapid exploit -> minHopTime enforce

Definition of Done Checkboxes:
- [ ] Context
- [ ] Acceptance Criteria (6)
- [ ] No ambiguous terms
- [ ] Dependencies stated

Test Notes:
- ทดสอบ hop < min -> clamp
- ทดสอบ bonus ทำให้ efficiencyScore >1
