# STORY-006 Upgrade & Multipliers Application

Context:
ผู้เล่นซื้อ upgrade เพื่อเพิ่มประสิทธิภาพ (multipliers) ที่มีผลกับ reward, travel time ฯลฯ

Goal:
ติดตั้งฐานข้อมูล upgrade ownership + การคำนวณรวม multipliers (ยังไม่ apply ใน execution จะตามใน story integration)

Scope (Included):
- upgradeDef: {id, category, cost, bonusPercent, unique}
- purchaseUpgrade(state, upgradeId)
- computeMultipliers(ownedUpgrades) -> map(category=>totalPercent)
- Reject ถ้าเงินไม่พอ หรือ unique ซ้ำ
- Clamp stacking ถ้าเกิน hardCapPerCategory (config)

Out of Scope:
- ROI hint calculation (future)
- UI

Dependencies:
- STORY-004 (เงินอัปเดต), STORY-003 (กิจกรรมให้เงินใช้ซื้อ)

Acceptance Criteria:
1. Given cost <= money -> purchase success หักเงิน
2. If unique already owned -> purchase reject (error code DUPLICATE)
3. If totalPercent > hardCap -> clamp = hardCap
4. If money < cost -> reject (INSUFFICIENT_FUNDS)
5. computeMultipliers รวม bonusPercent สะสมตาม category
6. Pure computeMultipliers (ไม่แก้ ownedUpgrades input)

Edge Cases:
- ซื้อหลายอัน category เดียวจนเกิน cap -> clamp

Definition of Done Checkboxes:
- [ ] Context
- [ ] Acceptance Criteria (6)
- [ ] Dependencies
- [ ] No ambiguity

Test Notes:
- test cap clamp
