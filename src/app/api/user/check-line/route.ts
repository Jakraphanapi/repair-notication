import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUid = searchParams.get("lineUid");

    if (!lineUid) {
      return NextResponse.json(
        { error: "LINE UID is required" },
        { status: 400 }
      );
    }

    // Check if user exists with this LINE UID
    const user = await prisma.user.findFirst({
      where: { lineUserId: lineUid },
      select: {
        id: true,
        name: true,
        email: true,
        lineUserId: true,
        createdAt: true,
      },
    });

    if (user) {
      return NextResponse.json({
        exists: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          lineUserId: user.lineUserId,
          registeredAt: user.createdAt,
        },
      });
    } else {
      return NextResponse.json({
        exists: false,
        message: "User not found with this LINE UID",
      });
    }
  } catch (error) {
    console.error("Error checking LINE UID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
