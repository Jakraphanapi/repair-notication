import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Handle Google OAuth callback and link LINE UID if available
 */
export async function POST(request: NextRequest) {
    try {
        const { userEmail, googleUid, lineUid } = await request.json();

        if (!userEmail || !googleUid) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: userEmail },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Update user with LINE UID if provided and not already set
        if (lineUid && !user.lineUserId) {
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: { lineUserId: lineUid },
            });

            console.log(`Linked LINE UID ${lineUid} to user ${userEmail}`);

            return NextResponse.json({
                success: true,
                message: "LINE UID linked successfully",
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    lineUserId: updatedUser.lineUserId,
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: "User found, no LINE UID update needed",
            user: {
                id: user.id,
                email: user.email,
                lineUserId: user.lineUserId,
            },
        });
    } catch (error) {
        console.error("Google callback error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
