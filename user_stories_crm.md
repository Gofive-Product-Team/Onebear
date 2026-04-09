# User Story — CRM Customer Management
## Onebear Phase 1

---

# 🟥 Pain

ระบบ CRM เดิมจาก Salesbear ถูกออกแบบมาสำหรับ **B2B** เป็นหลัก มีโครงสร้าง Company → Contact → Deal Pipeline ซึ่งไม่ตรงกับพฤติกรรมของผู้ใช้ Onebear ที่เป็น **Online Seller** ที่ขายตรงถึงลูกค้าบุคคล (B2C) เป็นส่วนใหญ่ และบางส่วนเป็น B2B ขนาดเล็ก

**ผลกระทบถ้าไม่แก้ไข:**
- แอดมินต้องเปิดหลายหน้าเพื่อดูข้อมูลลูกค้าที่ควรเห็นได้ในที่เดียว
- ไม่มีระบบ Segment อัตโนมัติ ทำให้พลาดโอกาสขายลูกค้า At-risk หรือ Hot
- ร้านค้าที่มีทีมขาย ไม่สามารถ Assign และติดตามลูกค้าได้อย่างมีระบบ
- Mobile UX แย่ — แอดมินที่ใช้มือถือเป็นหลักทำงานได้ช้าและผิดพลาดบ่อย
- ไม่รองรับกรณีลูกค้าองค์กรที่มีหลายคนติดต่อ ทำให้ยอดขายกระจัดกระจาย

---

# 🟩 Business

## 1. Feature: Customer Card Grid

ระบบแสดงรายชื่อลูกค้าในรูปแบบ **Card Grid** แทนตาราง เพื่อให้แอดมินสแกนข้อมูลสำคัญได้รวดเร็วโดยไม่ต้องเปิดหน้า Profile

- **Layout**: Desktop = 3 คอลัมน์, Tablet = 2 คอลัมน์, Mobile = 1 คอลัมน์ (Card แนวนอนเต็มจอ)
- **Default Sort**: กิจกรรมล่าสุด — ลูกค้าที่เพิ่งมีกิจกรรมขึ้นมาก่อนเสมอ
- **Loading**: ใช้ Skeleton Card ระหว่างโหลด ห้ามใช้ Spinner กลางหน้าจอ
- **Infinite Scroll**: โหลดการ์ดเพิ่มอัตโนมัติเมื่อเลื่อนถึงด้านล่าง ไม่มีปุ่ม "โหลดเพิ่ม"
- **Performance Target**: First Load < 1.5 วินาที

### 1.1 B2C Card (Individual)

- Avatar วงกลมแสดง Initials 2 ตัว สีพื้นหลัง Generate จากชื่อ (Deterministic)
- ชื่อลูกค้า + Channel Icons (LINE, Facebook, Instagram ฯลฯ)
- Segment Tags สูงสุด 2 อัน เรียงตาม Priority: **Hot > At-risk > VIP > Loyal > Cold > New**
  - Tag ที่ AI จัดให้มี Icon ดาวเล็กๆ กำกับ
  - Tag ที่แอดมินเพิ่มเองไม่มี Icon ดาว
- ข้อความล่าสุด (Preview 1 บรรทัด ตัดด้วย ellipsis)
- Stats: ยอดรวม LTV, จำนวนออเดอร์, AOV, วันที่ซื้อล่าสุด
- Banner สีส้มเมื่อลูกค้าเป็น At-risk: "ไม่ได้ซื้อมา X วัน"
- **Quick Actions** (ด้านล่างการ์ด):
  - ปุ่ม "แชท" → เปิด Inbox ของลูกค้าคนนั้น
  - ปุ่ม "ออเดอร์" → เปิดประวัติออเดอร์
  - ปุ่ม "Follow-up" → ถ้า At-risk ปุ่มเปลี่ยนสีแดง, ถ้า Hot ปุ่ม "แชทตอนนี้" เปลี่ยนสีเขียว
  - ขนาดปุ่มขั้นต่ำ 44×28px เพื่อรองรับการแตะบน Mobile

### 1.2 B2B Card (Organization)

- Avatar เป็น Rounded Square (ไม่ใช่วงกลม) แสดงตัวย่อบริษัท
- Badge "องค์กร" แสดงชัดเจน
- Avatar Stack ผู้ติดต่อ: แสดงสูงสุด 3 คน + "+N" ถ้าเกิน
  - Hover บน Avatar Stack (Desktop) แสดง Tooltip ชื่อผู้ติดต่อแต่ละคน
- ยอดรวม = Sum ออเดอร์ของผู้ติดต่อทุกคนในองค์กร คำนวณ Real-time
- **Quick Actions**:
  - ปุ่ม "แชท" → เปิด Inbox
  - ปุ่ม "ผู้ติดต่อ" → Bottom Sheet (Mobile) หรือ Dropdown (Desktop) แสดงรายชื่อทันที
  - ปุ่ม "ออเดอร์" → ประวัติออเดอร์รวมทั้งองค์กร

---

## 2. Feature: Filter, Search & Sort

### 2.1 Filter Chips

- Filter Chips แถวเดียวด้านบน Scroll แนวนอนบน Mobile ไม่ขึ้นบรรทัดใหม่
- ตัวเลือก: **ทั้งหมด / Hot / VIP / At-risk / ลูกค้าใหม่ / Cold / องค์กร**
- แต่ละ Chip แสดงจำนวนคน เช่น Hot (12)
- กดเลือกแล้วการ์ดอัปเดตทันที ไม่ต้องกด Apply (Single Select)
- หลาย Filter พร้อมกัน → เปิดผ่าน Advanced Filter (Dropdown)
- ถ้า Filter ไม่มีผลลัพธ์ → Empty State บอกสาเหตุ + ปุ่มล้าง Filter

### 2.2 Search

- Search Bar อยู่ด้านบนสุด Keyboard ขึ้นอัตโนมัติเมื่อกดบน Mobile
- ค้นได้จาก: ชื่อ, เบอร์โทร, อีเมล, ชื่อช่อง LINE/Facebook
- Real-time ขณะพิมพ์ (Debounce 300ms) ไม่ต้องกด Enter
- Highlight คำที่ตรงกันในผลการค้นหา
- ถ้าไม่พบ → แสดงปุ่ม **"+ เพิ่มลูกค้าใหม่ '[คำที่ค้นหา]'"** ทันที
- กด Escape หรือ X → ล้างการค้นหากลับสู่รายการปกติ

### 2.3 Sort

- Dropdown "เรียงตาม" ตัวเลือก:
  - กิจกรรมล่าสุด *(Default)*
  - ยอดรวมสูงสุด
  - ออเดอร์ล่าสุด
  - ชื่อ A–Z
  - ลูกค้าใหม่
- เปลี่ยน Sort แล้วการ์ด Re-order ทันทีโดยไม่ Reload หน้า

---

## 3. Feature: เพิ่มและแก้ไขลูกค้า

### 3.0 ช่องทางการเกิด Customer Record

ระบบสร้าง Customer Record ได้ **3 ช่องทาง** ดังนี้

| ช่องทาง | เงื่อนไขการสร้าง | สถานะเริ่มต้น |
|---|---|---|
| **1. แชทเข้ามา (Auto)** | ลูกค้าส่งข้อความครั้งแรกผ่านช่องทางใดก็ตาม | Contact ชั่วคราว — ยังไม่แสดงใน CRM |
| **2. มีออเดอร์เกิดขึ้น (Trigger)** | ออเดอร์ถูกสร้างและสถานะถึง **Pending Payment** ขึ้นไป | **ยืนยันเป็นลูกค้าจริง — แสดงใน CRM ทันที** |
| **3. แอดมินเพิ่มเอง (Manual)** | แอดมินกรอกฟอร์มเพิ่มลูกค้าด้วยตนเอง | แสดงใน CRM ทันที |

**Logic การเลื่อนสถานะจาก Contact → Customer:**

```
ลูกค้าส่งแชทเข้ามา
    → ระบบสร้าง Contact ชั่วคราว (ยังไม่แสดงใน CRM Card Grid)
    → AI หรือแอดมินสร้างออเดอร์
        → ออเดอร์ถึงสถานะ Pending Payment
            → Contact เลื่อนสถานะเป็น Customer
            → แสดงการ์ดใน CRM ทันที
            → Tag อัตโนมัติ = "New" + "Hot"
            → บันทึก First Order Date
```

**Rules:**
- Contact ที่ยังไม่มีออเดอร์ถึง Pending Payment **ไม่แสดงใน CRM Card Grid** — ไม่รบกวนมุมมองลูกค้าจริง
- ถ้าออเดอร์ถูก Cancel ก่อนชำระ → Customer Record ยังคงอยู่ แต่ Tag เปลี่ยนเป็น "Cold" ทันที
- ถ้าลูกค้าคนเดิมกลับมาแชทใหม่โดยไม่มีออเดอร์ → ไม่สร้าง Contact ซ้ำ ใช้ Record เดิม
- แอดมินสามารถ **Promote Contact → Customer** ด้วยตนเองได้ โดยไม่ต้องรอออเดอร์

### 3.1 เพิ่มลูกค้าใหม่ (Manual)

- ปุ่ม "+ เพิ่มลูกค้า" อยู่ด้านบนขวา เข้าถึงได้ตลอด
- บน Mobile: **FAB (Floating Action Button)** มุมขวาล่าง Smart Hide เมื่อ Scroll ลง
- เปิดเป็น Bottom Sheet (Mobile) หรือ Side Panel (Desktop) ไม่ใช่หน้าใหม่
- Field บังคับ: **ชื่อ** (1 Field เท่านั้น)
- Field Optional: เบอร์โทร, อีเมล, ช่องทาง, Customer Type
  - Customer Type Default = Individual
- กด Save → การ์ดใหม่ปรากฏใน Grid ทันที (**Optimistic UI**)
  - ถ้า API ไม่สำเร็จ → Roll back + Toast Error
- เวลากรอกข้อมูลขั้นต่ำ < 30 วินาที
- Keyboard บน Mobile ต้องไม่บัง Field ที่กำลังกรอก

### 3.2 Quick Edit จากการ์ด

- กดค้างที่การ์ด (Mobile) หรือ Right-click (Desktop) → เมนู Quick Edit
- Quick Edit มี: แก้ไขชื่อ, เพิ่ม Note, เปลี่ยน Tag
- บันทึกอัตโนมัติเมื่อออกจาก Field (Auto-save) ไม่ต้องกดปุ่ม Save
- การเปลี่ยนแปลงสะท้อนบนการ์ดทันที

### 3.3 Swipe Actions (Mobile)

- Swipe ซ้าย → ปุ่ม Follow-up และ แชท
- Swipe ขวา → Mark "ติดตามแล้ว" (Snooze 24 ชม.)
- Action ทำได้ใน 1 Swipe + 1 Tap เท่านั้น
- Haptic Feedback เมื่อ Swipe ถึงจุด Trigger (ถ้า Device รองรับ)

---

## 4. Feature: AI Auto Segment & Tagging

### 4.1 กฎการ Auto-tag

ระบบคำนวณและอัปเดต Tag อัตโนมัติทุกครั้งที่มีกิจกรรมใหม่

| Tag | เงื่อนไข |
|---|---|
| New | สร้าง Contact ใหม่ภายใน 7 วัน |
| Hot | มีกิจกรรมใน 48 ชม. หรือเปิด Payment Link แล้ว |
| VIP | ยอดซื้อรวม ≥ VIP Threshold (Default ฿5,000 ปรับได้) |
| At-risk | เคยซื้อ + ไม่มีกิจกรรมเกิน 30 วัน |
| Cold | ไม่มีกิจกรรมเกิน 60 วัน |
| Loyal | ซื้อซ้ำ ≥ 3 ครั้งต่อเนื่อง |
| องค์กร | CustomerType = Organization |

- ลูกค้า 1 รายมีได้หลาย Tag พร้อมกัน เช่น VIP + At-risk
- Tag แสดงบนการ์ดสูงสุด 2 อัน เรียงตาม Priority
- Tag ที่ AI จัดมี Icon ดาวกำกับ Hover Tooltip อธิบายเหตุผล เช่น "ซื้อซ้ำ 5 ครั้งใน 30 วัน"

### 4.2 แก้ไข Tag ด้วยตนเอง

- กด Tag บนการ์ดหรือ Profile → Popover แสดง Tag ทั้งหมด + ช่องพิมพ์เพิ่ม
- ลบ Tag ได้โดยกด X
- Tag Custom ที่แอดมินสร้างบันทึกเป็น Global ใช้ร่วมกันทั้งทีม
- ถ้าแอดมินลบ Tag ที่ AI ยังเห็นว่าควรมี → AI Suggest กลับมาหลัง 7 วัน

---

## 5. Feature: AI Churn Alert & Next Best Action

### 5.1 Churn Alert

- AI เปลี่ยน Tag VIP → At-risk อัตโนมัติเมื่อไม่มีกิจกรรมเกิน 30 วัน
- แจ้งเตือนใน KPI Snapshot: "ลูกค้า VIP X คนกำลังจะ Cold"
- Banner สีส้มบนการ์ดแสดงจำนวนวัน: "ไม่ได้ซื้อมา X วัน"
- ปุ่ม Follow-up บนการ์ดเปลี่ยนสีแดง (Urgent)
- ทำงาน Out-of-the-box ไม่ต้องตั้งค่าเพิ่ม

### 5.2 Next Best Action

- บนการ์ดลูกค้า At-risk หรือ Hot → AI แสดง Suggested Action 1 อย่าง
  - ตัวอย่าง: "ส่งโปรโมชัน", "Follow-up ออเดอร์ค้าง", "เสนอสินค้า X"
- Suggested Action เป็นปุ่มกดได้เลย ไม่ใช่แค่ข้อความ
- กด Suggested Action → เปิด Chat Draft พร้อมข้อความที่ AI เตรียมไว้
- **ผู้ใช้ต้อง Edit และยืนยันก่อนส่งเสมอ — ห้ามส่งอัตโนมัติ**

---

## 6. Feature: Organization Management (B2B)

### 6.1 สร้างองค์กรและผู้ติดต่อ

- เพิ่มลูกค้าใหม่ → เลือก Customer Type = Organization → กรอกชื่อบริษัท
- เพิ่มผู้ติดต่อใต้องค์กรได้ไม่จำกัด
- Link ลูกค้าที่มีอยู่แล้วเข้า Organization ได้ (Link Existing Contact)
- ลบผู้ติดต่อออกจาก Organization → โปรไฟล์ยังอยู่ เปลี่ยนเป็น Individual แทน
- ยอดรวมองค์กร = Sum ออเดอร์ของผู้ติดต่อทุกคน คำนวณ Real-time

### 6.2 AI Suggest Organization

- AI ตรวจจากชื่อ, อีเมล Domain, เบอร์โทร Prefix ที่คล้ายกัน
- ถ้า Confidence ≥ 80% → Banner บน Profile: "อาจอยู่บริษัทเดียวกับ [ชื่อ]"
- กด Banner → Modal: เลือกสร้าง Organization ใหม่ หรือ Link เข้า Organization ที่มีอยู่
- ปฏิเสธ → Banner หายถาวร ไม่แสดงซ้ำ

---

## 7. Feature: Customer Profile Page

เมื่อกดการ์ด → เปิดหน้า Profile เต็ม แบ่งเป็น **4 Tab**

### Tab 1 — ข้อมูลทั่วไป
- ข้อมูลโปรไฟล์ + Custom Fields ทั้งหมด
- ช่องทางที่เชื่อมต่อ
- Pinned Note (Pin ได้ 1 อัน ถ้าจะ Pin ใหม่ต้องยืนยันก่อน)
- AI Merge Suggestion Banner (ถ้ามี)
- สำหรับ Organization: รายชื่อผู้ติดต่อ + เพิ่ม/ลบได้

### Tab 2 — ประวัติออเดอร์
- รายการออเดอร์ทั้งหมดพร้อมสถานะ
- Summary: LTV, AOV, จำนวนออเดอร์ทั้งหมด
- ปุ่มสร้างออเดอร์ใหม่จากหน้านี้ได้เลย

### Tab 3 — ประวัติสนทนา
- Thread ทุกช่องทางของลูกค้ารายนี้
- Label แสดงว่า AI หรือ Admin ตอบ
- คลิก Thread → เปิด Inbox ไปยังบทสนทนานั้น

### Tab 4 — กิจกรรม (Activity Log)
- Timeline: แชท, ออเดอร์, ชำระเงิน, Follow-up, นัดหมาย
- Manual Note โดยแอดมิน
- กรองตามประเภทกิจกรรมได้

## 8. Feature: Bulk Follow-up

- แอดมินเลือกลูกค้าหลายรายพร้อมกันได้ผ่าน Checkbox บนการ์ด
- เมื่อเลือกแล้ว Action Bar ปรากฏด้านล่างหน้าจอ: "ติดตาม X คน"
- กดติดตาม → ระบบ Generate Follow-up Task แยกต่อลูกค้าแต่ละราย
  - แต่ละรายใช้ข้อความ Template เดียวกัน แต่ระบบส่งแยกกัน
  - ถ้า Follow-up Config เปิดอยู่ → ใช้ Channel และเวลาตาม Config ที่ตั้งไว้
  - ถ้ายังไม่มี Config → เปิด Bottom Sheet ให้เลือก Channel และข้อความก่อนส่ง
- ไม่มี Export CSV — ผู้ใช้ต้องทำงานในแพลตฟอร์มเท่านั้น

## 9. Feature: Duplicate Detection

- ระบบตรวจซ้ำแบบ Real-time ขณะแอดมินกรอกฟอร์มเพิ่มลูกค้า
- **ลำดับการ Validate:**
  1. **Tax ID** (เลขนิติบุคคล) — ตรวจก่อนเป็นอันดับแรกสำหรับ Organization
  2. **เลขบัตรประชาชน** — ตรวจก่อนเป็นอันดับแรกสำหรับ Individual
  3. **เบอร์โทรศัพท์** — Fallback ถ้าไม่มี ID
  4. **ชื่อ (Fuzzy Match)** — Fallback สุดท้าย
- พบซ้ำ → แสดง Warning Banner ในฟอร์มทันที: "พบลูกค้าที่อาจเป็นคนเดียวกัน — [ชื่อ]"
- แอดมินเลือกได้: ดูโปรไฟล์ที่พบ / ยังคงเพิ่มใหม่ต่อ (Override)

## 10. Feature: Pinned Note

- Note เป็น **Internal** — ทุกคนในทีมเห็นเหมือนกัน (Shared across team)
- ลูกค้าไม่เห็น Note นี้ในทุกกรณี
- แสดงด้านบนสุดของหน้า Profile และเป็น Tooltip บนการ์ด
- Pin ได้ 1 Note ต่อลูกค้า — ถ้าจะ Pin ใหม่ต้องยืนยันก่อน (แจ้งว่าจะแทนที่ Note เดิม)

| # | คำถาม / ประเด็น | สถานะ | การตัดสินใจ |
|---|---|---|---|
| 1 | **Bulk Action** | ✅ ตัดสินใจแล้ว | เลือกหลายคนด้วย Checkbox แล้วกด "ติดตาม" พร้อมกันได้ — หลังบ้าน Generate Follow-up แยกต่อลูกค้าแต่ละราย ไม่ใช่ Batch เดียว |
| 2 | **Export CSV** | ✅ ตัดสินใจแล้ว | ไม่มี Export — ต้องการให้ผู้ใช้ใช้งานในแพลตฟอร์มเท่านั้น |
| 3 | **Duplicate Detection** | ✅ ตัดสินใจแล้ว | เตือนทันทีเมื่อกรอกข้อมูล — Validate จาก Tax ID หรือเลขบัตรประชาชนก่อนเป็นอันดับแรก ถ้าไม่มีค่อย Fallback ไปเช็คชื่อ + เบอร์โทร |
| 4 | **Pinned Note Visibility** | ✅ ตัดสินใจแล้ว | Note เป็น Internal — ทุกคนในทีมเห็นเหมือนกัน (Shared) ลูกค้าไม่เห็น |
| 5 | **AI Next Best Action** | ✅ ตัดสินใจแล้ว | ใช้ข้อมูลเฉพาะร้านค้านั้นเท่านั้น — ไม่ Benchmark ข้ามร้าน |
| 6 | **VIP Threshold Settings** | 📌 เพิ่มใน Settings Story | Super Admin กำหนดได้ (Default ฿5,000), นับจาก Paid Orders เท่านั้น, เปลี่ยนค่าแล้ว Re-calculate ทันที |

---

# 🟦 Acceptance Criteria

## Feature 1: Customer Card Grid

- [ ] หน้า Customer โหลดเสร็จและแสดงการ์ดได้ภายใน 1.5 วินาที (p95)
- [ ] Desktop แสดง 3 คอลัมน์, Mobile แสดง 1 คอลัมน์
- [ ] Default Sort = กิจกรรมล่าสุด
- [ ] Infinite Scroll โหลดเพิ่มอัตโนมัติ ไม่มีปุ่ม "โหลดเพิ่ม"
- [ ] Skeleton Card แสดงระหว่างโหลด ไม่มี Spinner กลางหน้า
- [ ] การ์ดกดได้ทั้งใบเพื่อเปิด Profile
- [ ] B2C Card แสดง: Avatar, ชื่อ, Channel Icons, Tags, ข้อความล่าสุด, LTV, ออเดอร์, AOV, ซื้อล่าสุด, Quick Actions
- [ ] B2B Card แสดง: Logo/Initials (Rounded Square), Badge องค์กร, Avatar Stack, ยอดรวม, Quick Actions
- [ ] Avatar Stack แสดงสูงสุด 3 คน + "+N"
- [ ] Tooltip ชื่อผู้ติดต่อเมื่อ Hover บน Avatar Stack (Desktop)
- [ ] Banner สีส้มแสดงบนการ์ด At-risk "ไม่ได้ซื้อมา X วัน"
- [ ] ปุ่ม Follow-up ของลูกค้า At-risk แสดงสีแดง
- [ ] ปุ่ม "แชทตอนนี้" ของลูกค้า Hot แสดงสีเขียว
- [ ] ขนาดปุ่ม Quick Action ≥ 44×28px

## Feature 2: Filter, Search & Sort

- [ ] Filter Chips แสดงครบ: ทั้งหมด / Hot / VIP / At-risk / ลูกค้าใหม่ / Cold / องค์กร
- [ ] แต่ละ Chip แสดงจำนวนคน
- [ ] กดเลือก Filter แล้วการ์ดอัปเดตทันที ไม่ต้องกด Apply
- [ ] Filter Chips Scroll แนวนอนบน Mobile
- [ ] Filter ไม่มีผลลัพธ์ → Empty State + ปุ่มล้าง Filter
- [ ] Search Real-time Debounce 300ms ไม่ต้องกด Enter
- [ ] Search ค้นได้จาก: ชื่อ, เบอร์โทร, อีเมล, ชื่อช่อง
- [ ] ผลค้นหา Highlight คำที่ตรงกัน
- [ ] ไม่พบผล → แสดงปุ่ม "+ เพิ่มลูกค้าใหม่ '[คำค้นหา]'"
- [ ] Sort เปลี่ยนแล้วการ์ด Re-order ทันที ไม่ Reload หน้า

## Feature 3: เพิ่มและแก้ไขลูกค้า

### ช่องทางการเกิด Customer Record
- [ ] Contact ที่เกิดจากแชทเข้ามา **ไม่แสดงใน CRM Card Grid** จนกว่าออเดอร์จะถึงสถานะ Pending Payment
- [ ] เมื่อออเดอร์ถึง Pending Payment → Customer Record สร้างและแสดงการ์ดใน CRM ทันที
- [ ] Tag อัตโนมัติเมื่อเพิ่งกลายเป็น Customer = "New" + "Hot"
- [ ] First Order Date บันทึกจากออเดอร์แรกที่ถึง Pending Payment
- [ ] ออเดอร์ Cancel ก่อนชำระ → Customer Record ยังอยู่ Tag เปลี่ยนเป็น "Cold"
- [ ] ลูกค้าแชทซ้ำโดยไม่มีออเดอร์ → ใช้ Contact Record เดิม ไม่สร้างซ้ำ
- [ ] แอดมิน Promote Contact → Customer ด้วยตนเองได้โดยไม่ต้องรอออเดอร์

### เพิ่มและแก้ไข (Manual + UI)
- [ ] FAB ปรากฏมุมขวาล่างบน Mobile และซ่อนเมื่อ Scroll ลง
- [ ] ฟอร์มเปิดเป็น Bottom Sheet (Mobile) หรือ Side Panel (Desktop)
- [ ] Field บังคับมีเพียง "ชื่อ" เท่านั้น
- [ ] Customer Type Default = Individual
- [ ] กด Save → การ์ดใหม่ปรากฏทันที (Optimistic UI)
- [ ] API ไม่สำเร็จ → Roll back + Toast Error
- [ ] Quick Edit ผ่าน Long Press (Mobile) หรือ Right-click (Desktop)
- [ ] Auto-save เมื่อออกจาก Field ไม่ต้องกด Save
- [ ] Swipe ซ้ายบน Mobile → ปุ่ม Follow-up และ แชท
- [ ] Swipe ขวาบน Mobile → Mark "ติดตามแล้ว" (Snooze 24 ชม.)

## Feature 4: AI Auto Segment

- [ ] Tag อัปเดตอัตโนมัติทุกครั้งที่มีกิจกรรมใหม่
- [ ] Tag AI มี Icon ดาวกำกับ
- [ ] Tag แอดมินเพิ่มเองไม่มี Icon ดาว
- [ ] Hover บน Tag แสดง Tooltip อธิบายเหตุผล (Desktop)
- [ ] แก้ไข Tag ผ่าน Popover บนการ์ดหรือ Profile
- [ ] Tag Custom บันทึกเป็น Global ทั้งทีม
- [ ] AI Suggest Tag กลับมาหลัง 7 วันถ้าแอดมินลบ Tag ที่ AI ยังเห็นว่าควรมี

## Feature 5: AI Churn Alert & Next Best Action

- [ ] AI เปลี่ยน VIP → At-risk อัตโนมัติเมื่อไม่มีกิจกรรมเกิน 30 วัน
- [ ] KPI Snapshot แจ้งเตือน "ลูกค้า VIP X คนกำลังจะ Cold"
- [ ] ปุ่ม Follow-up บนการ์ด At-risk เปลี่ยนสีแดง
- [ ] กด Follow-up → Pre-fill ข้อความที่เหมาะกับ At-risk
- [ ] Suggested Action แสดงบนการ์ด Hot และ At-risk
- [ ] กด Suggested Action → เปิด Chat Draft พร้อมข้อความ
- [ ] ผู้ใช้ต้องยืนยันก่อนส่งเสมอ ห้ามส่งอัตโนมัติ

## Feature 6: Organization Management

- [ ] สร้าง Organization ได้จากฟอร์มเพิ่มลูกค้า (Customer Type = Organization)
- [ ] เพิ่มผู้ติดต่อใต้องค์กรได้ไม่จำกัด
- [ ] Link ลูกค้าที่มีอยู่แล้วเข้า Organization ได้
- [ ] ลบผู้ติดต่อออกจากองค์กร → เปลี่ยนเป็น Individual ไม่ถูกลบออกจากระบบ
- [ ] ยอดรวมองค์กรคำนวณ Real-time จากผู้ติดต่อทุกคน
- [ ] AI Suggest Organization เมื่อ Confidence ≥ 80%
- [ ] ปฏิเสธ Suggestion → ไม่แสดงซ้ำ

## Error States & Edge Cases

- [ ] ไม่มีลูกค้าเลย → Empty State + ปุ่ม "เพิ่มลูกค้าคนแรก"
- [ ] ลูกค้าไม่มีรูป → Initials 2 ตัวบน Background สีจากชื่อ
- [ ] ลูกค้าไม่มีออเดอร์ → แสดง "ยังไม่มีออเดอร์" แทนยอดเงิน
- [ ] โหลดไม่สำเร็จ → Error Toast + ปุ่มลองใหม่

## Feature 8: Bulk Follow-up
- [ ] Checkbox แสดงบนการ์ดเมื่ออยู่ใน Selection Mode
- [ ] Action Bar ปรากฏด้านล่างเมื่อเลือกลูกค้าอย่างน้อย 1 คน แสดง "ติดตาม X คน"
- [ ] กดติดตาม → Generate Follow-up แยกต่อลูกค้าแต่ละรายในหลังบ้าน
- [ ] ถ้า Follow-up Config ยังไม่ได้ตั้งค่า → เปิด Bottom Sheet ให้เลือก Channel + ข้อความก่อน
- [ ] ไม่มีปุ่ม Export CSV ในหน้า CRM

## Feature 9: Duplicate Detection
- [ ] ตรวจซ้ำ Real-time ขณะกรอกฟอร์ม — ไม่ต้องกด Save ก่อน
- [ ] ลำดับ Validate: Tax ID / เลขบัตรประชาชน → เบอร์โทร → ชื่อ (Fuzzy)
- [ ] พบซ้ำ → Warning Banner ในฟอร์มทันที พร้อมชื่อลูกค้าที่อาจซ้ำ
- [ ] แอดมินเลือกได้: ดูโปรไฟล์เดิม หรือ Override เพิ่มใหม่ต่อ
- [ ] ถ้า Override → บันทึก Log ว่าแอดมินคนใดเพิ่มซ้ำ เมื่อไหร่

## Feature 10: Pinned Note
- [ ] Note เป็น Shared Internal — ทุกคนในทีมเห็นเหมือนกัน
- [ ] ลูกค้าไม่เห็น Note ในทุกกรณี
- [ ] แสดงด้านบนสุดของหน้า Profile
- [ ] แสดงเป็น Tooltip Icon บนการ์ด
- [ ] Pin ได้ 1 Note ต่อลูกค้า — ถ้าจะ Pin ใหม่แจ้งว่าจะแทนที่ Note เดิม

## Feature 5: AI Next Best Action *(อัปเดต)*
- [ ] AI ใช้ข้อมูลเฉพาะร้านค้านั้น — ประวัติออเดอร์, พฤติกรรมแชท, Segment
- [ ] ไม่ใช้ข้อมูลข้ามร้านค้าอื่น

- [ ] Figma Design ครบทุก State (Default, Loading, Empty, Error, Mobile, Desktop)
- [ ] Responsive ทั้ง Mobile 375px และ Desktop 1280px
- [ ] Accessibility — ทุก Interactive Element มี ARIA Label
- [ ] Performance — First Load < 1.5s, Filter/Sort < 300ms
- [ ] ทดสอบกับผู้ใช้จริง 3 คนก่อน Dev
