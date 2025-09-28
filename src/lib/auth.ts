import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
// import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma";
import { retrieveLineUidFromSession, retrieveLineUidFromLocalStorage } from "@/lib/auth-utils";
// import { UserRole } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Commented out for now due to type conflicts
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "line",
      name: "LINE",
      credentials: {
        lineUid: { label: "LINE UID", type: "text" },
        displayName: { label: "Display Name", type: "text" },
        email: { label: "Email", type: "email" },
        pictureUrl: { label: "Picture URL", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.lineUid || !credentials?.displayName) {
            return null;
          }

          // Check if user exists with this LINE UID
          let user = await prisma.user.findFirst({
            where: { lineUserId: credentials.lineUid },
          });

          if (!user) {
            // Create new user with LINE UID
            user = await prisma.user.create({
              data: {
                lineUserId: credentials.lineUid,
                name: credentials.displayName,
                email:
                  credentials.email ||
                  `line_${credentials.lineUid}@example.com`,
                image: credentials.pictureUrl || null,
                role: "USER",
              },
            });
          } else {
            // Update user info from LINE
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                name: credentials.displayName,
                email: credentials.email || user.email,
                image: credentials.pictureUrl || user.image,
              },
            });
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error("LINE authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Extract LINE UID from profile, user data, or storage
          let lineUid = (profile as any)?.lineUid || (user as any)?.lineUid;

          // If no LINE UID in profile/user data, try to get from storage
          if (!lineUid && typeof window !== 'undefined') {
            // Try session storage first (for URL parameters)
            lineUid = retrieveLineUidFromSession();

            // If not in session storage, try localStorage (for LIFF)
            if (!lineUid) {
              lineUid = retrieveLineUidFromLocalStorage();
            }
          }

          // Check if user exists in database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Create new user if doesn't exist
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name!,
                image: user.image,
                role: "USER",
                // Store LINE UID if available
                lineUserId: lineUid || null,
              },
            });

            // Create account record to store Google UID
            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId, // This is the Google UID
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });

            // Log LINE UID linking if successful
            if (lineUid) {
              console.log(`Created new user with LINE UID: ${lineUid} for email: ${user.email}`);
            }
          } else {
            // Check if account already linked
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: existingUser.id,
                provider: "google",
              },
            });

            if (!existingAccount) {
              // Link Google account to existing user
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId, // This is the Google UID
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              });
            }

            // Update profile image and LINE UID from Google if available
            const updateData: any = {
              image: user.image,
            };

            // Update LINE UID if available and not already set
            if (lineUid && !existingUser.lineUserId) {
              updateData.lineUserId = lineUid;
              console.log(`Linked LINE UID: ${lineUid} to existing user: ${user.email}`);
            }

            await prisma.user.update({
              where: { id: existingUser.id },
              data: updateData,
            });
          }
          return true;
        } catch (error) {
          console.error("Error during Google sign in:", error);
          // Still allow sign in even if database operations fail
          return true;
        }
      }

      if (account?.provider === "line") {
        // LINE authentication is handled in the authorize callback
        return true;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        // Get user data from database for Google users
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            role: true,
            phone: true,
            lineUserId: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.phone = dbUser.phone ?? undefined;
          token.lineUserId = dbUser.lineUserId ?? undefined;
          token.sub = dbUser.id;
        }
      }

      if (account?.provider === "line" && user) {
        // Get user data from database for LINE users
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
            phone: true,
            lineUserId: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.phone = dbUser.phone ?? undefined;
          token.lineUserId = dbUser.lineUserId ?? undefined;
          token.sub = dbUser.id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.phone = token.phone as string;
        session.user.lineUserId = token.lineUserId as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === "development",
};
