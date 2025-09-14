# คู่มือการทดสอบระบบ LINE Notification

## ภาพรวมของการทดสอบ

ระบบนี้ใช้ LINE-first workflow ที่ผู้ใช้เริ่มต้นผ่าน LINE LIFF และดำเนินการผ่าน LINE App เป็นหลัก

## การเตรียมความพร้อม

### 1. ตั้งค่า Environment Variables

```env
# LINE Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret
NEXT_PUBLIC_LIFF_ID=your_liff_id

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database
DATABASE_URL=your_database_url

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secret_key
```

### 2. การตั้งค่า LIFF App

1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง LIFF App ใหม่:
   - **Endpoint URL**: `https://your-domain.com/line`
   - **App Type**: Compact (240px) หรือ Tall (ใช้เต็มหน้าจอ)
   - **Permission**: `profile` (เพื่อดึงข้อมูล LINE Profile และ UID)

## การทดสอบทีละขั้นตอน

### 1. ทดสอบหน้า Entry Point (`/line`)

#### วิธีการทดสอบ:
1. เปิด LINE App บนมือถือ
2. เปิดลิงก์ LIFF: `https://liff.line.me/YOUR_LIFF_ID`
3. ระบบควรแสดงหน้า `/line`

#### ผลลัพธ์ที่คาดหวัง:
- **ผู้ใช้ใหม่**: แสดงปุ่ม "ลงทะเบียนด้วย Google"
- **ผู้ใช้เก่า**: แสดงปุ่ม "ไปหน้าแจ้งซ่อม" และ redirect ไป `/line/repair`

### 2. ทดสอบการลงทะเบียนผู้ใช้ใหม่

#### วิธีการทดสอบ:
1. ผู้ใช้ที่ยังไม่เคยลงทะเบียน → คลิก "ลงทะเบียนด้วย Google"
2. ระบบ redirect ไป Google OAuth
3. หลัง OAuth สำเร็จ → redirect ไป `/line/complete-registration`

#### ผลลัพธ์ที่คาดหวัง:
- การเชื่อมต่อ LINE UID กับ Google account อัตโนมัติ
- Redirect ไป Google Form พร้อมข้อมูล pre-filled
- ข้อมูลใหม่ในฐานข้อมูล: `lineUserId` ที่เชื่อมกับ `email` และ `googleId`

### 3. ทดสอบหน้า Google Form (`/line/repair`)

#### วิธีการทดสอบ:
1. ผู้ใช้ที่ลงทะเบียนแล้ว → เข้าหน้า `/line/repair`
2. ตรวจสอบข้อมูลที่แสดง: ชื่อ, LINE UID
3. คลิก "เปิด Google Form"

#### ผลลัพธ์ที่คาดหวัง:
- Google Form เปิดใน LINE Browser หรือ External Browser
- ข้อมูลถูก pre-filled: ชื่อ, LINE UID
- สามารถกรอกและส่งฟอร์มได้

### 4. ทดสอบ API Endpoints

#### API: `/api/user/check-line`

```bash
# ทดสอบด้วย curl
curl "https://your-domain.com/api/user/check-line?lineUid=U1234567890abcdef1234567890abcdef"
```

**Response ที่คาดหวัง:**

```json
{
  "exists": true,
  "user": {
    "id": "cuid123",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

#### API: `/api/user/link-line`

```bash
# ทดสอบด้วย curl (ต้องมี valid session)
curl -X POST https://your-domain.com/api/user/link-line \
  -H "Content-Type: application/json" \
  -d '{"lineUid": "U1234567890abcdef1234567890abcdef"}'
```

### 5. ทดสอบการส่งการแจ้งเตือน LINE

#### วิธีการทดสอบ:
1. ส่ง Google Form ด้วยข้อมูลผู้ใช้ที่มี LINE UID
2. ตรวจสอบ webhook `/api/webhooks/google-forms`
3. ตรวจสอบการสร้าง Monday.com ticket
4. ตรวจสอบการส่ง LINE notification

#### เครื่องมือทดสอบ:

```javascript
// ทดสอบส่งการแจ้งเตือนแบบ manual
const { sendLineNotification } = require('./src/lib/line-notifications');

await sendLineNotification('U1234567890abcdef1234567890abcdef', {
  type: 'repair_created',
  ticketId: 'TEST001',
  deviceName: 'Test Device',
  issue: 'Test Issue'
});
```

## การทดสอบ Edge Cases

### 1. ผู้ใช้เปิดในเว็บบราวเซอร์ (ไม่ใช่ LINE App)

**ผลลัพธ์ที่คาดหวัง**: แสดงข้อความบอกให้เปิดใน LINE App

### 2. LIFF SDK ไม่ load สำเร็จ

**ผลลัพธ์ที่คาดหวัง**: แสดง fallback UI หรือข้อความ error

### 3. Google OAuth ล้มเหลว

**ผลลัพธ์ที่คาดหวัง**: Redirect กลับหน้า `/line` พร้อมข้อความ error

### 4. LINE API ไม่พร้อมใช้งาน

**ผลลัพธ์ที่คาดหวัง**: ระบบยังทำงานได้ แต่ไม่ส่งการแจ้งเตือน

## การตรวจสอบปัญหาที่พบบ่อย

### ปัญหา: LIFF ไม่ทำงาน

1. ✅ ตรวจสอบ `NEXT_PUBLIC_LIFF_ID` ใน environment
2. ✅ ตรวจสอบ Endpoint URL ใน LINE Console
3. ✅ ตรวจสอบ domain ที่อนุญาตในการใช้งาน
4. ✅ ทดสอบใน LINE Developer Tools

### ปัญหา: ไม่ได้รับการแจ้งเตือน LINE

1. ✅ ตรวจสอบ `LINE_CHANNEL_ACCESS_TOKEN`
2. ✅ ตรวจสอบว่า LINE UID ถูกเก็บในฐานข้อมูลถูกต้อง
3. ✅ ทดสอบ LINE Push Message API แยกต่างหาก
4. ✅ ตรวจสอบ rate limit ของ LINE API

### ปัญหา: Google OAuth ไม่ทำงาน

1. ✅ ตรวจสอบ `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET`
2. ✅ ตรวจสอบ authorized redirect URIs ใน Google Console
3. ✅ ตรวจสอบ `NEXTAUTH_URL` และ `NEXTAUTH_SECRET`

## Performance Testing

### 1. ทดสอบ Load Time

- หน้า `/line` ควร load ภายใน 2 วินาที
- LIFF SDK ควร initialize ภายใน 3 วินาที
- API calls ควรตอบสนองภายใน 1 วินาที

### 2. ทดสอบ Concurrent Users

- ทดสอบ 10-50 users พร้อมกัน
- ตรวจสอบ database connection pooling
- ติดตาม memory usage และ response time

## Monitoring และ Logging

### ตัวอย่าง Log Messages ที่ควรติดตาม:

```
[INFO] LIFF initialized successfully for user: U123...
[INFO] User registration completed: user@example.com -> U123...
[INFO] LINE notification sent successfully: U123...
[ERROR] LINE API error: Invalid channel access token
[WARN] User accessed /line outside of LINE App
```

### Metrics ที่ควร Monitor:

1. **User Flow Completion Rate**: % ของผู้ใช้ที่ลงทะเบียนสำเร็จ
2. **Notification Delivery Rate**: % ของการแจ้งเตือนที่ส่งสำเร็จ
3. **API Response Time**: เวลาตอบสนองของ API แต่ละตัว
4. **Error Rate**: อัตราการเกิด error ในแต่ละ component

## Automated Testing

### Unit Tests

```javascript
// ตัวอย่าง test สำหรับ LINE utility functions
import { isValidLineUid } from '../src/lib/liff-utils';

test('should validate LINE UID format', () => {
  expect(isValidLineUid('U1234567890abcdef1234567890abcdef')).toBe(true);
  expect(isValidLineUid('invalid-uid')).toBe(false);
});
```

### Integration Tests

```javascript
// ตัวอย่าง test สำหรับ API endpoints
test('GET /api/user/check-line should return user status', async () => {
  const response = await fetch('/api/user/check-line?lineUid=U123...');
  const data = await response.json();
  
  expect(response.status).toBe(200);
  expect(data).toHaveProperty('exists');
});
```

---

## สรุป

การทดสอบระบบนี้ครอบคลุม:
1. 🧪 **Functional Testing**: ทดสอบแต่ละ feature
2. 🔄 **Integration Testing**: ทดสอบการทำงานร่วมกัน
3. 📱 **Mobile Testing**: ทดสอบใน LINE App
4. ⚡ **Performance Testing**: ทดสอบประสิทธิภาพ
5. 🔍 **Monitoring**: ติดตามการทำงานจริง

การทดสอบควรทำเป็นประจำหลังจากการ deploy หรือแก้ไขโค้ด เพื่อให้มั่นใจว่าระบบทำงานถูกต้องและเสถียร