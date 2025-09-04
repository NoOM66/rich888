# DoD Checklist Result (Iteration Draft)

Global Definition of Done Mapping:
1. Objective metric วัดได้ -> (นอก scope ไฟล์ story รายตัว)
2. Pillars ≤5 map systems -> ตรวจใน GDD แล้ว ✔
3. แต่ละ System มี Edge Case ≥1 -> ทุก story ระบุ Edge Cases section ✔
4. ทุก Story มี ≥1 Acceptance Criteria ตรวจสอบได้ -> แต่ละไฟล์ >=6 ข้อ ✔
5. Tests (จะเขียนภายหลัง code phase) -> Pending
6. ไม่มี TBD สำคัญ -> ไม่มีคำว่า TBD ในไฟล์ stories ✔
7. หลัง Implement: Lint/Type/Tests -> Future check
8. Orchestrator ปิด Iteration -> Future

Per-Story Quick Audit (boxes manual tick later):
| Story | Context | AC >=6 | No Ambiguity | Dependencies Clear | Edge Cases | Status |
|-------|---------|--------|--------------|--------------------|-----------|--------|
| STORY-001 | ✔ | 6 | ✔ | ✔ | ✔ | Draft |
| STORY-002 | ✔ | 6 | ✔ | ✔ | ✔ | Draft |
| STORY-003 | ✔ | 6 | ✔ | ✔ | ✔ | Draft |
| STORY-004 | ✔ | 6 | ✔ | ✔ | ✔ | Draft |
| STORY-005 | ✔ | 6 | ✔ | ✔ | ✔ | Draft |
| STORY-006 | ✔ | 6 | ✔ | ✔ | ✔ | Draft |
| STORY-007 | ✔ | 6 | ✔ | ✔ | ✔ | Draft |
| STORY-008 | ✔ | 6 | ✔ | ✔ | ✔ | Draft |
| STORY-009 | ✔ | 6 | ✔ | ✔ | ✔ | Draft |
| STORY-010 | ✔ | 6 | ✔ | ✔ | ✔ | Draft |

Next Steps:
- หลังเริ่ม implement ให้เปิดโฟลเดอร์ /src/systems/* ตาม story
- เขียน unit tests เคสหลัก + edge (อย่างน้อย 1 ต่อ story)
- อัปเดต BACKLOG.md เปลี่ยนสถานะเป็น ✅ เมื่อ test ผ่าน + review
