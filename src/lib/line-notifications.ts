/**
 * LINE Messaging API utilities for sending notifications to specific users
 */

interface LineMessage {
  type: "text";
  text: string;
}

interface LinePushMessageBody {
  to: string; // LINE User ID
  messages: LineMessage[];
}

/**
 * Send LINE notification to a specific user using their LINE UID
 */
export async function sendLineNotificationToUser(
  lineUserId: string,
  message: string
): Promise<boolean> {
  try {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelAccessToken) {
      console.error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
      return false;
    }

    const body: LinePushMessageBody = {
      to: lineUserId,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    };

    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LINE API error:", response.status, errorText);
      return false;
    }

    console.log(`LINE notification sent successfully to user: ${lineUserId}`);
    return true;
  } catch (error) {
    console.error("Error sending LINE notification to user:", error);
    return false;
  }
}

/**
 * Send LINE notification to a group or channel
 */
export async function sendLineGroupNotification(
  message: string
): Promise<boolean> {
  try {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const groupId = process.env.LINE_GROUP_ID;

    if (!channelAccessToken || !groupId) {
      console.error(
        "LINE_CHANNEL_ACCESS_TOKEN or LINE_GROUP_ID is not configured"
      );
      return false;
    }

    const body: LinePushMessageBody = {
      to: groupId,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    };

    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LINE Group API error:", response.status, errorText);
      return false;
    }

    console.log("LINE group notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending LINE group notification:", error);
    return false;
  }
}

/**
 * Validate LINE User ID format
 */
export function isValidLineUserId(lineUserId: string): boolean {
  // LINE User ID typically starts with 'U' followed by 32 characters
  const lineUserIdRegex = /^U[0-9a-f]{32}$/i;
  return lineUserIdRegex.test(lineUserId);
}

/**
 * Send repair ticket notification to user
 */
export async function sendRepairTicketNotification(
  lineUserId: string,
  ticketInfo: {
    ticketNumber: string;
    title: string;
    status: string;
    description?: string;
    priority?: string;
  }
): Promise<boolean> {
  try {
    if (!isValidLineUserId(lineUserId)) {
      console.error("Invalid LINE User ID format:", lineUserId);
      return false;
    }

    const statusEmoji = getStatusEmoji(ticketInfo.status);
    const priorityEmoji = getPriorityEmoji(ticketInfo.priority);

    const message = `${statusEmoji} แจ้งเตือนสถานะการซ่อม

📋 หมายเลข: ${ticketInfo.ticketNumber}
🏷️ หัวข้อ: ${ticketInfo.title}
📊 สถานะ: ${ticketInfo.status}
${
  ticketInfo.priority
    ? `${priorityEmoji} ความสำคัญ: ${ticketInfo.priority}`
    : ""
}
${ticketInfo.description ? `📝 รายละเอียด: ${ticketInfo.description}` : ""}

🕐 เวลา: ${new Date().toLocaleString("th-TH")}`;

    return await sendLineNotificationToUser(lineUserId, message);
  } catch (error) {
    console.error("Error sending repair ticket notification:", error);
    return false;
  }
}

/**
 * Get emoji for repair status
 */
function getStatusEmoji(status: string): string {
  const statusEmojis: { [key: string]: string } = {
    PENDING: "⏳",
    IN_PROGRESS: "🔧",
    WAITING_PARTS: "📦",
    COMPLETED: "✅",
    CANCELLED: "❌",
    ON_HOLD: "⏸️",
  };

  return statusEmojis[status] || "📋";
}

/**
 * Get emoji for priority level
 */
function getPriorityEmoji(priority?: string): string {
  const priorityEmojis: { [key: string]: string } = {
    LOW: "🟢",
    MEDIUM: "🟡",
    HIGH: "🟠",
    URGENT: "🔴",
  };

  return priority ? priorityEmojis[priority] || "⚪" : "⚪";
}
