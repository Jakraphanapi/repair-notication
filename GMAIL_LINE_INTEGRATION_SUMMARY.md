# การปรับปรุงระบบให้เก็บ LINE UID เมื่อลงทะเบียนด้วย Gmail โดยตรง

## สรุปการเปลี่ยนแปลง

ระบบได้รับการปรับปรุงให้สามารถเก็บ LINE UID ได้แม้เมื่อผู้ใช้ลงทะเบียนด้วย Gmail โดยตรง โดยใช้ LIFF เพื่อดึงข้อมูล LINE UID และเก็บไว้ใน localStorage/sessionStorage

## ไฟล์ที่ปรับปรุง

### 1. `src/lib/auth.ts`
- เพิ่มการดึง LINE UID จาก sessionStorage และ localStorage
- ปรับปรุง Google OAuth callback ให้เก็บ LINE UID อัตโนมัติ
- เพิ่ม logging สำหรับการเชื่อมต่อ LINE UID

### 2. `src/lib/auth-utils.ts`
- เพิ่มฟังก์ชัน `storeLineUidInLocalStorage()` และ `retrieveLineUidFromLocalStorage()`
- เพิ่มฟังก์ชัน `clearLineUidFromLocalStorage()`
- ปรับปรุงฟังก์ชันเดิมให้มี logging

### 3. `src/app/auth/signin/page.tsx`
- เพิ่มการตรวจสอบ LIFF และ LINE UID
- เก็บ LINE UID ใน localStorage เมื่อพบใน LIFF
- ปรับปรุง Google sign-in ให้ส่ง LINE UID ไปยัง complete-registration

### 4. `src/app/auth/register/page.tsx` (ไฟล์ใหม่)
- หน้าลงทะเบียนด้วย Gmail ที่รองรับ LINE UID
- แสดงสถานะการเชื่อมต่อ LINE
- UI ที่เหมาะสำหรับการใช้งานใน LINE App

## การทำงานของระบบ

### กรณีที่ 1: ลงทะเบียนด้วย Gmail ใน LINE App (มี LIFF)
1. ผู้ใช้เปิดหน้า `/auth/register` ใน LINE App
2. LIFF เริ่มต้นและดึง LINE UID อัตโนมัติ
3. ระบบเก็บ LINE UID ใน localStorage
4. ผู้ใช้คลิก "ลงทะเบียนด้วย Gmail"
5. Google OAuth ทำงานและส่งไปยัง complete-registration
6. ระบบเชื่อมต่อ LINE UID กับ Google account อัตโนมัติ

### กรณีที่ 2: ลงทะเบียนด้วย Gmail ใน LINE App (ไม่มี LIFF)
1. ผู้ใช้เปิดหน้า `/auth/register` ใน LINE App
2. LIFF ไม่พร้อมใช้งานหรือไม่สามารถดึง LINE UID ได้
3. แสดงปุ่ม "เข้าสู่ระบบ LINE ก่อน"
4. หลังจาก login LINE แล้วจะได้ LINE UID
5. ระบบเก็บ LINE UID และดำเนินการลงทะเบียนต่อ

### กรณีที่ 3: ลงทะเบียนด้วย Gmail ใน Browser ธรรมดา
1. ผู้ใช้เปิดหน้า `/auth/signin` ใน Browser
2. ไม่มี LIFF หรือ LINE UID
3. ลงทะเบียนด้วย Gmail โดยไม่มี LINE UID
4. สามารถเชื่อมต่อ LINE UID ภายหลังผ่าน `/auth/link-line`

## Database Schema

```sql
-- ตาราง User
model User {
  id            String         @id @default(cuid())
  name          String?
  email         String         @unique
  lineUserId    String?        @unique  -- LINE UID
  role          UserRole       @default(USER)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

-- ตาราง Account (สำหรับ Google UID)
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String  -- Google UID
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}
```

## การใช้งาน

### สำหรับผู้ใช้ที่เข้าผ่าน LINE App
1. เปิดลิงก์ LIFF หรือหน้า `/auth/register`
2. ระบบตรวจสอบและดึง LINE UID อัตโนมัติ
3. คลิก "ลงทะเบียนด้วย Gmail"
4. Google OAuth → เชื่อมต่อ LINE UID อัตโนมัติ
5. รับการแจ้งเตือนผ่าน LINE ได้ทันที

### สำหรับผู้ใช้ที่เข้าผ่าน Browser
1. เปิดหน้า `/auth/signin`
2. คลิก "ลงทะเบียนด้วย Gmail"
3. Google OAuth → สร้าง account โดยไม่มี LINE UID
4. สามารถเชื่อมต่อ LINE UID ภายหลังผ่าน `/auth/link-line`

## API Endpoints

### `/api/user/link-line`
เชื่อมต่อ LINE UID กับ user account ที่มีอยู่

### `/api/auth/google-callback`
จัดการการเชื่อมต่อ LINE UID หลัง Google OAuth

## การทดสอบ

1. **ทดสอบใน LINE App:**
   - เปิดหน้า `/auth/register` ใน LINE App
   - ตรวจสอบการดึง LINE UID จาก LIFF
   - ทดสอบการลงทะเบียนด้วย Gmail

2. **ทดสอบใน Browser:**
   - เปิดหน้า `/auth/signin` ใน Browser
   - ทดสอบการลงทะเบียนด้วย Gmail โดยไม่มี LINE UID
   - ทดสอบการเชื่อมต่อ LINE UID ภายหลัง

3. **ทดสอบการแจ้งเตือน:**
   - สร้าง repair ticket
   - ตรวจสอบการส่งการแจ้งเตือนผ่าน LINE UID

## ข้อดีของระบบใหม่

1. **รองรับทุกกรณี:** ทำงานได้ทั้งใน LINE App และ Browser
2. **เก็บ LINE UID อัตโนมัติ:** ไม่ต้องเชื่อมต่อภายหลัง
3. **UX ที่ดี:** แสดงสถานะการเชื่อมต่อ LINE ชัดเจน
4. **Fallback Mechanisms:** มีทางเลือกเมื่อ LIFF ไม่พร้อมใช้งาน
5. **Logging:** มีการ log การทำงานเพื่อ debug

## หมายเหตุ

- ระบบใช้ localStorage เพื่อเก็บ LINE UID ระหว่าง sessions
- มีการตรวจสอบรูปแบบ LINE UID ก่อนเก็บ
- รองรับการทำงานแบบ offline และ online
- มี error handling ที่ครอบคลุม
