# การปรับปรุงระบบเก็บ LINE UID สำหรับทุกการ Login

## สรุปการเปลี่ยนแปลง

ระบบได้รับการปรับปรุงให้เก็บ LINE UID ไม่ว่าจะ login ด้วย Gmail หรือ LINE โดยอัตโนมัติ

## ไฟล์ที่ปรับปรุง

### 1. `src/lib/auth.ts`
- เพิ่มการตรวจสอบและเก็บ LINE UID จาก profile หรือ user data ใน Google OAuth callback
- ปรับปรุงการสร้างและอัปเดต user record ให้รวม LINE UID

### 2. `src/lib/auth-utils.ts` (ไฟล์ใหม่)
- ฟังก์ชันช่วยเหลือสำหรับการจัดการ LINE UID
- `extractLineUidFromUrl()` - ดึง LINE UID จาก URL parameters
- `extractLineUidFromRequest()` - ดึง LINE UID จาก request headers
- `createGoogleOAuthUrlWithLineUid()` - สร้าง Google OAuth URL พร้อม LINE UID
- `isValidLineUid()` - ตรวจสอบรูปแบบ LINE UID
- `storeLineUidInSession()` - เก็บ LINE UID ใน session storage
- `retrieveLineUidFromSession()` - ดึงและลบ LINE UID จาก session storage

### 3. `src/app/auth/signin/page.tsx`
- เพิ่มการตรวจสอบ LINE UID จาก URL parameters
- เก็บ LINE UID ใน session storage เมื่อพบใน URL

### 4. `src/app/line/page.tsx`
- ปรับปรุงฟังก์ชัน `handleRegister()` ให้ส่ง LINE UID ไปยัง Google OAuth
- ใช้ URL parameters เพื่อส่ง LINE UID ไปยัง Google OAuth

### 5. `src/app/line/complete-registration/page.tsx`
- เพิ่มการดึง LINE UID จาก session storage เป็น fallback
- รองรับการทำงานทั้งจาก URL parameters และ session storage

### 6. `src/app/api/auth/google-callback/route.ts` (ไฟล์ใหม่)
- API endpoint สำหรับการเชื่อมต่อ LINE UID กับ Google account
- จัดการการอัปเดต user record เมื่อมี LINE UID

## การทำงานของระบบ

### กรณีที่ 1: Login ด้วย Google โดยตรง
1. ผู้ใช้เข้าสู่ระบบด้วย Google OAuth
2. ระบบสร้าง user record พร้อม Google UID ในตาราง Account
3. หากมี LINE UID ใน profile หรือ user data จะเก็บไว้ในตาราง User

### กรณีที่ 2: Login ผ่าน LINE LIFF แล้วไป Google OAuth
1. ผู้ใช้เปิด LIFF และได้ LINE UID
2. คลิกปุ่มลงทะเบียนด้วย Google
3. ระบบส่ง LINE UID ไปยัง Google OAuth ผ่าน URL parameters
4. Google OAuth callback จะเก็บ LINE UID ใน session storage
5. หลัง login สำเร็จ ระบบจะเชื่อมต่อ LINE UID กับ Google account อัตโนมัติ

### กรณีที่ 3: Login ด้วย LINE โดยตรง
1. ผู้ใช้เข้าสู่ระบบด้วย LINE credentials
2. ระบบสร้าง user record พร้อม LINE UID ในตาราง User
3. หากมี email จาก LINE profile จะเก็บไว้ด้วย

## Database Schema

```sql
-- ตาราง User
model User {
  id            String         @id @default(cuid())
  name          String?
  email         String         @unique
  lineUserId    String?        @unique  -- LINE UID
  googleId      String?        @unique  -- Google User ID (deprecated)
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
  providerAccountId String  -- Google UID เก็บตรงนี้
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}
```

## การใช้งาน

### สำหรับผู้ใช้ที่เข้าผ่าน LINE LIFF
1. เปิดลิงก์ LIFF → หน้า `/line`
2. ระบบตรวจสอบ LINE UID ในฐานข้อมูล
3. หากยังไม่มี: แสดงปุ่มลงทะเบียนด้วย Google
4. คลิกปุ่ม → Google OAuth พร้อม LINE UID
5. หลัง OAuth สำเร็จ → เชื่อมต่อ LINE UID อัตโนมัติ

### สำหรับผู้ใช้ที่เข้าผ่าน Google โดยตรง
1. เข้าสู่ระบบด้วย Google OAuth
2. ระบบสร้าง user record พร้อม Google UID
3. หากต้องการเชื่อมต่อ LINE สามารถใช้หน้า `/auth/link-line`

## API Endpoints

### `/api/user/check-line`
ตรวจสอบว่ามี LINE UID ในระบบหรือไม่

### `/api/user/link-line`
เชื่อมต่อ LINE UID กับ user account

### `/api/auth/google-callback`
จัดการการเชื่อมต่อ LINE UID หลัง Google OAuth

## การทดสอบ

1. ทดสอบการ login ด้วย Google โดยตรง
2. ทดสอบการ login ผ่าน LINE LIFF แล้วไป Google OAuth
3. ทดสอบการ login ด้วย LINE โดยตรง
4. ทดสอบการส่งการแจ้งเตือนผ่าน LINE UID

## หมายเหตุ

- ระบบรองรับการทำงานแบบ hybrid (Google + LINE)
- LINE UID จะถูกเก็บในทุกกรณีที่สามารถดึงได้
- การแจ้งเตือนจะทำงานผ่าน LINE UID ที่เก็บไว้
- ระบบมี fallback mechanisms สำหรับกรณีที่ LINE UID ไม่พร้อมใช้งาน
