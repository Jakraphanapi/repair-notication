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
    // Declare variables at function scope for error handling
    let imageUrls: string[] = [];
    let googleFormData: any = {};
    let deviceInfo: string = "";

    try {
      if (!this.apiToken || !this.boardId) {
        console.error("Monday.com API token or board ID not configured");
        return null;
      }
      console.log("Creating ticket for repair ticket:", repairTicket);
      // Prepare ticket data
      const ticketName = `${repairTicket.title}`;

      // Extract device info from description (from Google Forms)
      deviceInfo = repairTicket.description.includes("อุปกรณ์:")
        ? repairTicket.description
          .split("อุปกรณ์:")[1]
          ?.split("\n")[0]
          ?.trim() || "ไม่ระบุ"
        : "ไม่ระบุ";

      // Extract additional data from Google Form description
      const extractGoogleFormData = (description: string) => {
        const data: any = {};

        // Extract name
        const nameMatch = description.match(/ชื่อผู้แจ้ง:\s*([^\n]+)/);
        if (nameMatch) data.name = nameMatch[1].trim();

        // Extract phone
        const phoneMatch = description.match(/เบอร์โทรศัพท์:\s*([^\n]+)/);
        if (phoneMatch) data.phone = phoneMatch[1].trim();

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

      googleFormData = extractGoogleFormData(repairTicket.description);

      console.log("Extracted Google Form data:", googleFormData);

      // Convert Google Drive file IDs to URLs
      const convertGoogleDriveIdsToUrls = (fileIds: string[]): string[] => {
        return fileIds.map((fileId) => {
          // Google Drive file ID to direct download URL
          // Using direct download format for better accessibility
          return `https://drive.google.com/uc?export=view&id=${fileId}`;
        });
      };

      // Alternative: Create shareable links
      const createShareableLinks = (fileIds: string[]): string[] => {
        return fileIds.map((fileId) => {
          return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
        });
      };

      // Create Google Drive attachment links for Monday.com
      const createGoogleDriveAttachmentLinks = (
        fileIds: string[]
      ): string[] => {
        return fileIds.map((fileId) => {
          // Format for Monday.com Google Drive integration
          return `https://drive.google.com/file/d/${fileId}/view`;
        });
      };

      // Process images if available
      let shareableUrls: string[] = [];
      let attachmentUrls: string[] = [];
      if (repairTicket.images && repairTicket.images.length > 0) {
        imageUrls = convertGoogleDriveIdsToUrls(repairTicket.images);
        shareableUrls = createShareableLinks(repairTicket.images);
        attachmentUrls = createGoogleDriveAttachmentLinks(repairTicket.images);
        console.log("Converted image URLs (direct):", imageUrls);
        console.log("Converted image URLs (shareable):", shareableUrls);
        console.log("Converted image URLs (attachment):", attachmentUrls);
      }

      // Prepare column values using actual Monday.com column IDs
      const columnValues: any = {
        name: deviceInfo, // ชื่อหลักของ item
        text_mkw33zz3: googleFormData.name || repairTicket.user?.name || "", // บุคคลติดต่อ
        text0: googleFormData.company || repairTicket.user?.email || "", // บริษัท/หน่วยงาน
        text_mkw39nxa: googleFormData.phone || repairTicket.user?.phone || "", // เบอร์โทรศัพท์
        text_mkw1pwsa:
          googleFormData.department || repairTicket.user?.department || "", // แผนก/สาขา
        text_14:
          googleFormData.brand ||
          repairTicket.device?.model?.brand?.name ||
          "ไม่ระบุ", // ยี่ห้อ
        text_17:
          googleFormData.model || repairTicket.device?.model?.name || "ไม่ระบุ", // รุ่น
        text1:
          googleFormData.serialNumber ||
          repairTicket.device?.serialNumber ||
          "ไม่ระบุ", // S/N
        status: { label: this.mapStatusToMonday(repairTicket.status) }, // สถานะงาน
        text: repairTicket.description, // ปฎิบัติงาน / อาการ
        text89: `${googleFormData.name || repairTicket.user?.name || ""} ${googleFormData.phone || repairTicket.user?.phone || ""
          }`, // ติดต่อชื่อ เบอร์
      };

      // Add images if available (support multiple Files columns)
      if (imageUrls.length > 0) {
        // Create formatted text with Google Drive links for Monday.com attachment
        const imageText = attachmentUrls
          .map((url, index) => `รูปภาพ ${index + 1}: ${url}`)
          .join("\n");

        // Option 1: Use text-based approach (current method)
        const useTextBasedApproach = true; // Set to false to try file upload

        if (useTextBasedApproach) {
          // Keep description clean - only device description with instruction text
          const instructionText = `\n\n📋 วิธีแนบรูปภาพใน "รูป/วีดิโอประกอบ":\n1. คลิกที่ column "รูป/วีดิโอประกอบ" ใน Monday.com\n2. เลือก "From Google Drive" หรือ "From Link"\n3. ใช้ลิงก์ด้านบนเพื่อค้นหาไฟล์\n4. แนบไฟล์ที่เกี่ยวข้อง\n5. รูปภาพจะแสดงใน column "รูป/วีดิโอประกอบ"`;

          columnValues["text"] = repairTicket.description + instructionText;
 
          // Add image links to dedicated text columns for easy access
          columnValues["text_images"] = imageText;
          columnValues["text_image_links"] = attachmentUrls.join("\n");

          console.log(
            "Added image links to description and text columns (Monday.com Files API doesn't support Google Drive URLs directly)"
          );
        } else {
          // Option 2: Try to upload files directly (experimental)
          console.log("Attempting to upload files directly to Monday.com...");
          // Note: This would require the ticket to be created first, then files uploaded
          // For now, we'll still use text-based approach as fallback
          columnValues["text"] = repairTicket.description;
          columnValues["text_images"] = imageText;
          columnValues["text_image_links"] = attachmentUrls.join("\n");
        }
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

      console.log(
        "Column values object:",
        JSON.stringify(columnValues, null, 2)
      );
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

      // Check for errors first
      if (response.data?.errors && response.data.errors.length > 0) {
        console.error("Monday.com API errors:", response.data.errors);

        // Try to create ticket without images if there's an error
        if (imageUrls.length > 0) {
          console.log("Retrying without images due to API error...");
          return await this.createTicketWithoutImages(
            repairTicket,
            googleFormData,
            deviceInfo
          );
        }

        return null;
      }

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

      // If there's an error and we have images, try without images
      if (imageUrls && imageUrls.length > 0) {
        console.log("Caught error, retrying without images...");
        try {
          return await this.createTicketWithoutImages(
            repairTicket,
            googleFormData,
            deviceInfo
          );
        } catch (retryError) {
          console.error("Error in retry without images:", retryError);
        }
      }

      return null;
    }
  }

  // Method to distribute images across multiple Files columns
  static distributeImagesAcrossColumns(
    imageUrls: string[],
    filesColumns: string[]
  ): Record<string, any[]> {
    const distribution: Record<string, any[]> = {};

    if (filesColumns.length === 0 || imageUrls.length === 0) {
      return distribution;
    }

    // Distribute images evenly across available Files columns
    const imagesPerColumn = Math.ceil(imageUrls.length / filesColumns.length);

    filesColumns.forEach((columnId, columnIndex) => {
      const startIndex = columnIndex * imagesPerColumn;
      const endIndex = Math.min(startIndex + imagesPerColumn, imageUrls.length);
      const columnImages = imageUrls.slice(startIndex, endIndex);

      if (columnImages.length > 0) {
        distribution[columnId] = columnImages.map((url) => ({
          url: url,
          name: `รูปภาพจาก Google Drive`,
        }));
      }
    });

    console.log("Distributed images across columns:", distribution);
    return distribution;
  }

  // Method to upload files to Monday.com
  static async uploadFileToMonday(
    fileUrl: string,
    fileName: string,
    _itemId: string
  ): Promise<boolean> {
    try {
      if (!this.apiToken) {
        console.error("Monday.com API token not configured");
        return false;
      }

      // Download file from Google Drive URL
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        console.error(`Failed to download file from ${fileUrl}`);
        return false;
      }

      const fileBuffer = await fileResponse.arrayBuffer();
      const fileBlob = new Blob([fileBuffer]);

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("file", fileBlob, fileName);

      // Upload to Monday.com
      const uploadResponse = await fetch(`${this.apiUrl}/file`, {
        method: "POST",
        headers: {
          Authorization: this.apiToken,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(
          `Monday.com file upload failed: ${uploadResponse.status} ${errorText}`
        );
        return false;
      }

      const uploadResult = await uploadResponse.json();
      console.log(`File uploaded successfully: ${uploadResult.data?.id}`);
      return true;
    } catch (error) {
      console.error("Error uploading file to Monday.com:", error);
      return false;
    }
  }

  // Fallback method to create ticket without images
  private static async createTicketWithoutImages(
    repairTicket: any,
    googleFormData: any,
    deviceInfo: string
  ): Promise<string | null> {
    try {
      const ticketName = `${repairTicket.ticketNumber} - ${repairTicket.title}`;

      // Prepare column values without images
      const columnValues = {
        name: deviceInfo,
        text_mkw33zz3: googleFormData.name || repairTicket.user?.name || "",
        text0: googleFormData.company || repairTicket.user?.email || "",
        text_mkw39nxa: googleFormData.phone || repairTicket.user?.phone || "",
        text_mkw1pwsa:
          googleFormData.department || repairTicket.user?.department || "",
        text_14:
          googleFormData.brand ||
          repairTicket.device?.model?.brand?.name ||
          "ไม่ระบุ",
        text_17:
          googleFormData.model || repairTicket.device?.model?.name || "ไม่ระบุ",
        text1:
          googleFormData.serialNumber ||
          repairTicket.device?.serialNumber ||
          "ไม่ระบุ",
        status: { label: this.mapStatusToMonday(repairTicket.status) },
        text: repairTicket.description,
        text89: `${googleFormData.name || repairTicket.user?.name || ""} ${googleFormData.phone || repairTicket.user?.phone || ""
          }`,
      };

      const columnValuesJson = JSON.stringify(columnValues);
      const query = `mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
        create_item (board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
          id
        }
      }`;

      console.log("Retrying Monday.com creation without images...");

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

      console.log("Monday.com retry response:", response.data);

      const itemId = response.data?.data?.create_item?.id;
      if (itemId) {
        console.log(`Created Monday.com ticket without images: ${itemId}`);
        return itemId;
      }

      return null;
    } catch (error) {
      console.error("Error creating Monday.com ticket without images:", error);
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

      console.log(
        "Monday.com board columns:",
        JSON.stringify(response.data, null, 2)
      );
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
