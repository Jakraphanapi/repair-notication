import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await context.params;

    const models = await prisma.model.findMany({
      where: { brandId },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { devices: true },
        },
      },
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลรุ่น" },
      { status: 500 }
    );
  }
}
