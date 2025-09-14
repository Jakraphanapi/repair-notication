import { prisma } from "@/lib/prisma";

/**
 * Get Google UID for a user by their email
 * @param email User's email address
 * @returns Google UID (providerAccountId) or null if not found
 */
export async function getGoogleUidByEmail(
  email: string
): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: {
            provider: "google",
          },
          select: {
            providerAccountId: true,
          },
        },
      },
    });

    return user?.accounts[0]?.providerAccountId || null;
  } catch (error) {
    console.error("Error fetching Google UID:", error);
    return null;
  }
}

/**
 * Get Google UID for a user by their user ID
 * @param userId User's internal ID
 * @returns Google UID (providerAccountId) or null if not found
 */
export async function getGoogleUidByUserId(
  userId: string
): Promise<string | null> {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: "google",
      },
      select: {
        providerAccountId: true,
      },
    });

    return account?.providerAccountId || null;
  } catch (error) {
    console.error("Error fetching Google UID:", error);
    return null;
  }
}

/**
 * Get all Google account details for a user
 * @param userId User's internal ID
 * @returns Account object with Google details or null if not found
 */
export async function getGoogleAccountByUserId(userId: string) {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: "google",
      },
    });

    return account;
  } catch (error) {
    console.error("Error fetching Google account:", error);
    return null;
  }
}

/**
 * Check if a user has a Google account linked
 * @param userId User's internal ID
 * @returns boolean indicating if Google account is linked
 */
export async function hasGoogleAccount(userId: string): Promise<boolean> {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: "google",
      },
    });

    return !!account;
  } catch (error) {
    console.error("Error checking Google account:", error);
    return false;
  }
}
