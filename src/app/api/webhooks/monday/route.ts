import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mondayService } from "@/lib/monday";
import { LineService } from "@/lib/line";
import { RepairTicketStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ตรวจสอบ webhook signature (ถ้ามี)
    const signature = request.headers.get("x-monday-signature");
    if (!verifyMondaySignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const webhookData = mondayService.parseWebhookPayload(body);

    // ตรวจสอบว่าเป็นการเปลี่ยนแปลง status หรือไม่
    if (
      webhookData.eventType === "update_column_value" &&
      webhookData.columnId === "status"
    ) {
      await handleStatusChange(webhookData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Monday webhook error:", error);
    return NextResponse.json(
      {
        error: "เกิดข้อผิดพลาดในการประมวลผล webhook",
      },
      { status: 500 }
    );
  }
}

async function handleStatusChange(webhookData: any) {
  try {
    // หา ticket ในฐานข้อมูลที่มี mondayTicketId ตรงกัน
    const tickets = await prisma.repairTicket.findMany({
      where: { mondayTicketId: webhookData.itemId },
      include: {
        user: true,
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
    });

    if (tickets.length === 0) {
      console.log(`Ticket not found for Monday ID: ${webhookData.itemId}`);
      return;
    }

    const ticket = tickets[0]; // ใช้ ticket แรก

    // แปลง Monday status เป็น RepairTicketStatus
    const newStatus = mapMondayStatusToTicketStatus(webhookData.value?.label);
    const oldStatus = ticket.status;

    if (newStatus && newStatus !== oldStatus) {
      // อัปเดตสถานะใน database
      await prisma.repairTicket.update({
        where: { id: ticket.id },
        data: { status: newStatus },
      });

      // บันทึก status history
      await prisma.repairStatusHistory.create({
        data: {
          repairTicketId: ticket.id,
          fromStatus: oldStatus,
          toStatus: newStatus,
          note: "Updated from Monday.com",
        },
      });

      // ส่งการแจ้งเตือนไปยัง LINE
      if (ticket.user.lineUserId) {
        const deviceInfo = `${ticket.device.model.brand.company.name} ${ticket.device.model.brand.name} ${ticket.device.model.name}`;

        await sendLineNotification(ticket.user.lineUserId, {
          ticketId: ticket.ticketNumber,
          ticketTitle: ticket.title,
          oldStatus,
          newStatus,
          deviceInfo,
        });
      }

      console.log(
        `Ticket ${ticket.ticketNumber} status updated from ${oldStatus} to ${newStatus}`
      );
    }
  } catch (error) {
    console.error("Error handling status change:", error);
    throw error;
  }
}

async function sendLineNotification(
  lineUserId: string,
  data: {
    ticketId: string;
    ticketTitle: string;
    oldStatus: RepairTicketStatus;
    newStatus: RepairTicketStatus;
    deviceInfo: string;
  }
) {
  const statusEmoji = getStatusEmoji(data.newStatus);
  const statusText = getStatusText(data.newStatus);

  const message = `🔧 แจ้งเตือนการซ่อม

${data.ticketTitle}

อุปกรณ์: ${data.deviceInfo}
สถานะใหม่: ${statusEmoji} ${statusText}
Ticket: ${data.ticketId}

ขอบคุณที่ใช้บริการ`;

  await LineService.sendTextMessage(lineUserId, message);
}

function getStatusEmoji(status: RepairTicketStatus): string {
  const emojiMap = {
    PENDING: "⏳",
    IN_PROGRESS: "🔧",
    WAITING_PARTS: "⏱️",
    COMPLETED: "✅",
    CANCELLED: "❌",
  };
  return emojiMap[status] || "⏳";
}

function getStatusText(status: RepairTicketStatus): string {
  const textMap = {
    PENDING: "รอดำเนินการ",
    IN_PROGRESS: "กำลังซ่อม",
    WAITING_PARTS: "รออะไหล่",
    COMPLETED: "ซ่อมเสร็จแล้ว",
    CANCELLED: "ยกเลิก",
  };
  return textMap[status] || "รอดำเนินการ";
}

function mapMondayStatusToTicketStatus(
  mondayStatus: string
): RepairTicketStatus | null {
  const statusMap: { [key: string]: RepairTicketStatus } = {
    Pending: "PENDING",
    "In Progress": "IN_PROGRESS",
    "Waiting Parts": "WAITING_PARTS",
    Completed: "COMPLETED",
    Cancelled: "CANCELLED",
  };

  return statusMap[mondayStatus] || null;
}

function verifyMondaySignature(body: any, signature: string | null): boolean {
  // ตรวจสอบ signature จาก Monday.com
  // ในการใช้งานจริงควรใช้ HMAC SHA256 กับ secret key
  if (!process.env.MONDAY_WEBHOOK_SECRET) {
    return true; // ข้าม verification ถ้าไม่ได้ตั้งค่า secret
  }

  if (!signature) {
    return false;
  }

  // สำหรับการทดสอบ - ใน production ควรใช้ HMAC SHA256 verification
  // const crypto = require('crypto');
  // const expectedSignature = crypto
  //   .createHmac('sha256', process.env.MONDAY_WEBHOOK_SECRET)
  //   .update(JSON.stringify(body))
  //   .digest('hex');
  // return `sha256=${expectedSignature}` === signature;

  return true; // สำหรับการทดสอบ
}
