// seed.ts - สร้างข้อมูลตัวอย่างสำหรับทดสอบระบบ
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 เริ่มต้น seeding ข้อมูลตัวอย่าง...");

  // สร้าง admin user
  const hashedPassword = await bcrypt.hash("password123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Administrator",
      password: hashedPassword,
      phone: "081-234-5678",
      role: "ADMIN",
    },
  });

  console.log("✅ สร้าง admin user:", adminUser.email);

  // สร้าง test user
  const testUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Test User",
      password: hashedPassword,
      phone: "089-876-5432",
      role: "USER",
    },
  });

  console.log("✅ สร้าง test user:", testUser.email);

  // สร้างบริษัท
  const companies = [
    { name: "Apple Inc." },
    { name: "Samsung Electronics" },
    { name: "Dell Technologies" },
    { name: "HP Inc." },
    { name: "Lenovo Group" },
  ];

  const createdCompanies = [];
  for (const companyData of companies) {
    const company = await prisma.company.upsert({
      where: { name: companyData.name },
      update: {},
      create: companyData,
    });
    createdCompanies.push(company);
    console.log("✅ สร้างบริษัท:", company.name);
  }

  // สร้างแบรนด์และรุ่น
  const brandsAndModels = [
    {
      companyName: "Apple Inc.",
      brands: [
        {
          name: "iPhone",
          models: ["iPhone 15 Pro", "iPhone 15", "iPhone 14 Pro", "iPhone 14"],
        },
        {
          name: "MacBook",
          models: ["MacBook Pro M3", "MacBook Air M2", 'MacBook Pro 16"'],
        },
        {
          name: "iPad",
          models: ['iPad Pro 12.9"', "iPad Air", "iPad mini"],
        },
      ],
    },
    {
      companyName: "Samsung Electronics",
      brands: [
        {
          name: "Galaxy",
          models: ["Galaxy S24 Ultra", "Galaxy S24", "Galaxy Note 20"],
        },
        {
          name: "Galaxy Tab",
          models: ["Galaxy Tab S9", "Galaxy Tab A8"],
        },
      ],
    },
    {
      companyName: "Dell Technologies",
      brands: [
        {
          name: "Inspiron",
          models: ["Inspiron 15 3000", "Inspiron 14 5000"],
        },
        {
          name: "XPS",
          models: ["XPS 13", "XPS 15", "XPS 17"],
        },
      ],
    },
  ];

  for (const companyData of brandsAndModels) {
    const company = createdCompanies.find(
      (c) => c.name === companyData.companyName
    );
    if (!company) continue;

    for (const brandData of companyData.brands) {
      const brand = await prisma.brand.upsert({
        where: {
          name_companyId: {
            name: brandData.name,
            companyId: company.id,
          },
        },
        update: {},
        create: {
          name: brandData.name,
          companyId: company.id,
        },
      });

      console.log("✅ สร้างแบรนด์:", brand.name);

      for (const modelName of brandData.models) {
        const model = await prisma.model.upsert({
          where: {
            name_brandId: {
              name: modelName,
              brandId: brand.id,
            },
          },
          update: {},
          create: {
            name: modelName,
            brandId: brand.id,
          },
        });

        console.log("✅ สร้างรุ่น:", model.name);

        // สร้างอุปกรณ์ตัวอย่าง 3-5 เครื่องต่อรุ่น
        for (let i = 1; i <= 3; i++) {
          const serialNumber = `${brandData.name.toUpperCase()}${Date.now()}${i
            .toString()
            .padStart(3, "0")}`;

          const device = await prisma.device.upsert({
            where: { serialNumber },
            update: {},
            create: {
              serialNumber,
              modelId: model.id,
            },
          });

          console.log("✅ สร้างอุปกรณ์:", device.serialNumber);
        }
      }
    }
  }

  console.log("🎉 Seeding เสร็จสิ้น!");
}

main()
  .catch((e) => {
    console.error("❌ เกิดข้อผิดพลาดในการ seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
