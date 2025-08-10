import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await context.params;

    const devices = await prisma.device.findMany({
      where: { modelId },
      orderBy: { serialNumber: "asc" },
      include: {
        model: {
          include: {
            brand: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลอุปกรณ์" },
      { status: 500 }
    );
  }
}
