import { NextResponse } from "next/server";
import { MondayService } from "@/lib/monday";

export async function GET() {
    try {
        // Test Monday.com API connection
        const columns = await MondayService.getBoardColumns();

        if (!columns) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to connect to Monday.com API",
                    details: "Check API token and board ID configuration"
                },
                { status: 500 }
            );
        }

        // Detect Files columns specifically
        const filesColumns = columns.data?.boards?.[0]?.columns
            ?.filter((col: any) => col.type === 'file')
            ?.map((col: any) => col.id) || [];

        return NextResponse.json({
            success: true,
            message: "Monday.com API connection successful",
            boardName: columns.data?.boards?.[0]?.name || "Unknown",
            columnCount: columns.data?.boards?.[0]?.columns?.length || 0,
            filesColumns: filesColumns,
            allColumns: columns.data?.boards?.[0]?.columns?.map((col: { id: any; title: any; type: any; }) => ({
                id: col.id,
                title: col.title,
                type: col.type,
                isImageVideoColumn: col.title.includes('รูป/วีดิโอประกอบ') || col.title.includes('รูป') || col.title.includes('วีดิโอ')
            })) || []
        });
    } catch (error) {
        console.error("Monday.com API test error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Monday.com API test failed",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
