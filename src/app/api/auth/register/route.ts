import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validateEmail, validatePhone } from "@/lib/utils";
import { LineService } from "@/lib/line";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, lineUserId } = await request.json();

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลที่จำเป็น" },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "รูปแบบอีเมลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 400 }
      );
    }

    // Check if LINE User ID already exists
    if (lineUserId) {
      const existingLineUser = await prisma.user.findUnique({
        where: { lineUserId },
      });

      if (existingLineUser) {
        return NextResponse.json(
          { error: "LINE User ID นี้ถูกเชื่อมโยงแล้ว" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        lineUserId,
      },
    });

    // If LINE User ID is provided, send welcome message and setup rich menu
    if (lineUserId) {
      try {
        await LineService.sendTextMessage(
          lineUserId,
          `สวัสดี ${name}!\nการลงทะเบียนเสร็จสิ้นแล้ว 🎉\n\nคุณสามารถใช้งานระบบแจ้งซ่อมผ่านเมนูด้านล่างได้เลย`
        );

        // Create and link rich menu (you'll need to create rich menu image first)
        // const richMenuId = await LineService.createRichMenu()
        // await LineService.linkRichMenuToUser(lineUserId, richMenuId)
      } catch (lineError) {
        console.error("Error setting up LINE features:", lineError);
        // Don't fail registration if LINE setup fails
      }
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "ลงทะเบียนสำเร็จ",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลงทะเบียน" },
      { status: 500 }
    );
  }
}
