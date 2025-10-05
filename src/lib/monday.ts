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

      // Extract additional data from Google Form description
      const extractGoogleFormData = (description: string) => {
        const data: any = {};

        // Extract company
        const companyMatch = description.match(/บริษัท\/หน่วยงาน:\s*([^\n]+)/);
        if (companyMatch) data.company = companyMatch[1].trim();

        // Extract department
        const deptMatch = description.match(/แผนก\/สาขา:\s*([^\n]+)/);
        if (deptMatch) data.department = deptMatch[1].trim();

        // Extract brand
        const brandMatch = description.match(/ยี่ห้อ:\s*([^\n]+)/);
        if (brandMatch) data.brand = brandMatch[1].trim();

        // Extract model
        const modelMatch = description.match(/รุ่น:\s*([^\n]+)/);
        if (modelMatch) data.model = modelMatch[1].trim();

        // Extract serial number
        const serialMatch = description.match(/S\/N:\s*([^\n]+)/);
        if (serialMatch) data.serialNumber = serialMatch[1].trim();

        return data;
      };

      const googleFormData = extractGoogleFormData(repairTicket.description);

      console.log("Extracted Google Form data:", googleFormData);

      // Convert Google Drive file IDs to URLs
      const convertGoogleDriveIdsToUrls = (fileIds: string[]): string[] => {
        return fileIds.map(fileId => {
          // Google Drive file ID to direct download URL
          // Using direct download format for better accessibility
          return `https://drive.google.com/uc?export=view&id=${fileId}`;
        });
      };

      // Alternative: Create shareable links
      const createShareableLinks = (fileIds: string[]): string[] => {
        return fileIds.map(fileId => {
          return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
        });
      };

      // Process images if available
      let imageUrls: string[] = [];
      let shareableUrls: string[] = [];
      if (repairTicket.images && repairTicket.images.length > 0) {
        imageUrls = convertGoogleDriveIdsToUrls(repairTicket.images);
        shareableUrls = createShareableLinks(repairTicket.images);
        console.log("Converted image URLs (direct):", imageUrls);
        console.log("Converted image URLs (shareable):", shareableUrls);
      }

      // Prepare column values using actual Monday.com column IDs
      const columnValues: any = {
        "name": deviceInfo, // ชื่อหลักของ item
        "text_mkw33zz3": repairTicket.user?.name || "", // บุคคลติดต่อ
        "text0": googleFormData.company || repairTicket.user?.email || "", // บริษัท/หน่วยงาน
        "text_mkw39nxa": repairTicket.user?.phone || "", // เบอร์โทรศัพท์
        "text_mkw1pwsa": googleFormData.department || repairTicket.user?.department || "", // แผนก/สาขา
        "text_14": googleFormData.brand || repairTicket.device?.model?.brand?.name || "ไม่ระบุ", // ยี่ห้อ
        "text_17": googleFormData.model || repairTicket.device?.model?.name || "ไม่ระบุ", // รุ่น
        "text1": googleFormData.serialNumber || repairTicket.device?.serialNumber || "ไม่ระบุ", // S/N
        "status": { label: this.mapStatusToMonday(repairTicket.status) }, // สถานะงาน
        "text": repairTicket.description, // ปฎิบัติงาน / อาการ
        "text89": `${repairTicket.user?.name || ""} ${repairTicket.user?.email || ""}`, // ติดต่อชื่อ เบอร์
      };

      // Add images if available
      if (imageUrls.length > 0) {
        // Method 1: Try to add as files column (if exists)
        columnValues["files"] = imageUrls.map(url => ({ url }));

        // Method 2: Add shareable links as text field
        columnValues["text_images"] = shareableUrls.join("\n");

        // Method 3: Add direct links as another text field
        columnValues["text_image_links"] = imageUrls.join("\n");

        console.log("Added images to Monday.com:", {
          files: columnValues["files"],
          text_images: columnValues["text_images"],
          text_image_links: columnValues["text_image_links"]
        });
      }

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

      console.log("Column values object:", JSON.stringify(columnValues, null, 2));
      console.log("Column values JSON:", columnValuesJson);

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
