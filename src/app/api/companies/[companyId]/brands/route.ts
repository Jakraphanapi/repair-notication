import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await context.params;

    const brands = await prisma.brand.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { models: true },
        },
      },
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลแบรนด์" },
      { status: 500 }
    );
  }
}
