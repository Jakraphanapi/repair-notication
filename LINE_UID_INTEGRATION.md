# การเชื่อมต่อ LINE UID สำหรับการแจ้งเตือน

## ภาพรวมระบบ

ระบบนี้รองรับการเข้าสู่ระบบแบบ Hybrid:
1. **Google Authentication**: สำหรับการยืนยันตัวตนหลัก
2. **LINE UID Linking**: สำหรับการส่งการแจ้งเตือนแบบส่วนบุคคล

## วิธีการทำงาน

### 1. การเข้าสู่ระบบด้วย Google
- ผู้ใช้เข้าสู่ระบบผ่าน Google OAuth
- ระบบสร้าง account และ session
- Redirect ไปหน้าเชื่อมต่อ LINE UID

### 2. การเชื่อมต่อ LINE UID
- หน้า `/auth/link-line` จะแสดงหลังจากเข้าสู่ระบบ Google สำเร็จ
- ถ้าเปิดในเว็บบราวเซอร์: แสดงข้อความให้เปิดใน LINE App
- ถ้าเปิดใน LINE App (LIFF): แสดงปุ่มเชื่อมต่อ LINE UID

### 3. การส่งการแจ้งเตือน
- เมื่อมีการแจ้งซ่อมผ่าน Google Forms
- ระบบจะตรวจสอบว่าผู้ใช้มี LINE UID หรือไม่
- ถ้ามี: ส่งการแจ้งเตือนผ่าน LINE Push Message API

## โครงสร้างฐานข้อมูล

### User Table
```sql
model User {
  id            String         @id @default(cuid())
  name          String?
  email         String         @unique
  lineUserId    String?        @unique  -- LINE UID สำหรับการแจ้งเตือน
  googleId      String?        @unique  -- Google User ID
  role          UserRole       @default(USER)
  ...
}
```

## การใช้งาน

### สำหรับผู้ใช้ที่เข้าสู่ระบบด้วย Google

1. เข้าสู่ระบบด้วย Google ที่ `/auth/signin`
2. ระบบจะพาไปหน้า `/auth/link-line`
3. เปิดลิงก์ LIFF ใน LINE App เพื่อเชื่อมต่อ LINE UID
4. หลังจากเชื่อมต่อสำเร็จ จะได้รับการแจ้งเตือนผ่าน LINE

### สำหรับการแจ้งซ่อมผ่าน Google Forms

1. ผู้ใช้กรอก Google Form
2. Webhook ส่งข้อมูลมายัง `/api/webhooks/google-forms`
3. ระบบสร้าง repair ticket
4. ถ้าผู้ใช้มี LINE UID ลิงก์ไว้: ส่งการแจ้งเตือนผ่าน LINE

## API Endpoints

### `/api/user/link-line`

#### POST - เชื่อมต่อ LINE UID
```typescript
{
  "lineUid": "U1234567890abcdef...",
  "displayName": "ชื่อผู้ใช้",
  "pictureUrl": "https://profile.line-scdn.net/..."
}
```

#### GET - ตรวจสอบสถานะการเชื่อมต่อ
```typescript
{
  "user": {
    "id": "user_id",
    "lineUserId": "U1234567890abcdef...",
    "name": "ชื่อผู้ใช้",
    "email": "user@example.com"
  },
  "isLinked": true
}
```

#### DELETE - ยกเลิกการเชื่อมต่อ LINE UID
```typescript
{
  "success": true,
  "message": "ยกเลิกการเชื่อมต่อ LINE UID สำเร็จ"
}
```

## LINE Push Message API

### ส่งการแจ้งเตือนส่วนบุคคล
```typescript
import { sendRepairTicketNotification } from '@/lib/line-notifications';

await sendRepairTicketNotification(lineUserId, {
  ticketNumber: 'TK000001',
  title: 'เมาส์เสีย',
  status: 'PENDING',
  description: 'เมาส์ไม่สามารถคลิกได้',
  priority: 'MEDIUM'
});
```

## การตั้งค่า Environment Variables

```bash
# LINE Channel Configuration
LINE_CHANNEL_ACCESS_TOKEN="your-channel-access-token"
LINE_CHANNEL_SECRET="your-channel-secret"

# LIFF Configuration
NEXT_PUBLIC_LINE_LIFF_ID="1234567890-abcdefgh"

# LINE Group/Channel for admin notifications (optional)
LINE_GROUP_ID="C1234567890abcdef..."
```

## ตัวอย่างข้อความแจ้งเตือน

### การแจ้งซ่อมใหม่
```
⏳ แจ้งเตือนสถานะการซ่อม

📋 หมายเลข: TK000001
🏷️ หัวข้อ: เมาส์เสีย
📊 สถานะ: PENDING
🟡 ความสำคัญ: MEDIUM
📝 รายละเอียด: เมาส์ไม่สามารถคลิกได้

🕐 เวลา: 14/9/2567 10:30:00
```

### อัปเดตสถานะ
```
🔧 แจ้งเตือนสถานะการซ่อม

📋 หมายเลข: TK000001
🏷️ หัวข้อ: เมาส์เสีย
📊 สถานะ: IN_PROGRESS
🟡 ความสำคัญ: MEDIUM

🕐 เวลา: 14/9/2567 11:00:00
```

## ความปลอดภัย

### การตรวจสอบ LINE UID
- ตรวจสอบรูปแบบ LINE UID: `U[0-9a-f]{32}`
- ป้องกันการลิงก์ LINE UID เดียวกันกับหลายบัญชี
- เข้ารหัสการสื่อสารกับ LINE API ผ่าน HTTPS

### การจัดการข้อผิดพลาด
- Graceful fallback เมื่อ LINE API ไม่พร้อมใช้งาน
- Log errors สำหรับการ debug
- ไม่ block การทำงานหลักเมื่อการแจ้งเตือนล้มเหลว

## การทดสอบ

### ทดสอบการเชื่อมต่อ LINE UID
1. เข้าสู่ระบบด้วย Google
2. เปิดหน้า `/auth/link-line` ใน LINE App
3. ตรวจสอบว่า LINE UID ถูกบันทึกในฐานข้อมูล

### ทดสอบการส่งการแจ้งเตือน
1. สร้าง repair ticket ผ่าน Google Forms
2. ตรวจสอบ console logs
3. ตรวจสอบการรับข้อความใน LINE

## Troubleshooting

### ไม่สามารถเชื่อมต่อ LINE UID ได้
- ตรวจสอบ LIFF ID ใน environment variables
- ตรวจสอบ Endpoint URL ใน LIFF App settings
- ตรวจสอบ permissions (profile, openid)

### ไม่ได้รับการแจ้งเตือน LINE
- ตรวจสอบ LINE_CHANNEL_ACCESS_TOKEN
- ตรวจสอบว่า LINE UID ถูกลิงก์แล้ว
- ตรวจสอบ console logs สำหรับ error messages

### LIFF ไม่ทำงาน
- ตรวจสอบ domain ที่อนุญาตใน Channel settings
- ตรวจสอบ CORS policy
- ทดสอบใน LINE Developer Console