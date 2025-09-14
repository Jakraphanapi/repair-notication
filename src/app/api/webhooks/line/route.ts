import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LineService } from "@/lib/line";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-line-signature");

    // ตรวจสอบ signature จาก LINE
    if (!verifyLineSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const webhookData = JSON.parse(body);

    for (const event of webhookData.events || []) {
      await handleLineEvent(event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("LINE webhook error:", error);
    return NextResponse.json(
      {
        error: "เกิดข้อผิดพลาดในการประมวลผล webhook",
      },
      { status: 500 }
    );
  }
}

async function handleLineEvent(event: any) {
  const { type, source, message } = event;

  if (type === "message" && message.type === "text") {
    const userId = source.userId;
    const text = message.text.trim();

    // ตรวจสอบว่าเป็นคำสั่งลิงก์บัญชีหรือไม่
    if (text.startsWith("/link ")) {
      await handleLinkAccount(userId, text);
    } else if (text === "/help" || text === "help") {
      await sendHelpMessage(userId);
    } else if (text === "/status" || text === "status") {
      await sendUserTicketStatus(userId);
    } else if (text === "/repair" || text === "แจ้งซ่อม") {
      await sendRepairFormLink(userId);
    }
  }
}

async function handleLinkAccount(lineUserId: string, message: string) {
  try {
    // รูปแบบ: /link email@example.com
    const email = message.replace("/link ", "").trim();

    if (!isValidEmail(email)) {
      await LineService.sendTextMessage(
        lineUserId,
        "รูปแบบอีเมลไม่ถูกต้อง\nกรุณาใช้รูปแบบ: /link your@email.com"
      );
      return;
    }

    // หาผู้ใช้ในฐานข้อมูล
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await LineService.sendTextMessage(
        lineUserId,
        "ไม่พบบัญชีผู้ใช้ด้วยอีเมลนี้\nกรุณาตรวจสอบอีเมลหรือสมัครสมาชิกก่อน"
      );
      return;
    }

    // อัปเดต LINE User ID
    await prisma.user.update({
      where: { id: user.id },
      data: { lineUserId },
    });

    await LineService.sendTextMessage(
      lineUserId,
      `ยินดีต้อนรับ! 🎉\n\nคุณได้เชื่อมต่อ LINE กับระบบแจ้งซ่อมเรียบร้อยแล้ว\nบัญชี: ${email}\nจากนี้คุณจะได้รับการแจ้งเตือนเมื่อสถานะการซ่อมเปลี่ยนแปลง`
    );
  } catch (error) {
    console.error("Link account error:", error);
    await LineService.sendTextMessage(
      lineUserId,
      "เกิดข้อผิดพลาดในการเชื่อมต่อบัญชี กรุณาลองใหม่อีกครั้ง"
    );
  }
}

async function sendRepairFormLink(lineUserId: string) {
  try {
    // ตรวจสอบว่าผู้ใช้เชื่อมต่อบัญชีแล้วหรือยัง
    const user = await prisma.user.findUnique({
      where: { lineUserId },
    });

    if (!user) {
      await LineService.sendTextMessage(
        lineUserId,
        "ยังไม่ได้เชื่อมต่อบัญชี ❌\nกรุณาใช้คำสั่ง /link your@email.com เพื่อเชื่อมต่อบัญชีก่อน"
      );
      return;
    }

    // ส่งลิงก์ LIFF App สำหรับแจ้งซ่อม
    const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`;

    const repairMessage = `🔧 ฟอร์มแจ้งซ่อมออนไลน์

สวัสดี ${user.name || "คุณ"}! 👋

คลิกลิงก์ด้านล่างเพื่อเปิดฟอร์มแจ้งซ่อม:
${liffUrl}

📋 ข้อมูลของคุณจะถูกใส่ไว้ในฟอร์มแล้ว
🔔 คุณจะได้รับการแจ้งเตือนเมื่อมีการอัปเดต
⚡ การซ่อมจะดำเนินการผ่าน Monday.com`;

    await LineService.sendTextMessage(lineUserId, repairMessage);
  } catch (error) {
    console.error("Error sending repair form link:", error);
    await LineService.sendTextMessage(
      lineUserId,
      "เกิดข้อผิดพลาดในการส่งลิงก์ฟอร์ม กรุณาลองใหม่อีกครั้ง"
    );
  }
}

async function sendHelpMessage(lineUserId: string) {
  const helpMessage = `🔧 คำสั่งที่ใช้ได้:

/link your@email.com - เชื่อมต่อบัญชีกับ LINE
/repair หรือ แจ้งซ่อม - เปิดฟอร์มแจ้งซ่อม
/status - ดูสถานะการซ่อมทั้งหมด
/help - แสดงคำสั่งที่ใช้ได้

📝 วิธีใช้งาน:
1. สมัครสมาชิกในระบบก่อน
2. ใช้คำสั่ง /link เพื่อเชื่อมต่อบัญชี
3. ใช้คำสั่ง /repair เพื่อแจ้งซ่อม
4. รับการแจ้งเตือนผ่าน LINE`;

  await LineService.sendTextMessage(lineUserId, helpMessage);
}

async function sendUserTicketStatus(lineUserId: string) {
  try {
    // หาผู้ใช้จาก LINE User ID
    const user = await prisma.user.findUnique({
      where: { lineUserId },
    });

    if (!user) {
      await LineService.sendTextMessage(
        lineUserId,
        "ยังไม่ได้เชื่อมต่อบัญชี\nกรุณาใช้คำสั่ง /link your@email.com เพื่อเชื่อมต่อบัญชี"
      );
      return;
    }

    // หา repair tickets ของผู้ใช้
    const tickets = await prisma.repairTicket.findMany({
      where: { userId: user.id },
      include: {
        device: {
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
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5, // แสดงแค่ 5 รายการล่าสุด
    });

    if (tickets.length === 0) {
      await LineService.sendTextMessage(lineUserId, "ยังไม่มีรายการแจ้งซ่อม");
      return;
    }

    // สร้างข้อความแสดงสถานะ
    let statusText = "📋 สถานะการซ่อมของคุณ:\n\n";

    tickets.forEach((ticket, index) => {
      const deviceInfo = `${ticket.device.model.brand.company.name} ${ticket.device.model.brand.name} ${ticket.device.model.name}`;
      const statusEmoji = getStatusEmoji(ticket.status);

      statusText += `${index + 1}. ${ticket.title}\n`;
      statusText += `   อุปกรณ์: ${deviceInfo}\n`;
      statusText += `   สถานะ: ${statusEmoji} ${getStatusText(
        ticket.status
      )}\n`;
      statusText += `   วันที่: ${ticket.createdAt.toLocaleDateString(
        "th-TH"
      )}\n\n`;
    });

    await LineService.sendTextMessage(lineUserId, statusText);
  } catch (error) {
    console.error("Send status error:", error);
    await LineService.sendTextMessage(
      lineUserId,
      "เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง"
    );
  }
}

function verifyLineSignature(body: string, signature: string | null): boolean {
  if (!process.env.LINE_CHANNEL_SECRET || !signature) {
    return true; // ข้าม verification ถ้าไม่ได้ตั้งค่า
  }

  const hash = crypto
    .createHmac("SHA256", process.env.LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");

  return signature === hash;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getStatusEmoji(status: string): string {
  const emojiMap: { [key: string]: string } = {
    PENDING: "⏳",
    IN_PROGRESS: "🔧",
    WAITING_PARTS: "⏱️",
    COMPLETED: "✅",
    CANCELLED: "❌",
  };
  return emojiMap[status] || "⏳";
}

function getStatusText(status: string): string {
  const textMap: { [key: string]: string } = {
    PENDING: "รอดำเนินการ",
    IN_PROGRESS: "กำลังซ่อม",
    WAITING_PARTS: "รออะไหล่",
    COMPLETED: "ซ่อมเสร็จแล้ว",
    CANCELLED: "ยกเลิก",
  };
  return textMap[status] || "รอดำเนินการ";
}
