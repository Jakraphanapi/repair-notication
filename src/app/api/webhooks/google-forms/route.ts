import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRepairTicketNotification } from "@/lib/line-notifications";
import { MondayService } from "@/lib/monday";

interface GoogleFormData {
  timestamp: string;
  email: string;
  name: string;
  userId?: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  deviceInfo: string;
  images?: string[];
  phone?: string;
  company?: string;
  department?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: GoogleFormData = await request.json();
    console.log("Google Form Data:", data);
    // Validate required fields
    if (!data.email || !data.title || !data.description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Create user if doesn't exist (in case they filled form without logging in)
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          phone: data.phone || null,
          role: "USER",
        },
      });
    }

    // Create a generic device for Google Forms submissions
    let device = await prisma.device.findFirst({
      where: {
        serialNumber: `GOOGLE_FORM_${user.id}`,
      },
    });

    if (!device) {
      // Create a default model and device for Google Forms
      let defaultCompany = await prisma.company.findFirst({
        where: { name: "Google Forms" },
      });

      if (!defaultCompany) {
        defaultCompany = await prisma.company.create({
          data: { name: "Google Forms" },
        });
      }

      let defaultBrand = await prisma.brand.findFirst({
        where: {
          name: "General",
          companyId: defaultCompany.id,
        },
      });

      if (!defaultBrand) {
        defaultBrand = await prisma.brand.create({
          data: {
            name: "General",
            companyId: defaultCompany.id,
          },
        });
      }

      let defaultModel = await prisma.model.findFirst({
        where: {
          name: "Google Form Submission",
          brandId: defaultBrand.id,
        },
      });

      if (!defaultModel) {
        defaultModel = await prisma.model.create({
          data: {
            name: "Google Form Submission",
            brandId: defaultBrand.id,
          },
        });
      }

      device = await prisma.device.create({
        data: {
          serialNumber: `GOOGLE_FORM_${user.id}`,
          modelId: defaultModel.id,
        },
      });
    }

    // Generate ticket number
    const ticketCount = await prisma.repairTicket.count();
    const ticketNumber = `TK${(ticketCount + 1).toString().padStart(6, "0")}`;

    // Create repair ticket
    const repairTicket = await prisma.repairTicket.create({
      data: {
        ticketNumber,
        title: data.title,
        description: `${data.description}\n\nอุปกรณ์: ${data.deviceInfo || "ไม่ระบุ"
          }\n\nส่งผ่าน Google Forms เมื่อ: ${data.timestamp}`,
        priority: data.priority || "MEDIUM",
        status: "PENDING",
        userId: user.id,
        deviceId: device.id,
        images: data.images || [],
      },
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

    // Create status history
    await prisma.repairStatusHistory.create({
      data: {
        repairTicketId: repairTicket.id,
        fromStatus: null,
        toStatus: "PENDING",
        note: "สร้างรายการแจ้งซ่อมจาก Google Forms",
      },
    });

    // Send LINE notification if user has LINE UID
    try {
      if (user.lineUserId) {
        const success = await sendRepairTicketNotification(user.lineUserId, {
          ticketNumber: repairTicket.ticketNumber,
          title: repairTicket.title,
          status: "PENDING",
          description: repairTicket.description,
          priority: repairTicket.priority,
        });

        if (success) {
          console.log(
            `LINE notification sent successfully to user: ${user.email}`
          );
        } else {
          console.error(
            `Failed to send LINE notification to user: ${user.email}`
          );
        }
      } else {
        console.log(
          `User ${user.email} has no LINE UID linked - no LINE notification sent`
        );
      }
    } catch (lineError) {
      console.error("LINE notification error:", lineError);
    }

    // Create Monday.com ticket
    try {
      const mondayTicketId = await MondayService.createTicket(repairTicket);

      if (mondayTicketId) {
        // Update repair ticket with Monday ticket ID
        await prisma.repairTicket.update({
          where: { id: repairTicket.id },
          data: { mondayTicketId },
        });

        console.log(
          `Created Monday.com ticket ${mondayTicketId} for repair ticket ${repairTicket.ticketNumber}`
        );
      } else {
        console.log(
          `Failed to create Monday.com ticket for repair ticket ${repairTicket.ticketNumber}`
        );
      }
    } catch (mondayError) {
      console.error("Monday.com ticket creation error:", mondayError);
    }

    return NextResponse.json({
      success: true,
      ticketId: repairTicket.id,
      ticketNumber: repairTicket.ticketNumber,
      message: "สร้างรายการแจ้งซ่อมสำเร็จ",
    });
  } catch (error) {
    console.error("Google Forms webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
