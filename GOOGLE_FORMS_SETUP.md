# การตั้งค่า Google Forms สำหรับระบบแจ้งซ่อม

## ภาพรวมของการเปลี่ยนแปลง

ระบบได้ถูกปรับปรุงให้ใช้:
1. **Google Authentication เท่านั้น** - ผู้ใช้ต้องเข้าสู่ระบบด้วย Google Account
2. **Google Forms สำหรับการแจ้งซ่อม** - แทนที่ฟอร์มภายในระบบเดิม
3. **ฟังก์ชันเดิมยังทำงานเหมือนเดิม** - การแจ้งเตือน, การจัดการข้อมูล, การติดตาม

## ขั้นตอนการตั้งค่า Google Forms

### 1. สร้าง Google Form

1. ไปที่ [Google Forms](https://forms.google.com)
2. คลิก "สร้างฟอร์มใหม่"
3. ตั้งชื่อฟอร์ม: "แบบฟอร์มแจ้งซ่อมออนไลน์"

### 2. เพิ่มฟิลด์ในฟอร์ม

**ฟิลด์ที่จำเป็น:**

1. **อีเมล** (Email)
   - ประเภท: ตอบสั้นๆ
   - ตั้งค่า: ตรวจสอบรูปแบบอีเมล
   - จำเป็นต้องตอบ: ใช่

2. **ชื่อผู้แจ้ง** (Name)
   - ประเภท: ตอบสั้นๆ
   - จำเป็นต้องตอบ: ใช่

3. **หัวข้อการแจ้งซ่อม** (Title)
   - ประเภท: ตอบสั้นๆ
   - จำเป็นต้องตอบ: ใช่

4. **รายละเอียดปัญหา** (Description)
   - ประเภท: ตอบยาวๆ
   - จำเป็นต้องตอบ: ใช่

5. **ความสำคัญ** (Priority)
   - ประเภท: ตัวเลือก
   - ตัวเลือก: ต่ำ, ปานกลาง, สูง, เร่งด่วน
   - ค่าเริ่มต้น: ปานกลาง

6. **ข้อมูลอุปกรณ์** (Device Info)
   - ประเภท: ตอบยาวๆ
   - คำอธิบาย: "ยี่ห้อ, รุ่น, หมายเลขเครื่อง"

7. **รูปภาพ** (Images) - เสริม
   - ประเภท: อัปโหลดไฟล์
   - อนุญาตหลายไฟล์: ใช่

### 3. ตั้งค่า Pre-fill URL

เพื่อให้ระบบส่งข้อมูลผู้ใช้ไปยังฟอร์มอัตโนมัติ:

1. ในฟอร์ม คลิกไอคอน "ส่ง" (Send)
2. คลิกไอคอน "ลิงก์" (Link)
3. คลิก "ย่อ URL" หากต้องการ
4. คัดลอก URL

**ตัวอย่าง Pre-fill Parameters:**
```
entry.1234567890 = อีเมล
entry.0987654321 = ชื่อ
entry.1111111111 = User ID
```

### 4. ตั้งค่า Webhook (Apps Script)

เพื่อให้ส่งข้อมูลกลับมายังระบบเมื่อมีการส่งฟอร์ม:

1. ในฟอร์ม คลิก "ตัวเลือกเพิ่มเติม" (3 จุด) > "Editor สคริปต์"
2. ลบโค้ดเดิมและใส่:

```javascript
function onFormSubmit(e) {
  const formResponse = e.response;
  const itemResponses = formResponse.getItemResponses();
  
  const data = {
    timestamp: new Date().toISOString(),
    email: '',
    name: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    deviceInfo: '',
    images: []
  };
  
  // Map form responses to data object
  itemResponses.forEach(function(itemResponse) {
    const question = itemResponse.getItem().getTitle();
    const answer = itemResponse.getResponse();
    
    if (question.includes('อีเมล') || question.includes('Email')) {
      data.email = answer;
    } else if (question.includes('ชื่อ') || question.includes('Name')) {
      data.name = answer;
    } else if (question.includes('หัวข้อ') || question.includes('Title')) {
      data.title = answer;
    } else if (question.includes('รายละเอียด') || question.includes('Description')) {
      data.description = answer;
    } else if (question.includes('ความสำคัญ') || question.includes('Priority')) {
      if (answer === 'ต่ำ') data.priority = 'LOW';
      else if (answer === 'สูง') data.priority = 'HIGH';
      else if (answer === 'เร่งด่วน') data.priority = 'URGENT';
      else data.priority = 'MEDIUM';
    } else if (question.includes('อุปกรณ์') || question.includes('Device')) {
      data.deviceInfo = answer;
    }
  });
  
  // Send data to your webhook
  const webhookUrl = 'https://yourdomain.com/api/webhooks/google-forms';
  
  const options = {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
    },
    'payload': JSON.stringify(data)
  };
  
  try {
    UrlFetchApp.fetch(webhookUrl, options);
  } catch (error) {
    console.error('Webhook error:', error);
  }
}
```

3. บันทึกสคริปต์
4. ไปที่ "Triggers" (ทริกเกอร์)
5. คลิก "เพิ่มทริกเกอร์"
6. ตั้งค่า:
   - ฟังก์ชัน: onFormSubmit
   - แหล่งที่มาของเหตุการณ์: จากฟอร์ม
   - ประเภทเหตุการณ์: ส่งฟอร์ม

### 5. อัปเดต Environment Variables

ในไฟล์ `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_FORM_URL="https://forms.gle/YOUR_ACTUAL_FORM_ID"
```

## การใช้งาน

### สำหรับผู้ใช้:
1. เข้าสู่ระบบด้วย Google Account
2. ไปหน้า "แจ้งซ่อมใหม่"
3. คลิก "เปิด Google Form แจ้งซ่อม"
4. กรอกข้อมูลในฟอร์ม Google
5. ส่งฟอร์ม

### การทำงานของระบบ:
1. ผู้ใช้ส่งฟอร์ม Google
2. Apps Script ทริกเกอร์ทำงาน
3. ส่งข้อมูลไป Webhook API
4. ระบบสร้าง RepairTicket ในฐานข้อมูล
5. ส่งการแจ้งเตือนไป LINE/Monday.com (หากตั้งค่าไว้)

## ข้อดีของระบบใหม่

1. **ใช้งานง่าย** - ผู้ใช้คุ้นเคยกับ Google Forms
2. **รองรับมือถือ** - Google Forms ทำงานดีบนมือถือ
3. **อัปโหลดไฟล์** - สามารถแนบรูปภาพได้
4. **ไม่ต้องดูแลฟอร์ม** - Google จัดการให้
5. **การแจ้งเตือนเดิม** - ระบบแจ้งเตือนยังทำงานเหมือนเดิม

## หมายเหตุสำคัญ

- ระบบการแจ้งเตือนและการจัดการข้อมูลยังทำงานเหมือนเดิม
- ข้อมูลยังเก็บในฐานข้อมูล PostgreSQL เดิม
- สามารถดูประวัติการแจ้งซ่อมในระบบได้ตามปกติ
- การเชื่อมต่อ LINE และ Monday.com ยังใช้งานได้ (หากตั้งค่าไว้)