
rich-game — GameDev/Rich

เริ่มต้นอย่างรวดเร็ว (Quickstart)

1) ติดตั้ง dependencies:

```bash
cd GameDev/Rich
npm install
```

2) รัน unit tests:

```bash
npm test
```

การใช้งาน (Usage)

- ไฟล์หลัก: `GameDev/Rich/src/GameManager.ts` — ส่งออก singleton `GameManager` สามารถเริ่มได้ด้วย `GameManager.init()` หรือส่ง event emitter ของ Phaser ด้วย `initGameManagerWithScene(scene)` จาก `src/adapter.ts`

- API หลัก (สรุป):
  - `GameManager.init(emitter?)` — สร้าง/เริ่มต้น singleton
  - `GameManager.instance` — ดึง instance ที่ใช้งานอยู่
  - `currentState`, `startNewGame()`, `pauseGame()`, `endGame()`, `goToMainMenu()` — เมธอดจัดการสถานะเกม
  - `onStateChanged(handler)`, `offStateChanged(handler)` — สมัคร/ยกเลิกการรับแจ้งเมื่อสถานะเปลี่ยน

หมายเหตุสำคัญ

- โครงงานตัวอย่างนี้ตั้งค่าให้สามารถรันทดสอบได้โดยไม่ต้องผูกกับ Phaser เต็มรูปแบบ หากต้องการใช้งานจริง ให้ส่ง `scene.events` (Phaser.Events.EventEmitter) เข้าไปใน `GameManager.init(scene.events)` เพื่อให้ใช้ระบบอีเวนต์ของ Phaser

- เพื่อความเข้มงวดด้านคุณภาพ แนะนำให้เพิ่ม `eslint` และรัน `tsc --noEmit` ใน pipeline (CI)

Demo (ท้องถิ่น)

- รัน dev server (hot-reload):

```bash
cd GameDev/Rich
npm install
npm run dev
```

- สร้างไฟล์สำหรับโปรดักชัน:

```bash
npm run build
```

- ดูตัวอย่าง build แบบ local:

```bash
npm run preview
```

ปุ่มควบคุมใน demo (BootScene)
- กด `S` → Start (GamePlaying)
- กด `P` → Pause
- กด `E` → End (GameOver)
- กด `M` → กลับไป MainMenu

หมายเหตุเรื่อง bundle

- ใช้ Vite และตั้ง `manualChunks` ให้แยก `phaser` ออกเป็น chunk ของตัวเอง (`dist/assets/phaser-*.js`) และ dependency อื่น ๆ เป็น `vendor` chunk เพื่อให้ bundle หลักเล็กลงและสามารถแคชไฟล์ vendor ได้สะดวก

- หากต้องการลดขนาดที่ต้องดาวน์โหลดในฝั่งไคลเอนต์เพิ่มเติม ให้พิจารณาโหลด Phaser จาก CDN แทนการ bundle (แล้วลบ `phaser` จาก `package.json`) หรือทำการแยกโค้ด (code-splitting) เพิ่มเติม

เพิ่มเติม

- โค้ดตัวอย่างและเทสต์ถูกวางไว้ใน `GameDev/Rich/src/` และ `GameDev/Rich/src/*.test.ts` สามารถอ่านและแก้ไขเพื่อขยายระบบ GameManager ได้ตามต้องการ

หากต้องการ ผมช่วยตั้งค่า CI หรือสร้าง PR สำหรับการเปลี่ยนแปลงนี้ได้

Demo (local)

- Dev server (fast reload):

```bash
cd GameDev/Rich
npm install
npm run dev
```

- Build for production:

```bash
npm run build
```

- Preview production build locally:

```bash
npm run preview
```

Controls in the demo (BootScene)
- Press `S` to Start game (GamePlaying)
- Press `P` to Pause
- Press `E` to End game (GameOver)
- Press `M` to go to MainMenu

Bundle notes
- Build uses Vite with `manualChunks` configured to separate `phaser` into its own chunk (`dist/assets/phaser-*.js`) and other dependencies into a `vendor` chunk. This reduces the app bundle size and makes caching vendor code easier.

If you prefer to avoid bundling Phaser (smaller downloads for each deploy), consider loading Phaser from a CDN in `index.html` and removing the `phaser` dependency from `package.json`.
