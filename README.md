# 🔧 ระบบแจ้งซ่อม - Repair Notification System

ระบบแจ้งซ่อมออนไลน์ที่ครบครันพร้อมการแจ้งเตือนแบบ Real-time ผ่าน LINE Bot และการบูรณาการกับ Monday.com

## ✨ Features ที่พัฒนาให้

### 🔐 ระบบ Authentication
- การลงทะเบียนผ่าน email และ mobile phone
- การเชื่อมโยง LINE User ID
- Rich Menu แสดงหลังจากลงทะเบียน

### 📝 ระบบแจ้งซ่อม
- Web form ผ่าน LINE Web App (LIFF)
- Cascading dropdown: บริษัท → Brand → Model → Serial Number
- การดึงข้อมูลเครื่องจาก database แบบ dynamic
- การอัพโหลดรูปภาพประกอบ

### 📊 ระบบจัดการข้อมูล
- Tab ประวัติการซ่อมพร้อม search และ filter
- Dashboard สำหรับดูสถิติ
- ระบบ comment และ tracking

### 🔔 ระบบแจ้งเตือน
- แจ้งเตือนเข้า LINE Group เมื่อมีการแจ้งซ่อม
- สร้าง ticket ใน Monday.com อัตโนมัติ
- แจ้งเตือนกลับผู้ใช้เมื่อเปลี่ยนสถานะ

## 🛠 Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **LINE Integration**: LINE Bot API + LIFF + LINE Notify
- **Monday.com**: API Integration with webhooks
- **File Upload**: Cloudinary integration
- **UI Components**: Heroicons + React Hook Form + Zod validation

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/Eursukkul/repair-notification-system.git
cd repair-notification-system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
สร้างไฟล์ `.env.local` จาก `.env.example`:
```bash
cp .env.example .env.local
```

### 4. Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init
```

### 5. Run Development Server
```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - ลงทะเบียนผู้ใช้ใหม่
- `POST /api/auth/signin` - เข้าสู่ระบบ

### Equipment Data (Cascading Dropdowns)
- `GET /api/companies` - ดึงข้อมูลบริษัท
- `GET /api/companies/[companyId]/brands` - ดึงข้อมูลแบรนด์ตามบริษัท
- `GET /api/brands/[brandId]/models` - ดึงข้อมูลรุ่นตามแบรนด์
- `GET /api/models/[modelId]/devices` - ดึงข้อมูลอุปกรณ์ตามรุ่น

### Repair Tickets
- `GET /api/tickets` - ดึงข้อมูลการแจ้งซ่อม
- `POST /api/tickets` - สร้างการแจ้งซ่อมใหม่

## 📊 Database Schema

ระบบใช้ PostgreSQL พร้อม Prisma ORM โดยมี tables หลักดังนี้:

- `User` - ข้อมูลผู้ใช้
- `Company` - ข้อมูลบริษัทผู้ผลิต
- `Brand` - ข้อมูลแบรนด์
- `Model` - ข้อมูลรุ่น
- `Device` - ข้อมูลอุปกรณ์
- `RepairTicket` - ข้อมูลการแจ้งซ่อม
- `Comment` - ข้อมูลความคิดเห็น
- `RepairStatusHistory` - ประวัติการเปลี่ยนสถานะ
- `NotificationLog` - Log การแจ้งเตือน

**ระบบพร้อมใช้งาน! 🎉** คุณสามารถ customize และปรับแต่งเพิ่มเติมตามความต้องการได้
