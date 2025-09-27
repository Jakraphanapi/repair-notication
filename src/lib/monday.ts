import axios from "axios";

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
      console.log("Creating ticket for repair ticket:", repairTicket);
      // Prepare ticket data
      const ticketName = `${repairTicket.ticketNumber} - ${repairTicket.title}`;

      // Extract device info from description (from Google Forms)
      const deviceInfo = repairTicket.description.includes('อุปกรณ์:')
        ? repairTicket.description.split('อุปกรณ์:')[1]?.split('\n')[0]?.trim() || "ไม่ระบุ"
        : "ไม่ระบุ";

      // Prepare column values
      const columnValues = {
        "Project": deviceInfo, // ข้อมูลเครื่องจาก Google Forms
        "บุคคลติดต่อ": repairTicket.user?.name || "",
        "บริษัท/หน่วยงาน": repairTicket.user?.email || repairTicket.userEmail || "",
        "เบอร์โทรศัพท์": repairTicket.user?.phone || "",
        "แผนก/สาขา": repairTicket.user?.department || "",
        "ยี่ห้อ": repairTicket.device?.model?.brand?.name || "ไม่ระบุ",
        "รุ่น": repairTicket.device?.model?.name || "ไม่ระบุ",
        "S/N": repairTicket.device?.serialNumber || "ไม่ระบุ",
      };

      // Convert column values to JSON string
      const columnValuesJson = JSON.stringify(columnValues);

      // Query to create item
      const query = `mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
        create_item (board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
          id
        }
      }`;

      // Make API call to Monday.com
      console.log("Sending to Monday.com:", {
        boardId: this.boardId,
        itemName: ticketName,
        columnValues: columnValuesJson,
      });

      const response = await axios.post(
        this.apiUrl,
        {
          query,
          variables: {
            boardId: this.boardId,
            itemName: ticketName,
            columnValues: columnValuesJson,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: this.apiToken,
          },
        }
      );

      console.log("Monday.com API response:", response.data);

      // Extract item ID from response
      const itemId = response.data?.data?.create_item?.id;
      if (!itemId) {
        console.error(
          "Failed to create Monday.com ticket, no item ID returned:",
          response.data
        );
        return null;
      }

      console.log(
        `Created Monday.com ticket: ${itemId} for ticket ${repairTicket.ticketNumber}`
      );
      return itemId;
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

      // Convert status to monday status
      const mondayStatus = this.mapStatusToMonday(status);

      // Prepare column values
      const columnValues = {
        status: { label: mondayStatus },
      };

      // Convert column values to JSON string
      const columnValuesJson = JSON.stringify(columnValues);

      // Query to update item
      const query = `mutation ($itemId: ID!, $columnValues: JSON!) {
        change_multiple_column_values (item_id: $itemId, board_id: ${this.boardId}, column_values: $columnValues) {
          id
        }
      }`;

      // Make API call to Monday.com
      const response = await axios.post(
        this.apiUrl,
        {
          query,
          variables: {
            itemId: ticketId,
            columnValues: columnValuesJson,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: this.apiToken,
          },
        }
      );

      // Check if update was successful
      const updatedItemId =
        response.data?.data?.change_multiple_column_values?.id;
      if (!updatedItemId) {
        console.error(
          "Failed to update Monday.com ticket status:",
          response.data
        );
        return false;
      }

      console.log(`Updated Monday.com ticket ${ticketId} to status ${status}`);
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
      PENDING: "งานเข้าใหม่",
      IN_PROGRESS: "กำลังทำงาน",
      WAITING_PARTS: "รอใบสั่งซื้อ",
      COMPLETED: "เสร็จเรียบร้อย",
      CANCELLED: "ยกเลิกการซ่อม",
    };
    return statusMap[status] || "งานเข้าใหม่";
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
      งานเข้าใหม่: "PENDING",
      กำลังทำงาน: "IN_PROGRESS",
      รอใบสั่งซื้อ: "WAITING_PARTS",
      เสร็จเรียบร้อย: "COMPLETED",
      ยกเลิกการซ่อม: "CANCELLED",
      นัดวันเข้างานแล้ว: "PENDING",
      งานค้าง: "IN_PROGRESS",
      ล่าช้า: "IN_PROGRESS",
    };
    return statusMap[mondayStatus] || "PENDING";
  }

  static async getBoardColumns(): Promise<any> {
    try {
      if (!this.apiToken || !this.boardId) {
        console.error("Monday.com API token or board ID not configured");
        return null;
      }

      const query = `query ($boardId: ID!) {
        boards(ids: [$boardId]) {
          id
          name
          columns {
            id
            title
            type
            settings_str
          }
        }
      }`;

      const response = await axios.post(
        this.apiUrl,
        {
          query,
          variables: {
            boardId: this.boardId,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: this.apiToken,
          },
        }
      );

      console.log("Monday.com board columns:", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error("Error getting Monday.com board columns:", error);
      return null;
    }
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
