import { NextRequest, NextResponse } from "next/server";
import { MondayService } from "@/lib/monday";

export async function GET(request: NextRequest) {
    try {
        const columns = await MondayService.getBoardColumns();

        if (!columns) {
            return NextResponse.json(
                { error: "Failed to get Monday.com board columns" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            columns: columns.data?.boards?.[0]?.columns || [],
            boardName: columns.data?.boards?.[0]?.name || "",
        });
    } catch (error) {
        console.error("Error getting Monday.com columns:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
