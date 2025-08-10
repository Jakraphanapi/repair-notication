import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
// import { UserRole } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Commented out for now due to type conflicts
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            lineUserId: true,
            password: true,
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password || ""
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone ?? undefined,
          lineUserId: user.lineUserId ?? undefined,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.phone = user.phone;
        token.lineUserId = user.lineUserId;
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
  },
  pages: {
    signIn: "/auth/signin",
  },
};
