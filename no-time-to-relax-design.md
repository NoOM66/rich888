# “No Time to Relax” — สรุปเชิงออกแบบเกม (ฉบับพร้อมพัฒนา)
**เวอร์ชัน:** 1.0  
**ปรับปรุงล่าสุด:** 2025-09-01  
**ภาษา:** ไทย (มีศัพท์เทคนิคอังกฤษกำกับบางส่วน)  

> บันทึกนี้สรุปกลไกหลักจากคลิปสอนเล่น *No Time to Relax* และเรียบเรียงใหม่ในรูปแบบสเปกเกม (Game Design + Data Schema + Pseudocode) เพื่อให้นำไปพัฒนาต่อได้ทันทีในเอนจินใด ๆ (Unity/Godot/Web ฯลฯ)

---

## สารบัญ
- [1. วิสัยทัศน์และเป้าหมาย (Game Goals)](#1-วิสัยทัศน์และเป้าหมาย-game-goals)
- [2. ลูปแกนกลางของเกม (Core Loop)](#2-ลูปแกนกลางของเกม-core-loop)
- [3. ค่าสถานะหลัก 4 บาร์ (Stats)](#3-ค่าสถานะหลัก-4-บาร์-stats)
- [4. ภาระประจำรอบ (Upkeep & Constraints)](#4-ภาระประจำรอบ-upkeep--constraints)
- [5. งานและเส้นทางเติบโต (Jobs & Progression)](#5-งานและเส้นทางเติบโต-jobs--progression)
- [6. ระบบธนาคาร/การเงิน (Banking)](#6-ระบบธนาคารการเงิน-banking)
- [8. ระบบที่พัก/เฟอร์นิเจอร์/สัตว์เลี้ยง (Housing & Furniture & Pets)](#7-ระบบที่พักเฟอร์นิเจอร์สัตว์เลี้ยง-housing--furniture--pets)
- [9. สถานที่บนแผนที่และการเดินทาง (World & Travel)](#8-สถานที่บนแผนที่และการเดินทาง-world--travel)
- [9. อีเวนต์สุ่ม (Random Events)](#9-อีเวนต์สุ่ม-random-events)
- [10. แบบจำลองข้อมูล (Data Model)](#10-แบบจำลองข้อมูล-data-model)
- [11. ขั้นตอนการทำงานต่อสัปดาห์ (Game Loop Pseudocode)](#11-ขั้นตอนการทำงานต่อสัปดาห์-game-loop-pseudocode)
- [12. AI คู่แข่ง (Opponent Heuristics)](#12-ai-คู่แข่ง-opponent-heuristics)
- [13. UX/ระบบแจ้งเตือนสำคัญ](#13-uxระบบแจ้งเตือนสำคัญ)
- [14. โหมด/ความยาก/การบาลานซ์](#14-โหมดความยากการบาลานซ์)
- [15. ค่าพารามิเตอร์เริ่มต้น (ตัวอย่างปรับได้)](#15-ค่าพารามิเตอร์เริ่มต้น-ตัวอย่างปรับได้)
- [16. Roadmap & TODO สำหรับทีมพัฒนา](#16-roadmap--todo-สำหรับทีมพัฒนา)

---

## 1) วิสัยทัศน์และเป้าหมาย (Game Goals)
- แข่งขันบริหาร “ชีวิต” ให้ **บาร์ 4 ค่า** เต็ม ได้แก่ **เงิน (Money)**, **สุขภาพ (Health)**, **ความสุข (Happiness)**, **การศึกษา (Education)**
- ผู้ที่ทำ **ครบทั้ง 4** ก่อนจะชนะเกม (Win Condition)
- โทนเกม: Life-sim + Strategy + Route Optimization, เน้นการแลกเปลี่ยนเวลา/เงิน/สถานะ

---

## 2) ลูปแกนกลางของเกม (Core Loop)
- เกมแบ่งเป็น **สัปดาห์** (เทิร์นต่อผู้เล่น)
- แต่ละสัปดาห์ผู้เล่นมี **งบเวลา (time budget)** จำกัด ใช้ไปกับการ **เดินทาง** และ **ทำกิจกรรม**
- ถ้าละเลยการพัก/อาหาร → เกิด **ความเครียด (stress)** ซึ่งลด **time budget** ในสัปดาห์ถัดไป
- เมืองเป็นกระดาน: เลือกเส้นทางไปยังสถานที่ต่าง ๆ เพื่ออัพเดตบาร์/เงินและบรรลุเป้าหมาย

**Core Decisions ในแต่ละสัปดาห์**
1) วางแผนเส้นทาง (ลด travel time)  
2) จัดลำดับกิจกรรม (เพิ่มบาร์ที่คอขวด)  
3) บริหารเงินสด/หนี้/การลงทุน (เร่ง progression อย่างยั่งยืน)

---

## 3) ค่าสถานะหลัก 4 บาร์ (Stats)
- **Money:** รายรับจากงาน/กิจกรรมเสริม ใช้จ่ายค่าเช่า อาหาร เสื้อผ้า ค่าเรียน/ดอกเบี้ย
- **Health:** เพิ่มจากออกกำลังกาย/พักผ่อน ลดจากทำงานหนัก/ข้ามมื้ออาหาร
- **Happiness:** เพิ่มจากสันทนาการ บันเทิง ท่องเที่ยว จับจ่าย
- **Education:** เพิ่มจากลงเรียน/คอร์ส ใช้ปลดล็อกงานรายได้สูง/เลื่อนขั้น

> แนวคิด: ทำให้ **trade-off** ชัด—กิจกรรมเดียวอาจบวกหนึ่งบาร์แต่ลบอีกบาร์/ใช้เวลา-เงินมาก

---

## 4) ภาระประจำรอบ (Upkeep & Constraints)
- **กินข้าวทุกสัปดาห์**: ลืมกิน → โดน **HUNGER_PENALTY** หัก time budget สัปดาห์ถัดไป
- **ค่าเช่าบ้านทุก 4 สัปดาห์**: ค้าง → ปรับ/กดดันการเงิน
- **ซื้อเสื้อผ้าทุก 6 สัปดาห์**: ไม่ซื้อ → ถูก **gating** เข้าถึงบางคอร์ส/งานไม่ได้
- ต้นทุนเดินทาง (travel time) ทำให้ “ที่ตั้ง” ของสถานที่สำคัญมาก

---

## 5) งานและเส้นทางเติบโต (Jobs & Progression)
- งานมีหลาย **เลเวล** ให้ค่าแรง/ชม. ต่างกัน
- เลื่อนขั้นงานต้องใช้ **Education ขั้นต่ำ** + **ชุดแต่งกาย/เงื่อนไข** บางอย่าง
- ทำงานมากได้เงินมาก แต่เสี่ยง **สุขภาพ/ความสุข** ลด และเพิ่ม **stress** → บาลานซ์สำคัญ

---

## 6) ระบบธนาคาร/การเงิน (Banking)

## 7) ระบบที่พัก/เฟอร์นิเจอร์/สัตว์เลี้ยง (Housing & Furniture & Pets)

### 7.1 บ้านเช่า (Housing Tiers)
แนวคิด: บ้านเป็นตัวคูณประสิทธิภาพการฟื้นฟู/เรียน/ความสุข และเป็นตัวกำหนด **โควตาเฟอร์นิเจอร์** และ **จำนวนสัตว์เลี้ยง** ที่อนุญาต

| ระดับบ้าน | ค่าเช่า/4 สัปดาห์ | เงินมัดจำ (คืนบางส่วนเมื่อย้ายออก) | ค่าสาธารณูปโภค/4 สัปดาห์ | Bonus การพัก (Rest Bonus) | Bonus เรียน (Study Bonus) | Bonus ความสุข (Hap. Cap+) | โควตาเฟอร์นิเจอร์ | โควตาสัตว์เลี้ยง | เวลาย้ายบ้าน (ชั่วโมง) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ห้องแชร์ | 60 | 60 | 20 | +5% | +0% | +0 | 2 | 0 | 4 |
| สตูดิโอ | 120 | 120 | 30 | +10% | +5% | +5 | 4 | 1 | 6 |
| 1 ห้องนอน | 200 | 200 | 40 | +15% | +10% | +10 | 6 | 1 | 8 |
| พรีเมียม | 360 | 360 | 60 | +25% | +15% | +20 | 8 | 2 | 10 |

กฎ:
- จ่ายค่าเช่า **ทุก 4 สัปดาห์**; ค่าสาธารณูปโภคคิดพร้อมกัน (utility)
- การย้ายบ้านกินเวลา + เสียค่าขนย้ายคงที่ (เช่น 30) และอาจสูญมัดจำบางส่วน (เช่น คืน 80% หากไม่มีเหตุเสียหาย)
- บ้านระดับสูงขึ้น **ปลดล็อกคอนเทนต์** บางอย่าง (เช่น คอร์สระดับสูง, งานออฟฟิศบางชนิด)

### 7.2 เฟอร์นิเจอร์ (Furniture System)
ประเภทหลัก:
- **เตียง (BED):** เพิ่มประสิทธิภาพการพัก/ลด stress ดีขึ้น
- **โต๊ะอ่านหนังสือ (DESK):** เพิ่มประสิทธิภาพค่า Education ต่อชั่วโมงเรียน
- **ครัว/เตา (KITCHEN):** ปลดล็อก **ทำอาหารที่บ้าน** (ถูกกว่า/เฮลธ์ดีกว่า), ต้องซื้อวัตถุดิบ
- **บันเทิง (ENTERTAINMENT):** เพิ่ม Happiness ต่อกิจกรรมพักผ่อนในบ้าน
- **ตู้เสื้อผ้า (WARDROBE):** เพิ่มขีดจำกัดชุด/แก้ gate เสื้อผ้า
- **ห้องน้ำ/อ่าง (BATH):** เพิ่ม Health regen หลังวันหนัก ๆ
- **ที่อยู่อาศัยสัตว์ (PET_HOUSING):** จำเป็นหากมีสัตว์เลี้ยงบางชนิด

ตัวอย่างไอเท็ม:
| ไอเท็ม | ราคา | ช่องที่ใช้ | เอฟเฟกต์ |
|---|---:|---:|---|
| Bed Mk1 | 80 | 1 | Sleep Efficiency +10%, Stress -1 เมื่อพัก |
| Study Desk Mk1 | 100 | 1 | Education +10% ต่อชั่วโมงเรียน |
| Stove + Pan | 120 | 1 | ปลดล็อกแอ็กชัน CookAtHome (ต้นทุนอาหารถูกลง 30%, Health +1) |
| TV Basic | 90 | 1 | Happiness +1 ต่อ 1 ชม. สันทนาการที่บ้าน |
| Wardrobe | 70 | 1 | ช่องชุดเพิ่ม +3; ไม่โดน gate เสื้อผ้าหมดอายุเร็ว |
| Bathtub | 110 | 1 | หลังทำงาน >6 ชม. วันนั้น ใช้เวลาพัก 1 ชม. ได้ Health +3 |
| Pet Bed | 60 | 1 | จำเป็นถ้าเลี้ยงสุนัข/แมว; ลดโทษความเครียดจากสัตว์เลี้ยงงอแง |

ทนทาน/ซ่อม:
- เฟอร์นิเจอร์มี **durability**; ใช้ไปมีโอกาสพัง ต้อง **RepairFurniture** (เสียเงิน/เวลา) หรือเปลี่ยนใหม่

### 7.3 สัตว์เลี้ยง (Pets)
- ประเภท: แมว, สุนัข, หนูแฮมสเตอร์ ฯลฯ แต่ละชนิดให้ **Happiness Passives** แตกต่างกัน
- **ค่าใช้จ่าย**: ค่าอุปการะเริ่มต้น + ค่าดูแลรายสัปดาห์ (อาหาร/ทราย/ของเล่น)
- **แอ็กชัน**: FeedPet, PlayWithPet, GroomPet → ให้ Happiness/ลด Stress แต่ใช้เวลา
- **กติกาการดูแล**: ถ้าไม่ได้ให้อาหาร/เล่นตามเกณฑ์ → โดน **Neglect Penalty** (Happiness ลด, บางทีเกิดอีเวนต์ “พาไปหาหมอ” ค่าใช้จ่ายสูง)
- ต้องมี **Pet_Housing** และบ้านต้องมี **pet slot** เหลือ

ตัวอย่างพารามิเตอร์เริ่มต้น:
| สัตว์ | ค่าอุปการะ | ค่าอาหาร/สัปดาห์ | Passive | เพนัลตีหากละเลย |
|---|---:|---:|---|---|
| แมว | 120 | 12 | Happiness +1/wk | -2 Happiness/wk + โอกาสป่วย 10% |
| สุนัข | 150 | 15 | Happiness +1, Stress -1/wk | -3 Happiness/wk + โอกาสป่วย 12% |
| แฮมสเตอร์ | 60 | 6 | Happiness +0.5/wk | -1 Happiness/wk |

### 7.4 กลไกเพิ่มเติม
- **ทำอาหารที่บ้าน (CookAtHome)**: ต้องมีครัว; ใช้เวลาน้อยกว่าไปกินข้างนอกเล็กน้อย, ต้นทุนถูกกว่า, ให้ Health/Happiness เล็กน้อย
- **ค่าทำความสะอาดบ้าน (Dirt Meter)**: บ้านสกปรกตามการใช้งาน/สัตว์เลี้ยง → ถึงเกณฑ์ให้ Debuff (เช่น -5% Rest Bonus) จนกว่าจะทำแอ็กชัน **CleanHouse**
- **ค่าสาธารณูปโภค** เก็บทุก 4 สัปดาห์; บ้านระดับสูงขึ้นจ่ายมากขึ้น
- **เหตุการณ์เกี่ยวกับบ้าน/สัตว์เลี้ยง**: เพื่อนบ้านร้องเรียน (เสียเวลา/ค่าปรับ), เฟอร์นิเจอร์ชำรุด, โปรโมชั่นเฟอร์นิเจอร์ลดราคา

### 7.5 ส่วนขยาย Data Model (สรุปเพิ่มจากข้อ 9)
```json
{{
  "Player": {{
    "home_id": "premium-01",
    "furniture_ids": ["bed-mk1","desk-mk1","stove-01","tv-basic","wardrobe"],
    "pets": [{{"type":"cat","name":"Milo","hunger":0,"happiness":5}}]
  }},
  "Home": {{
    "id":"premium-01","tier":"PREMIUM",
    "rent":360,"deposit":360,"utilities":60,
    "rest_bonus":0.25,"study_bonus":0.15,"happiness_cap_bonus":20,
    "furniture_slots":8,"pet_slots":2,"move_time_cost":10,"move_fee":30
  }},
  "Furniture": {{
    "id":"stove-01","type":"KITCHEN",
    "price":120,"slots":1,"durability":100,
    "effects":{{"unlock":["CookAtHome"],"health_per_meal":1,"cost_modifier_meal":-0.3}}
  }},
  "Pet": {{
    "type":"dog","adopt_cost":150,"weekly_food":15,
    "passives":{{"happiness_per_week":1,"stress_per_week":-1}},
    "neglect":{{"happiness_loss":3,"sick_chance":0.12}}
  }}
}}
```

### 7.6 ส่วนขยาย Pseudocode (แพตช์จากข้อ 10)
```pseudo
function start_week(player, rules):
    penalty = stress_penalty(player.stress, rules.stress_to_time)
    home = get_home(player.home_id)
    player.time_budget = (rules.base_time - penalty) * (1 + home.rest_bonus_from_last_week)
    // หมายเหตุ: rest_bonus_from_last_week มาจากกิจกรรมพัก + เตียง + บ้าน

function end_week(player, rules):
    // เดิม...
    // เพิ่มเติม: บ้าน/เฟอร์นิเจอร์/สัตว์เลี้ยง/ค่าสาธารณูปโภค
    process_rent_and_utilities(player)        // ทุก 4 สัปดาห์
    process_pet_upkeep(player)                // อาหาร/การเล่นขั้นต่ำ
    accumulate_dirt(player)                   // เพิ่มความสกปรกตามใช้งาน/จำนวนสัตว์
    if is_dirty(player.home_id): apply_dirty_debuff(player)

action CookAtHome:
    require furniture.type == KITCHEN
    time_cost = 0.8h
    money_delta = - (food_base_cost * (1 + market_modifier) * (1 + furniture.cost_modifier_meal))
    health_delta = +1
    happiness_delta = +1
```

---
- ฝาก/กู้/ผ่อนชำระเป็นรายสัปดาห์
- **Leverage อย่างมีวินัย**: ใช้เงินกู้เร่งเรียน/เลื่อนงาน แต่ต้องรักษา cashflow ให้ผ่อนชำระได้
- สูตรตัวอย่างดอกเบี้ย: `principal = principal * (1 + rate/52) - payment`

---

## 8) สถานที่บนแผนที่และการเดินทาง (World & Travel)
- โหนดสถานที่: ร้านอาหาร, ยิม, มหาวิทยาลัย, สวน/ศูนย์บันเทิง, ห้าง/ช้อป, ธนาคาร, ที่ทำงาน ฯลฯ
- แผนที่เป็นกราฟ: `travel_time[A][B]` → เส้นทางสั้นช่วยประหยัดงบเวลา
- แนะนำให้มี **Route Planner UI** ที่แสดง **Projected Stats/Time** แบบเรียลไทม์

---

## 9) อีเวนต์สุ่ม (Random Events)
- เหตุการณ์ดี/ร้าย เช่น โบนัสงาน, ส่วนลดคอร์ส, ค่าปรับภาษี, เจ็บป่วยเล็กน้อย ฯลฯ
- ใช้ **weight/rarity** และ **guard rules** เพื่อไม่ทำให้เกม swing เกินควร โดยเฉพาะช่วงต้นเกม

---

## 10) แบบจำลองข้อมูล (Data Model)
โครงสร้างข้อมูลตัวอย่าง (JSON Schema แนวทาง):
```json
{
  "Player": {
    "id": "string",
    "money": 0,
    "health": 50,
    "happiness": 50,
    "education": 0,
    "stress": 0,
    "time_budget": 40,
    "flags": {"ate": false},
    "counters": {"rent": 4, "clothes": 6},
    "job_level": 0,
    "loans": [{"principal": 0, "rate": 0.2, "min_payment": 0}]
  },
  "Job": {
    "level": 0,
    "wage_per_hour": 10,
    "edu_req": 0,
    "outfit_req": 0
  },
  "Action": {
    "name": "Eat Meal",
    "time_cost": 1,
    "money_delta": -8,
    "health_delta": 3,
    "happiness_delta": 1,
    "education_delta": 0,
    "tags": ["eat"]
  },
  "Location": {
    "id": "gym-01",
    "type": "GYM",
    "actions": ["Workout", "Buy Smoothie"]
  },
  "WeeklyRules": {
    "food_required": true,
    "rent_every": 4,
    "clothes_every": 6,
    "hunger_penalty": 6,
    "base_time": 40,
    "stress_to_time": [{"threshold":10,"penalty":2}, {"threshold":20,"penalty":4}]
  }
}
```

ตารางพจนานุกรม (สรุปฟิลด์สำคัญ):
- **Player**: money, health, happiness, education, stress, time_budget, flags (ate), counters (rent/clothes), job_level, loans[]  
- **Job**: level, wage_per_hour, edu_req, outfit_req  
- **Action**: time_cost + deltas (เงิน/สุขภาพ/ความสุข/การศึกษา) + tags  
- **Location**: type, actions[]  
- **WeeklyRules**: base_time, hunger_penalty, รอบเก็บค่าเช่า/เสื้อผ้า, mapping stress→penalty

---

## 11) ขั้นตอนการทำงานต่อสัปดาห์ (Game Loop Pseudocode)
```pseudo
function start_week(player, rules):
    penalty = stress_penalty(player.stress, rules.stress_to_time)
    player.time_budget = rules.base_time - penalty

function take_action(player, action):
    if player.time_budget < action.time_cost: return "NoTime"
    player.time_budget -= action.time_cost
    player.money      += action.money_delta
    player.health     += action.health_delta
    player.happiness  += action.happiness_delta
    player.education  += action.education_delta
    if "eat" in action.tags: player.flags.ate = true
    clamp_stats(player)

function end_week(player, rules):
    if rules.food_required and not player.flags.ate:
        player.next_time_penalty += rules.hunger_penalty
    player.flags.ate = false

    // counters
    player.counters.rent    -= 1
    player.counters.clothes -= 1

    if player.counters.rent == 0:
        charge_rent(player)
        player.counters.rent = rules.rent_every

    if player.counters.clothes == 0:
        if not bought_clothes_this_week(player):
            apply_outfit_gate(player)
        player.counters.clothes = rules.clothes_every

    // loans
    for loan in player.loans:
        loan.principal = loan.principal * (1 + loan.rate/52) - loan.min_payment
        if loan.principal < 0: loan.principal = 0

function check_win(player, MAX=100):
    return (player.money >= MAX and
            player.health >= MAX and
            player.happiness >= MAX and
            player.education >= MAX)
```

---

## 12) AI คู่แข่ง (Opponent Heuristics)
- **พื้นฐาน:** เลือกกิจกรรมที่เพิ่ม **บาร์คอขวด** (ค่าต่ำสุด) ต่อเวลาได้คุ้มสุด (`deltaStat/time_cost`)
- **กลาง:** พิจารณาเหตุการณ์ Upkeep ใกล้ถึงกำหนด (กิน/เช่า/เสื้อผ้า) + บริหารหนี้
- **สูง:** มองหลายสัปดาห์ล่วงหน้า + ใช้ leverage เพื่อเร่งการศึกษา/เลื่อนขั้นงานอย่างปลอดภัย

---

## 13) UX/ระบบแจ้งเตือนสำคัญ
- Toast/Badge เตือน: ใกล้ถึงกำหนด **กิน/เช่า/เสื้อผ้า**
- **Projected Panel**: แสดงผลลัพธ์คาดการณ์หลังทำแผน (เงินคงเหลือ, บาร์เปลี่ยนแปลง, ดอกเบี้ย, time เหลือ)
- **Route Planner**: ลากวางคิวกิจกรรมบนแผนที่ เห็น **travel time** และ **ผลรวม** แบบเรียลไทม์

---

## 14) โหมด/ความยาก/การบาลานซ์
- ความยาวเกม: **Short (10w) / Medium (20w) / Long (30w+)**
- ความยาก: ปรับ `base_time`, ราคาอาหาร, ค่าเรียน, **penalty** ต่าง ๆ, อัตราดอกเบี้ย
- Multiplayer: PvP Local/Online, Co-op (ต่อยอดภายหลัง)

---

## 15) ค่าพารามิเตอร์เริ่มต้น (ตัวอย่างปรับได้)
| พารามิเตอร์ | ค่าเริ่มต้น | คำอธิบาย |
|---|---:|---|
| base_time/สัปดาห์ | 40 | เวลามาตรฐานต่อเทิร์น |
| hunger_penalty | 6 | ไม่กินข้าวในสัปดาห์ → หักเวลาในสัปดาห์ถัดไป |
| stress penalty map | [(10→2),(20→4)] | เกิน 10 สเตรส หัก 2 ชม.; เกิน 20 หัก 4 ชม. |
| ค่าเช่า (ทุก 4 สัปดาห์) | 120 | ค่าบ้าน/หอ |
| เสื้อผ้า (ทุก 6 สัปดาห์) | 90 | ไว้ผ่าน gate งาน/คอร์สระดับสูง |
| คอร์สเรียนพื้นฐาน | 150 | +Education ชัดเจน, เปิดงาน Lv1 |
| ค่าอาหารต่อมื้อ | 8 | +Health/+Happiness เล็กน้อย |
| ค่าแรงเริ่มต้น | 10/ชม. | งาน Lv0 |
| ดอกเบี้ยเงินกู้ | 20% APR | ทบรายสัปดาห์ ~ rate/52 |

> หมายเหตุ: ปรับสมดุลตามระยะเกม/จำนวนผู้เล่น/ความยากที่ต้องการ

---

## 16) Roadmap & TODO สำหรับทีมพัฒนา
**MVP (2–3 สปรินต์)**  
- [ ] ระบบเทิร์น/เวลา/เดินทางบนแผนที่ (กราฟง่าย ๆ)  
- [ ] Actions พื้นฐาน: กิน, ทำงาน, เรียน, พัก, บันเทิง
- [ ] ระบบที่พักขั้นต้น (เลือกบ้าน, จ่ายค่าเช่า/ยูทิลิตี้)
- [ ] ระบบเฟอร์นิเจอร์พื้นฐาน (ซื้อ/ใช้เอฟเฟกต์)
- [ ] สัตว์เลี้ยงพื้นฐาน (อุปการะ/ให้อาหาร/โบนัส Happiness)  
- [ ] Upkeep (กิน/เช่า/เสื้อผ้า) + ดอกเบี้ยกู้  
- [ ] เงื่อนไขชนะ (4 บาร์ครบ) + Summary Screen  
- [ ] UI Route Planner + Projected Panel  

**Post-MVP**  
- [ ] Random Events + Achievements  
- [ ] AI ระดับกลาง-สูง  
- [ ] Multiplayer (Local/Online)  
- [ ] Content Pack: สถานที่/คอร์ส/งานเพิ่ม, ชุดแต่งกาย, ระบบตกแต่งที่พัก  
- [ ] Analytics Hook (บาลานซ์อัตโนมัติ/เทเลเมทรี)  

---

### หมายเหตุทางลิขสิทธิ์
- เอกสารนี้จัดทำเพื่ออธิบายแนวคิดเชิงกลไก/ระบบในเชิงการศึกษาและพัฒนา *เกมแนวเดียวกัน* ไม่ใช่การคัดลอกทรัพย์สินทางศิลป์/ซอร์สโค้ด/แอสเซ็ตของเกมต้นฉบับ
- แนะนำให้ใช้ **ธีม, ชื่อ, และงานศิลป์** ของคุณเองเมื่อพัฒนาเกมจริง

---

**ต้องการเวอร์ชันเฉพาะเอนจิน?**  
แจ้งแพลตฟอร์มที่ใช้ (เช่น Unity C#, Godot GDScript, Web/TypeScript) ผมจะแตกไฟล์ **Data Schema (JSON)** และ **สเกลตันโค้ด** ให้พร้อมรันได้ทันที
