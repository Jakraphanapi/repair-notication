# การจัดการ Google UID ในระบบ

ตอนนี้ระบบได้ถูกปรับปรุงให้สามารถเก็บและจัดการ Google UID ได้อย่างถูกต้องแล้ว

## ฟังก์ชันที่เพิ่มขึ้น

### 1. การเก็บ Google UID
เมื่อผู้ใช้ login ด้วย Google ระบบจะ:
- เก็บ Google UID ไว้ในตาราง `Account` ในฟิลด์ `providerAccountId`
- เชื่อมโยงกับผู้ใช้ผ่านฟิลด์ `userId`
- เก็บข้อมูลเพิ่มเติมเช่น access_token, refresh_token

### 2. ฟังก์ชันช่วยเหลือใน `google-utils.ts`

#### `getGoogleUidByEmail(email: string)`
ดึง Google UID จากอีเมล
```typescript
const googleUid = await getGoogleUidByEmail("user@example.com");
console.log("Google UID:", googleUid);
```

#### `getGoogleUidByUserId(userId: string)`
ดึง Google UID จาก User ID
```typescript
const googleUid = await getGoogleUidByUserId("user123");
console.log("Google UID:", googleUid);
```

#### `getGoogleAccountByUserId(userId: string)`
ดึงข้อมูล Google Account ทั้งหมด
```typescript
const googleAccount = await getGoogleAccountByUserId("user123");
console.log("Google Account:", googleAccount);
// จะได้ข้อมูล: providerAccountId, access_token, refresh_token, etc.
```

#### `hasGoogleAccount(userId: string)`
ตรวจสอบว่าผู้ใช้มี Google Account หรือไม่
```typescript
const hasGoogle = await hasGoogleAccount("user123");
console.log("Has Google Account:", hasGoogle);
```

## การใช้งานในหน้า Web

### แสดง Google UID ในโปรไฟล์
```typescript
import { getGoogleUidByUserId } from "@/lib/google-utils";

// ในหน้าโปรไฟล์ผู้ใช้
const googleUid = await getGoogleUidByUserId(session.user.id);
if (googleUid) {
  return <p>Google ID: {googleUid}</p>;
}
```

### ตรวจสอบสถานะการเชื่อมต่อ Google
```typescript
import { hasGoogleAccount } from "@/lib/google-utils";

const hasGoogle = await hasGoogleAccount(session.user.id);
if (hasGoogle) {
  return <span className="text-green-500">เชื่อมต่อ Google แล้ว</span>;
} else {
  return <button>เชื่อมต่อ Google</button>;
}
```

## ตัวอย่างการใช้งานใน API

### GET /api/user/google-info
```typescript
import { getGoogleAccountByUserId } from "@/lib/google-utils";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const googleAccount = await getGoogleAccountByUserId(session.user.id);
  
  return Response.json({
    hasGoogleAccount: !!googleAccount,
    googleUid: googleAccount?.providerAccountId || null,
  });
}
```

## ข้อมูลที่เก็บในฐานข้อมูล

ตาราง `Account` จะมีข้อมูลดังนี้:
- `userId`: เชื่อมโยงกับผู้ใช้
- `provider`: "google"
- `providerAccountId`: Google UID (สำคัญที่สุด)
- `access_token`: สำหรับเรียก Google API
- `refresh_token`: สำหรับต่ออายุ token
- `expires_at`: วันหมดอายุของ token

## การ Migration ฐานข้อมูล

เมื่อพร้อมใช้งาน ให้รันคำสั่ง:
```bash
npx prisma db push
# หรือ
npx prisma migrate deploy
```

ระบบจะสร้างตาราง Account โดยอัตโนมัติและเก็บข้อมูล Google UID ได้อย่างถูกต้อง