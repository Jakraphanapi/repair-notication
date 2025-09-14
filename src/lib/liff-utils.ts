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
 * Initialize LIFF
 */
export const initLiff = async (): Promise<boolean> => {
  try {
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
    if (!liffId) {
      console.error("LINE_LIFF_ID is not configured");
      return false;
    }

    await liff.init({ liffId });
    return true;
  } catch (error) {
    console.error("LIFF initialization failed:", error);
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
 */
export const login = (): void => {
  try {
    liff.login();
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
    return Promise.reject(error);
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
