"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLiff } from "@/hooks/useLiff";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function RepairPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [googleFormUrl, setGoogleFormUrl] = useState<string>("");

    const { isLiffReady, lineProfile, lineUid, isInLineClient } = useLiff();

    // Handle authentication redirect
    useEffect(() => {
        if (status === "loading") return;

        // For LINE users, they can proceed without being logged in
        // For browser users, require authentication
        if (!isInLineClient && !session) {
            router.push("/auth/signin");
            return;
        }
    }, [session, status, router, isInLineClient]);

    useEffect(() => {
        // Set up Google Form URL with pre-filled data
        const setupGoogleForm = () => {
            const baseUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;
            if (!baseUrl) {
                toast.error("Google Form URL ไม่ได้ตั้งค่า");
                return;
            }

            try {
                const url = new URL(baseUrl);

                // Add pre-filled parameters for better form experience
                url.searchParams.set("usp", "pp_url");

                // Pre-fill user data with priority: LINE profile > Session > Basic
                if (session?.user) {
                    url.searchParams.set("entry.email", session.user.email || "");
                    url.searchParams.set("entry.name", session.user.name || "");
                    url.searchParams.set("entry.userId", session.user.id || "");
                }

                // LINE-specific data (if available)
                if (lineProfile) {
                    url.searchParams.set("entry.displayName", lineProfile.displayName);
                    url.searchParams.set("entry.pictureUrl", lineProfile.pictureUrl || "");
                }

                if (lineUid) {
                    url.searchParams.set("entry.lineUid", lineUid);
                }

                setGoogleFormUrl(url.toString());
            } catch (error) {
                console.error("Error setting up Google Form URL:", error);
                toast.error("เกิดข้อผิดพลาดในการเตรียมฟอร์ม");
            }
        };

        // Setup form when ready (for LINE) or when authenticated (for browser)
        if (isInLineClient && isLiffReady) {
            setupGoogleForm();
        } else if (!isInLineClient && session) {
            setupGoogleForm();
        }
    }, [session, lineProfile, lineUid, isLiffReady, isInLineClient]);

    const handleOpenGoogleForm = () => {
        if (!googleFormUrl) {
            toast.error("ฟอร์มยังไม่พร้อม กรุณารอสักครู่");
            return;
        }

        setIsLoading(true);

        // Open Google Form with appropriate method based on context
        if (isInLineClient) {
            // Open in same window for LINE LIFF
            window.location.href = googleFormUrl;
        } else {
            // Open in new tab for regular browsers
            window.open(googleFormUrl, "_blank");
            setIsLoading(false);
        }
    };

    const handleCopyFormLink = async () => {
        if (!googleFormUrl) {
            toast.error("ลิงก์ยังไม่พร้อม");
            return;
        }

        try {
            await navigator.clipboard.writeText(googleFormUrl);
            toast.success("คัดลอกลิงก์แล้ว!");
        } catch (error) {
            console.error("Error copying to clipboard:", error);
            toast.error("ไม่สามารถคัดลอกลิงก์ได้");
        }
    };

    const handleBackToMenu = () => {
        if (isInLineClient) {
            router.push("/line");
        } else {
            router.push("/");
        }
    };

    // Loading state
    if (status === "loading" || (isInLineClient && !isLiffReady)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Redirect state (authentication failed)
    if (!isInLineClient && !session) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 py-12 px-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🔧 แจ้งซ่อมออนไลน์
                    </h1>
                    <p className="text-gray-600">
                        ระบบใหม่ใช้ Google Forms เพื่อความสะดวกและรวดเร็ว
                    </p>
                </div>

                {/* Platform Indicator */}
                {isInLineClient ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">📱 ใช้งานใน LINE</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>เมื่อกดปุ่มฟอร์มจะเปิดในหน้าเดียวกัน</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        🔑 เข้าสู่ระบบสำเร็จ
                    </div>
                )}

                {/* User Info */}
                {(session?.user || lineProfile) && (
                    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                        <div className="flex items-center">
                            {(session?.user?.image || lineProfile?.pictureUrl) && (
                                <img
                                    src={session?.user?.image || lineProfile?.pictureUrl || ""}
                                    alt={session?.user?.name || lineProfile?.displayName || ""}
                                    className="w-12 h-12 rounded-full mr-4"
                                />
                            )}
                            <div>
                                <p className="font-medium text-gray-900">
                                    {session?.user?.name || lineProfile?.displayName}
                                </p>
                                {session?.user?.email && (
                                    <p className="text-sm text-gray-500">{session.user.email}</p>
                                )}
                                {lineUid && <p className="text-xs text-green-600">LINE เชื่อมต่อแล้ว</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Button */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {!googleFormUrl ? (
                        <div className="text-center">
                            <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                            <p className="text-gray-600">กำลังเตรียมฟอร์ม...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">ฟอร์มพร้อมใช้งาน</h3>
                                <p className="text-sm text-gray-600">
                                    ข้อมูลของคุณได้ถูกใส่ไว้ในฟอร์มแล้ว
                                    <br />
                                    คลิกเพื่อเปิดและกรอกรายละเอียดการซ่อม
                                </p>
                            </div>

                            <button
                                onClick={handleOpenGoogleForm}
                                disabled={isLoading}
                                className="w-full py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "กำลังเปิดฟอร์ม..." : "📝 เปิดฟอร์มแจ้งซ่อม"}
                            </button>

                            <button
                                onClick={handleCopyFormLink}
                                className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                📋 คัดลอกลิงก์ฟอร์ม
                            </button>

                            <div className="text-center">
                                <button
                                    onClick={handleBackToMenu}
                                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                                >
                                    ← กลับหน้าหลัก
                                </button>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="flex items-start">
                                    <svg className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-green-800">ยื่นแจ้งซ่อมผ่าน Google Forms</h4>
                                        <div className="mt-2 text-sm text-green-700">
                                            <p>• กรอกข้อมูลและแนบเอกสารได้สะดวก</p>
                                            <p>• ได้รับการตอบกลับผ่านระบบอัตโนมัติ</p>
                                            <p>• ติดตามสถานะได้ใน Monday.com</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        หากมีปัญหาในการใช้งาน โปรดติดต่อทีม IT
                    </p>
                </div>
            </div>
        </div>
    );
}
