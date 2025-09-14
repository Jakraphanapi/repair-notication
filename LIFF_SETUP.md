# การตั้งค่า LINE LIFF (LINE Front-end Framework)

## ภาพรวม
LINE LIFF ช่วยให้เราสามารถดึงข้อมูล LINE UID และโปรไฟล์ของผู้ใช้ได้โดยตรง เมื่อผู้ใช้เปิดเว็บแอปผ่าน LINE

## ขั้นตอนการตั้งค่า

### 1. สร้าง LINE Developers Account
1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. ล็อกอินด้วยบัญชี LINE ของคุณ
3. สร้าง Provider ใหม่หรือเลือก Provider ที่มีอยู่

### 2. สร้าง LINE Login Channel
1. ในหน้า Provider คลิก "Create a new channel"
2. เลือก "LINE Login"
3. กรอกข้อมูลช่อง:
   - Channel name: ชื่อระบบแจ้งซ่อม
   - Channel description: อธิบายระบบ
   - App types: เลือก Web app

### 3. ตั้งค่า Channel
1. ในหน้า Channel Settings:
   - คัดลอก Channel ID และ Channel Secret
   - เพิ่ม Callback URLs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://yourdomain.com/api/auth/callback/google
     ```

### 4. สร้าง LIFF App
1. ในหน้า Channel คลิกแท็บ "LIFF"
2. คลิก "Add"
3. กรอกข้อมูล LIFF:
   - LIFF app name: ชื่อแอป
   - Size: Full (เพื่อให้ใช้พื้นที่เต็มหน้าจอ)
   - Endpoint URL: 
     ```
     http://localhost:3000/auth/signin
     https://yourdomain.com/auth/signin
     ```
   - Scope: 
     - `profile` (ข้อมูลโปรไฟล์)
     - `openid` (สำหรับ ID Token)
     - `email` (ถ้าต้องการอีเมล - อาจไม่มีในบางกรณี)

### 5. คัดลอก LIFF ID
1. หลังจากสร้าง LIFF App แล้ว คัดลอก LIFF ID
2. LIFF ID จะมีรูปแบบเช่น: `1234567890-abcdefgh`

### 6. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` และเพิ่ม:

```bash
# LINE LIFF Configuration
NEXT_PUBLIC_LINE_LIFF_ID="1234567890-abcdefgh"

# LINE Channel Configuration (สำหรับ Backend API)
LINE_CHANNEL_ACCESS_TOKEN="your-channel-access-token"
LINE_CHANNEL_SECRET="your-channel-secret"
```

### 7. การใช้งาน

#### ในเว็บบราวเซอร์ทั่วไป:
- ผู้ใช้จะเห็นปุ่ม Google Sign-in เท่านั้น

#### ในแอป LINE (LIFF):
- ผู้ใช้จะเห็นทั้งปุ่ม Google และ LINE Sign-in
- เมื่อคลิก LINE Sign-in ระบบจะดึง LINE UID และข้อมูลโปรไฟล์อัตโนมัติ

### 8. การทดสอบ

#### ทดสอบใน LINE App:
1. เปิด LINE บนมือถือ
2. ไปที่หน้าแชทกับตัวเอง หรือส่งลิงก์ให้เพื่อน
3. ส่งลิงก์: `https://liff.line.me/YOUR_LIFF_ID`
4. แอปควรเปิดขึ้นมาใน LINE และแสดงปุ่ม LINE Sign-in

#### ทดสอบในเว็บบราวเซอร์:
1. เปิด `http://localhost:3000/auth/signin`
2. ควรเห็นปุ่ม Google Sign-in เท่านั้น

### 9. การดีบัก

#### ตรวจสอบ Console:
- เปิด Developer Tools ใน LINE หรือเว็บบราวเซอร์
- ดู Console สำหรับ error messages

#### ข้อผิดพลาดที่พบบ่อย:
1. **LIFF ID ไม่ถูกต้อง**: ตรวจสอบใน .env.local
2. **Endpoint URL ไม่ตรง**: ต้องตรงกับ URL ที่ตั้งไว้ใน LIFF App
3. **Scope ไม่ถูกต้อง**: ต้องมี profile และ openid
4. **CORS Error**: ตรวจสอบ domain ที่อนุญาตใน Channel Settings

### 10. URL สำหรับแชร์

สร้าง QR Code หรือลิงก์สำหรับแชร์:
```
https://liff.line.me/YOUR_LIFF_ID
```

ผู้ใช้สามารถเปิดลิงก์นี้ใน LINE แล้วใช้งานระบบแจ้งซ่อมผ่าน LINE UID ได้ทันที

## ข้อดีของการใช้ LIFF + Google Auth

1. **ความยืดหยุ่น**: ผู้ใช้สามารถเลือกเข้าสู่ระบบด้วย Google หรือ LINE
2. **UX ที่ดี**: ในแอป LINE ไม่ต้องพิมพ์รหัสผ่าน
3. **การระบุตัวตนที่แม่นยำ**: LINE UID ไม่เปลี่ยนแปลง
4. **การแจ้งเตือน**: สามารถส่งการแจ้งเตือนผ่าน LINE ได้ทันที

## การบำรุงรักษา

- ตรวจสอบ LIFF App สถานะเป็นประจำ
- อัปเดต Endpoint URL เมื่อเปลี่ยน domain
- ตรวจสอบ Access Token หมดอายุ