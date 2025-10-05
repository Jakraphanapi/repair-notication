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
      const ticketName = `${repairTicket.ticketNumber} - ${repairTicket.title}`;

      // Extract device info from description (from Google Forms)
      deviceInfo = repairTicket.description.includes('อุปกรณ์:')
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

      googleFormData = extractGoogleFormData(repairTicket.description);

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

      // Create Google Drive attachment links for Monday.com
      const createGoogleDriveAttachmentLinks = (fileIds: string[]): string[] => {
        return fileIds.map(fileId => {
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

      // Add images if available (support multiple Files columns)
      if (imageUrls.length > 0) {
        // Create formatted text with Google Drive links for Monday.com attachment
        const imageText = attachmentUrls.map((url, index) =>
          `รูปภาพ ${index + 1}: ${url}`
        ).join("\n");

        // Detect available Files columns (prioritize "รูป/วีดิโอประกอบ")
        const availableFilesColumns = await this.detectFilesColumns();

        // Try to use detected Files columns first
        let filesColumnUsed = false;
        if (availableFilesColumns.length > 0) {
          // If there are multiple Files columns, prioritize "รูป/วีดิโอประกอบ" (files)
          if (availableFilesColumns.length > 1) {
            console.log(`Multiple Files columns available: ${availableFilesColumns.join(', ')}`);

            // Prioritize "files" column (รูป/วีดิโอประกอบ) for images
            const imageColumn = availableFilesColumns.find(id => id === 'files');
            if (imageColumn) {
              const filesData = attachmentUrls.map(url => ({
                url: url,
                name: `รูปภาพจาก Google Drive`
              }));
              columnValues[imageColumn] = filesData;
              filesColumnUsed = true;
              console.log(`Using prioritized image column: ${imageColumn} (รูป/วีดิโอประกอบ)`);
            } else {
              // Fallback: distribute images
              const distribution = this.distributeImagesAcrossColumns(attachmentUrls, availableFilesColumns);
              Object.entries(distribution).forEach(([columnId, filesData]) => {
                columnValues[columnId] = filesData;
                console.log(`Added ${filesData.length} images to column: ${columnId}`);
              });
              filesColumnUsed = true;
            }
          } else {
            // Single Files column - add all images (preferably "รูป/วีดิโอประกอบ")
            const filesData = attachmentUrls.map(url => ({
              url: url,
              name: `รูปภาพจาก Google Drive`
            }));

            columnValues[availableFilesColumns[0]] = filesData;
            filesColumnUsed = true;
            console.log(`Using Files column: ${availableFilesColumns[0]} (รูป/วีดิโอประกอบ)`);
          }
        } else {
          // Fallback: Try specific column IDs for "รูป/วีดิโอประกอบ" (based on your board structure)
          const possibleImageVideoColumns = [
            "files",             // รูป/วีดิโอประกอบ (from your board)
            "files6",            // เสนอราคา/งาน (also file type)
            "files9",            // เอกสารตรวจซ่อม/Invoice (also file type)
            "files2",            // คู่มือ (also file type)
            "รูป/วีดิโอประกอบ",  // Exact Thai name
            "รูปวีดิโอประกอบ",    // Without slash
            "รูปภาพ",            // Just images
            "วีดิโอ"             // Just video
          ];

          for (const columnId of possibleImageVideoColumns) {
            if (!filesColumnUsed) {
              const filesData = attachmentUrls.map(url => ({
                url: url,
                name: `รูปภาพจาก Google Drive`
              }));
              columnValues[columnId] = filesData;
              filesColumnUsed = true;
              console.log(`Using fallback column for รูป/วีดิโอประกอบ: ${columnId}`);
              break;
            }
          }
        }

        // Fallback: Add to text columns as well
        columnValues["text_images"] = imageText;
        columnValues["text_image_links"] = imageUrls.join("\n");

        // Add a note about manual attachment with instructions
        const currentDescription = columnValues["text"] || "";
        columnValues["text"] = `${currentDescription}\n\n📎 รูปภาพที่แนบ:\n${imageText}\n\n📋 วิธีแนบรูปภาพใน "รูป/วีดิโอประกอบ":\n1. คลิกที่ column "รูป/วีดิโอประกอบ" ใน Monday.com\n2. เลือก "From Google Drive" หรือ "From Link"\n3. ใช้ลิงก์ด้านบนเพื่อค้นหาไฟล์\n4. แนบไฟล์ที่เกี่ยวข้อง\n5. รูปภาพจะแสดงใน column "รูป/วีดิโอประกอบ"`;

        console.log("Added images to Monday.com:", {
          detected_files_columns: availableFilesColumns,
          files_column_used: filesColumnUsed,
          text_images: columnValues["text_images"],
          text_image_links: columnValues["text_image_links"],
          attachment_urls: attachmentUrls,
          updated_description: columnValues["text"]
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

      // Check for errors first
      if (response.data?.errors && response.data.errors.length > 0) {
        console.error("Monday.com API errors:", response.data.errors);

        // Try to create ticket without images if there's an error
        if (imageUrls.length > 0) {
          console.log("Retrying without images due to API error...");
          return await this.createTicketWithoutImages(repairTicket, googleFormData, deviceInfo);
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
          return await this.createTicketWithoutImages(repairTicket, googleFormData, deviceInfo);
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
        distribution[columnId] = columnImages.map(url => ({
          url: url,
          name: `รูปภาพจาก Google Drive`
        }));
      }
    });

    console.log("Distributed images across columns:", distribution);
    return distribution;
  }

  // Method to detect available Files columns
  static async detectFilesColumns(): Promise<string[]> {
    try {
      const columns = await this.getBoardColumns();
      if (!columns?.data?.boards?.[0]?.columns) {
        return [];
      }

      // Look for specific "รูป/วีดิโอประกอบ" column first
      const imageVideoColumn = columns.data.boards[0].columns
        .find((col: any) =>
          col.title.includes('รูป/วีดิโอประกอบ') ||
          col.title.includes('รูป') ||
          col.title.includes('วีดิโอ') ||
          col.title.includes('Image') ||
          col.title.includes('Video')
        );

      if (imageVideoColumn) {
        console.log(`Found specific image/video column: ${imageVideoColumn.title} (${imageVideoColumn.id})`);
        return [imageVideoColumn.id];
      }

      // Also check for "files" column specifically (based on your board structure)
      const filesColumn = columns.data.boards[0].columns
        .find((col: any) => col.id === 'files' && col.type === 'file');

      if (filesColumn) {
        console.log(`Found files column: ${filesColumn.title} (${filesColumn.id})`);
        return [filesColumn.id];
      }

      // Fallback: Look for any Files columns (including all file type columns from your board)
      const filesColumns = columns.data.boards[0].columns
        .filter((col: any) => col.type === 'file')
        .map((col: any) => col.id);

      console.log("Detected Files columns:", filesColumns);
      return filesColumns;
    } catch (error) {
      console.error("Error detecting Files columns:", error);
      return [];
    }
  }

  // Method to upload files to Monday.com (for future use)
  static async uploadFileToMonday(
    fileUrl: string,
    fileName: string,
    itemId: string
  ): Promise<boolean> {
    try {
      // This would require implementing multipart/form-data upload
      // For now, we'll use text-based approach
      console.log(`Would upload file: ${fileName} from ${fileUrl} to item ${itemId}`);
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
        "name": deviceInfo,
        "text_mkw33zz3": repairTicket.user?.name || "",
        "text0": googleFormData.company || repairTicket.user?.email || "",
        "text_mkw39nxa": repairTicket.user?.phone || "",
        "text_mkw1pwsa": googleFormData.department || repairTicket.user?.department || "",
        "text_14": googleFormData.brand || repairTicket.device?.model?.brand?.name || "ไม่ระบุ",
        "text_17": googleFormData.model || repairTicket.device?.model?.name || "ไม่ระบุ",
        "text1": googleFormData.serialNumber || repairTicket.device?.serialNumber || "ไม่ระบุ",
        "status": { label: this.mapStatusToMonday(repairTicket.status) },
        "text": repairTicket.description,
        "text89": `${repairTicket.user?.name || ""} ${repairTicket.user?.email || ""}`,
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
