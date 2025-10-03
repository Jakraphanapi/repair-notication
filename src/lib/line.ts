import { Client, MessageAPIResponseBase } from "@line/bot-sdk";
import axios from "axios";
// This directive ensures these modules are only imported and executed on the server
import "server-only";

// Configure the LINE client only when needed at runtime
const getClient = () => {
  const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
    channelSecret: process.env.LINE_CHANNEL_SECRET || "",
  };

  return new Client(config);
};

export interface RichMenuData {
  size: {
    width: number;
    height: number;
  };
  selected: boolean;
  name: string;
  chatBarText: string;
  areas: Array<{
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    action: {
      type: string;
      uri?: string;
      text?: string;
    };
  }>;
}

export class LineService {
  static async sendTextMessage(
    userId: string,
    message: string
  ): Promise<MessageAPIResponseBase> {
    const client = getClient();
    return client.pushMessage(userId, {
      type: "text",
      text: message,
    });
  }

  static async sendGroupMessage(
    groupId: string,
    message: string
  ): Promise<MessageAPIResponseBase> {
    const client = getClient();
    return client.pushMessage(groupId, {
      type: "text",
      text: message,
    });
  }

  static async sendRepairNotification(
    groupId: string,
    ticketData: any
  ): Promise<MessageAPIResponseBase> {
    const client = getClient();
    // Simplified message for now
    const message = {
      type: "text" as const,
      text: `🔧 การแจ้งซ่อมใหม่\n\nTicket: ${ticketData.ticketNumber
        }\nชื่อผู้แจ้ง: ${ticketData.user?.name || "N/A"}\nปัญหา: ${ticketData.title
        }\n\nรายละเอียด: ${ticketData.description}`,
    };

    return client.pushMessage(groupId, message);
  }

  static async createRichMenu(): Promise<string> {
    const richMenu: RichMenuData = {
      size: {
        width: 2500,
        height: 1686,
      },
      selected: false,
      name: "Repair System Menu",
      chatBarText: "เมนู",
      areas: [
        {
          bounds: {
            x: 0,
            y: 0,
            width: 1250,
            height: 843,
          },
          action: {
            type: "uri",
            uri: `${process.env.NEXTAUTH_URL}/repair`,
          },
        },
        {
          bounds: {
            x: 1250,
            y: 0,
            width: 1250,
            height: 843,
          },
          action: {
            type: "uri",
            uri: `${process.env.NEXTAUTH_URL}/tickets`,
          },
        },
        {
          bounds: {
            x: 0,
            y: 843,
            width: 1250,
            height: 843,
          },
          action: {
            type: "uri",
            uri: `${process.env.NEXTAUTH_URL}/profile`,
          },
        },
        {
          bounds: {
            x: 1250,
            y: 843,
            width: 1250,
            height: 843,
          },
          action: {
            type: "uri",
            uri: `${process.env.NEXTAUTH_URL}/help`,
          },
        },
      ],
    };

    const response = await axios.post(
      "https://api.line.me/v2/bot/richmenu",
      richMenu,
      {
        headers: {
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.richMenuId;
  }

  static async linkRichMenuToUser(
    userId: string,
    richMenuId: string
  ): Promise<void> {
    await axios.post(
      `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );
  }

  static async getUserProfile(userId: string) {
    try {
      const client = getClient();
      return await client.getProfile(userId);
    } catch (error) {
      console.error("Error getting LINE user profile:", error);
      return null;
    }
  }
}

// Export a function to get a client instance instead of exporting the client directly
export const getLineClient = getClient;
