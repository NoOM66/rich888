# STORY-010 Victory Condition Evaluation

Context:
ตรวจว่าผู้เล่นบรรลุ 4 บาร์ครบตาม threshold เพื่อจบเกม

Goal:
ให้ระบบรู้สัปดาห์ที่ชนะและสร้าง flag สะอาด

Scope (Included):
- evaluateVictory(bars, thresholds, currentWeek)
- Return {isVictory, weekOfCompletion?, completionSnapshot?}
- ตรวจเฉพาะจุดเรียกหลัง Summary (design decision)

Out of Scope:
- Multiplayer tie rules
- Mid-week detection

Dependencies:
- STORY-004 bars update
- STORY-009 summary trigger ก่อนเรียก (sequence)

Acceptance Criteria:
1. All bars >= threshold -> isVictory=true และ weekOfCompletion=currentWeek
2. Any bar < threshold -> isVictory=false
3. เมื่อชนะ -> completionSnapshot เก็บค่าบาร์ทั้งหมด
4. ฟังก์ชันไม่เปลี่ยน bars input (immutability)
5. เรียกซ้ำหลังชนะ -> ผลลัพธ์เหมือนเดิม (idempotent)
6. Partial (3/4 bar) -> isVictory=false

Edge Cases:
- Bars exceed threshold -> still victory (no overflow effect)

Definition of Done Checkboxes:
- [x] Context
- [x] Acceptance Criteria (6)
- [x] Dependencies
- [x] No ambiguity

Implementation Notes:
- evaluateVictory เรียกหลัง summary (sequence) ไม่แก้ state
- snapshot clone object เพื่อกันภายนอกแก้ค่า


Test Notes:
- idempotent call
