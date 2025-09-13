// import axios from 'axios'

export interface MondayTicket {
  name: string;
  columnValues: Record<string, unknown>;
}

export class MondayService {
  private static apiToken = process.env.MONDAY_API_TOKEN;
  private static boardId = process.env.MONDAY_BOARD_ID;
  private static apiUrl = "https://api.monday.com/v2";

  static async createTicket(repairTicket: any): Promise<string | null> {
    try {
      if (!this.apiToken || !this.boardId) {
        console.error("Monday.com API token or board ID not configured");
        return null;
      }

      // Simplified implementation for now
      console.log("Would create Monday.com ticket:", repairTicket.ticketNumber);
      return null;
    } catch (error) {
      console.error("Error creating Monday.com ticket:", error);
      return null;
    }
  }

  static async updateTicketStatus(
    ticketId: string,
    status: string
  ): Promise<boolean> {
    try {
      if (!this.apiToken) {
        console.error("Monday.com API token not configured");
        return false;
      }

      console.log(
        `Would update Monday.com ticket ${ticketId} to status ${status}`
      );
      return true;
    } catch (error) {
      console.error("Error updating Monday.com ticket:", error);
      return false;
    }
  }

  static parseWebhookPayload(payload: any) {
    return {
      itemId: payload.event?.pulseId,
      boardId: payload.event?.boardId,
      columnId: payload.event?.columnId,
      previousValue: payload.event?.previousValue,
      value: payload.event?.value,
      eventType: payload.event?.type,
    };
  }

  private static mapStatusToMonday(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: "รอดำเนินการ",
      IN_PROGRESS: "กำลังดำเนินการ",
      WAITING_PARTS: "รออะไหล่",
      COMPLETED: "เสร็จสิ้น",
      CANCELLED: "ยกเลิก",
    };
    return statusMap[status] || "รอดำเนินการ";
  }

  private static mapPriorityToMonday(priority: string): string {
    const priorityMap: Record<string, string> = {
      LOW: "ต่ำ",
      MEDIUM: "ปานกลาง",
      HIGH: "สูง",
      URGENT: "เร่งด่วน",
    };
    return priorityMap[priority] || "ปานกลาง";
  }

  static mapMondayStatusToPrisma(mondayStatus: string): string {
    const statusMap: Record<string, string> = {
      รอดำเนินการ: "PENDING",
      กำลังดำเนินการ: "IN_PROGRESS",
      รออะไหล่: "WAITING_PARTS",
      เสร็จสิ้น: "COMPLETED",
      ยกเลิก: "CANCELLED",
    };
    return statusMap[mondayStatus] || "PENDING";
  }

  static async handleWebhook(payload: any): Promise<void> {
    try {
      console.log("Monday.com webhook received:", payload);
    } catch (error) {
      console.error("Error handling Monday.com webhook:", error);
    }
  }
}

export const mondayService = MondayService;
