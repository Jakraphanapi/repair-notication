import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lineUid, displayName, pictureUrl } = await request.json();

    if (!lineUid) {
      return NextResponse.json(
        { error: "LINE UID is required" },
        { status: 400 }
      );
    }

    // Check if LINE UID is already linked to another user
    const existingUser = await prisma.user.findFirst({
      where: {
        lineUserId: lineUid,
        NOT: {
          id: session.user.id,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "LINE UID นี้ถูกเชื่อมต่อกับบัญชีอื่นแล้ว" },
        { status: 409 }
      );
    }

    // Update user with LINE UID
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        lineUserId: lineUid,
        // Update name and image if not set or if new data is available
        name:
          displayName && !session.user.name ? displayName : session.user.name,
        image:
          pictureUrl && !session.user.image ? pictureUrl : session.user.image,
      },
    });

    return NextResponse.json({
      success: true,
      message: "LINE UID เชื่อมต่อสำเร็จ",
      user: {
        id: updatedUser.id,
        lineUserId: updatedUser.lineUserId,
        name: updatedUser.name,
        image: updatedUser.image,
      },
    });
  } catch (error) {
    console.error("Error linking LINE UID:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        lineUserId: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user,
      isLinked: !!user.lineUserId,
    });
  } catch (error) {
    console.error("Error getting user LINE status:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove LINE UID from user
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        lineUserId: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ยกเลิกการเชื่อมต่อ LINE UID สำเร็จ",
      user: {
        id: updatedUser.id,
        lineUserId: updatedUser.lineUserId,
      },
    });
  } catch (error) {
    console.error("Error unlinking LINE UID:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
