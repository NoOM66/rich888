# Game Stories Backlog (Ordered)

Legend: ✅ = Ready (DoD Story-level boxes all checked), ⭕ = Pending checklist, 🔒 = Dependency not met

| Order | Story ID | Title | Dependencies | Status |
|-------|----------|-------|--------------|--------|
| 1 | STORY-001 | Time & Turn Management System Foundation | - | ✅ |
| 2 | STORY-002 | Travel & Route Optimization Core | STORY-001 | ✅ |
| 3 | STORY-003 | Activity Execution & Logging | STORY-001, STORY-002 | ✅ |
| 4 | STORY-004 | Status Bars Progress & Victory Hook | STORY-003 | ✅ |
| 5 | STORY-005 | Obligations Tracking & Penalty Effects | STORY-003 | ✅ |
| 6 | STORY-006 | Upgrade & Multipliers Application | STORY-003, STORY-004 | ✅ |
| 7 | STORY-007 | Financial Loans & Simple Investments | STORY-004, STORY-006 | ✅ |
| 8 | STORY-008 | Forecast & Planning Preview | STORY-002, STORY-005, STORY-006 | ⭕ |
| 9 | STORY-009 | Week Summary & Reporting | STORY-003, STORY-005, STORY-006, STORY-007 | ✅ |
| 10 | STORY-010 | Victory Condition Evaluation | STORY-004, STORY-009 | ✅ |

## Notes
- เปลี่ยนสถานะเป็น ✅ หลังตรวจ DoD checkbox ในแต่ละไฟล์ครบ
- ถ้าพบ dependency เพิ่มให้ปรับที่ตารางนี้และหัวไฟล์ story
- หาก Story แตกย่อย ให้เพิ่ม STORY-00xA/B และอัปเดต order
