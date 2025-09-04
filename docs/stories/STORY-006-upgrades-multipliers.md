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

Implementation Specification:
Data Shapes:
- UpgradeDef: { id: string; category: string; cost: number; bonusPercent: number; unique: boolean }
- UpgradeState: { money: number; owned: string[] } (owned = array ของ upgrade id ที่ซื้อแล้ว)
- HardCapsConfig: Record<string, number> // category -> max total bonusPercent (เช่น { travel: 0.5, reward: 1 })

Functions:
1. purchaseUpgrade(defs, state, upgradeId, hardCapsConfig?) -> Result<PurchaseResult, PurchaseError>
	 - Success: { ok:true; value:{ newState: UpgradeState; purchased: UpgradeDef; newMoney: number; owned: string[] } }
	 - Fail (error codes):
		 * UNKNOWN_UPGRADE
		 * INSUFFICIENT_FUNDS
		 * DUPLICATE (unique=true & already owned)
		 * INVALID_VALUE (cost < 0 หรือ bonusPercent < 0 ใน definition)
	 - Pure & immutable: ไม่แก้ state / defs input (คืน newState freeze)
	 - ไม่คำนวณ multiplier (แยก concern)

2. computeMultipliers(ownedIds, defs, hardCapsConfig) -> { multipliers: Record<string, number>; raw: Record<string, number> }
	 - raw = ผลรวม bonusPercent ต่อ category (ไม่ clamp)
	 - multipliers = ผลหลัง clamp ตาม hardCapsConfig ถ้ามี (ถ้าไม่มี cap สำหรับ category ให้ใช้ raw)
	 - หากเจอ invalid upgrade (negative cost/bonus) ให้ข้าม (defensive) แต่ไม่ throw (เพราะควรถูกกรองจาก purchase)
	 - Pure, ไม่แก้ defs หรือ ownedIds

Rounding / Representation:
- bonusPercent ใช้ค่า float ตรง ๆ (ไม่มีปัด) เพราะเป็นตัวคูณเปอร์เซ็นต์สะสม เช่น 0.1 = +10%
- Clamp: totalPercent > hardCapPerCategory -> ใช้ hardCap (AC3)

Ownership Rules:
- Unique: ถ้ามีใน owned แล้ว -> DUPLICATE
- Non-unique: สามารถซื้อซ้ำสะสม (เช่น +5% แต่ยัง clamp ตาม cap)

Error Codes Summary:
- UNKNOWN_UPGRADE: ไม่เจอ upgradeId ใน defs
- INSUFFICIENT_FUNDS: state.money < cost
- DUPLICATE: unique=true & id อยู่ใน owned แล้ว
- INVALID_VALUE: cost <0 หรือ bonusPercent <0 (definition problem)

Purchase Flow (Pseudo):
```
find def
if !def -> error UNKNOWN_UPGRADE
if def.cost <0 || def.bonusPercent <0 -> error INVALID_VALUE
if def.unique && owned.includes(id) -> error DUPLICATE
if money < def.cost -> error INSUFFICIENT_FUNDS
newState = { money: money - cost, owned: [...owned, id] } (freeze)
return success
```

Multipliers Flow (Pseudo):
```
group by category -> sum
for each category:
	cap = hardCapsConfig[category]
	applied = cap ? Math.min(sum, cap) : sum
return { raw: sums, multipliers: applied }
```

Example:
Defs:
- speed_boots { id:'spd1', category:'travel', cost:200, bonusPercent:0.1, unique:true }
- coffee { id:'cf1', category:'activity', cost:50, bonusPercent:0.05, unique:false }
Owned: ['spd1','cf1','cf1'] -> raw: { travel:0.1, activity:0.10 } (coffee ซื้อ 2 ครั้ง) -> ถ้า cap activity=0.08 => multipliers.activity=0.08

Security / Determinism:
- Sorting of ownedIds ไม่จำเป็น; iteration ตามลำดับ ownedIds ที่รับเข้ามา (ผลรวม commutative) -> deterministic
- Return objects freeze ชั้นแรก (optional) ไม่บังคับใน AC แต่ช่วยความปลอดภัย

Test Matrix Notes:
- Success purchase (AC1) หักเงินถูกต้อง
- Unique second purchase (AC2) => DUPLICATE
- Cap clamp (AC3) ด้วยหลาย non-unique จนเกิน hardCap
- Insufficient funds (AC4)
- computeMultipliers sum (AC5)
- Immutability / purity (AC6)
- INVALID_VALUE: definition ที่ cost <0 หรือ bonus <0 (defensive) -> purchase reject
- Non-unique stacking plus cap edge

Open Points (Future Stories):
- การ apply multipliers สู่ travel time / rewards (integration story)
- ROI helper (คำนวณ payback week)
- Permanent vs consumable upgrades (category flag)

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
- [x] Context
- [x] Acceptance Criteria (6)
- [x] Dependencies
- [x] No ambiguity

Test Notes:
- test cap clamp
- test error codes (INSUFFICIENT_FUNDS, DUPLICATE, UNKNOWN_UPGRADE, INVALID_VALUE)
- test non-unique stacking then cap
- test purity (owned & defs not mutated)
