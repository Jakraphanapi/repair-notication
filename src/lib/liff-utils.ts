import { liff } from "@line/liff";

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LiffProfile extends LineProfile {
  email?: string;
}

/**
 * Check network connectivity to LINE servers
 */
export const checkLineConnectivity = async (): Promise<boolean> => {
  try {
    // ตรวจสอบการเชื่อมต่อกับ LINE servers
    await fetch('https://access.line.me/.well-known/openid_configuration', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch (error) {
    console.error("Cannot connect to LINE servers:", error);
    return false;
  }
};

/**
 * Initialize LIFF
 */
export const initLiff = async (): Promise<boolean> => {
  try {
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
    if (!liffId) {
      console.error("LINE_LIFF_ID is not configured");
      return false;
    }

    console.log("Initializing LIFF with ID:", liffId);

    // เพิ่มการตั้งค่าเพิ่มเติมสำหรับ LIFF
    const initOptions = {
      liffId,
      // เพิ่ม redirectUri เพื่อให้ LIFF รู้ว่าจะ redirect ไปที่ไหน
      redirectUri: typeof window !== 'undefined' ? window.location.origin + '/line' : undefined,
    };

    const initPromise = liff.init(initOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('LIFF init timeout')), 15000) // เพิ่มเป็น 15 วินาที
    );

    await Promise.race([initPromise, timeoutPromise]);

    console.log("LIFF initialized successfully");
    return true;
  } catch (error) {
    console.error("LIFF initialization failed:", error);

    // จัดการ error แบบเฉพาะเจาะจง
    if (error instanceof Error) {
      if (error.message.includes('access.line.me')) {
        console.error("Cannot access LINE authentication server");
        return false;
      }

      if (error.message === 'LIFF init timeout') {
        console.log("Retrying LIFF initialization...");
        await new Promise(resolve => setTimeout(resolve, 3000)); // เพิ่มเป็น 3 วินาที
        try {
          const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
          if (!liffId) return false;

          const retryOptions = {
            liffId,
            redirectUri: typeof window !== 'undefined' ? window.location.origin + '/line' : undefined,
          };

          await liff.init(retryOptions);
          console.log("LIFF initialized on retry");
          return true;
        } catch (retryError) {
          console.error("LIFF retry failed:", retryError);
        }
      }
    }

    return false;
  }
};

/**
 * Check if user is logged in to LINE
 */
export const isLoggedIn = (): boolean => {
  try {
    return liff.isLoggedIn();
  } catch (error) {
    console.error("Error checking login status:", error);
    return false;
  }
};

/**
 * Login to LINE
 * @param redirectUri Optional URL to return to after LINE login
 */
export const login = (redirectUri?: string): void => {
  try {
    if (redirectUri) {
      liff.login({ redirectUri });
    } else {
      liff.login();
    }
  } catch (error) {
    console.error("LINE login error:", error);
  }
};

/**
 * Logout from LINE
 */
export const logout = (): void => {
  try {
    liff.logout();
  } catch (error) {
    console.error("LINE logout error:", error);
  }
};

/**
 * Get LINE user profile including UID
 */
export const getLineProfile = async (): Promise<LineProfile | null> => {
  try {
    if (!isLoggedIn()) {
      console.warn("User is not logged in to LINE");
      return null;
    }

    const profile = await liff.getProfile();
    return {
      userId: profile.userId, // This is the LINE UID
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    };
  } catch (error) {
    console.error("Error getting LINE profile:", error);
    return null;
  }
};

/**
 * Get decoded ID token (includes email if scope is granted)
 */
export const getIdToken = (): string | null => {
  try {
    return liff.getIDToken();
  } catch (error) {
    console.error("Error getting ID token:", error);
    return null;
  }
};

/**
 * Decode ID token to get email and other info
 */
export const decodeIdToken = (idToken: string): any => {
  try {
    const base64Url = idToken.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding ID token:", error);
    return null;
  }
};

/**
 * Get complete LIFF profile including email if available
 */
export const getLiffProfile = async (): Promise<LiffProfile | null> => {
  try {
    const lineProfile = await getLineProfile();
    if (!lineProfile) return null;

    const idToken = getIdToken();
    let email: string | undefined;

    if (idToken) {
      const decodedToken = decodeIdToken(idToken);
      email = decodedToken?.email;
    }

    return {
      ...lineProfile,
      email,
    };
  } catch (error) {
    console.error("Error getting LIFF profile:", error);
    return null;
  }
};

/**
 * Check if running in LIFF browser
 */
export const isInClient = (): boolean => {
  try {
    return liff.isInClient();
  } catch (error) {
    console.error("Error checking LIFF client:", error);
    return false;
  }
};

/**
 * Close LIFF window
 */
export const closeLiff = (): void => {
  try {
    if (isInClient()) {
      liff.closeWindow();
    }
  } catch (error) {
    console.error("Error closing LIFF window:", error);
  }
};

/**
 * Send message to LINE chat
 */
export const sendMessage = (message: string): Promise<void> => {
  try {
    if (!isInClient()) {
      console.warn("Cannot send message outside of LINE client");
      return Promise.resolve();
    }

    return liff.sendMessages([
      {
        type: "text",
        text: message,
      },
    ]);
  } catch (error) {
    console.error("Error sending message:", error);
    return Promise.reject(new Error(`Failed to send message: ${error}`));
  }
};

/**
 * Get LINE UID for current user
 */
export const getCurrentLineUid = async (): Promise<string | null> => {
  try {
    const profile = await getLineProfile();
    return profile?.userId || null;
  } catch (error) {
    console.error("Error getting current LINE UID:", error);
    return null;
  }
};

/**
 * Open URL while staying inside LIFF if possible
 */
export const openUrl = (url: string): void => {
  try {
    if (isInClient()) {
      // Keep navigation inside LIFF webview
      liff.openWindow({ url, external: false });
    } else {
      // Fallback for normal browsers
      window.location.href = url;
    }
  } catch (error) {
    console.error("Error opening URL:", error);
    // Best-effort fallback
    try {
      window.location.href = url;
    } catch { }
  }
};
