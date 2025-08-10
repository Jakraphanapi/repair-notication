import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { brands: true },
        },
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อบริษัท" },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: { name },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างบริษัท" },
      { status: 500 }
    );
  }
}
