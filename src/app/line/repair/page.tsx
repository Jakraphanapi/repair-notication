"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLiff } from "@/hooks/useLiff";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LineRepairFormPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [googleFormUrl, setGoogleFormUrl] = useState<string>("");

  const { isLiffReady, lineProfile, lineUid, isInLineClient } = useLiff();

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

        // Add pre-filled parameters
        url.searchParams.set("usp", "pp_url");

        // Pre-fill user data if available
        if (session?.user) {
          url.searchParams.set("entry.email", session.user.email || "");
          url.searchParams.set("entry.name", session.user.name || "");
        }

        if (lineProfile) {
          url.searchParams.set("entry.displayName", lineProfile.displayName);
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

    if (isLiffReady && (session?.user || lineProfile)) {
      setupGoogleForm();
    }
  }, [session, lineProfile, lineUid, isLiffReady]);

  const handleOpenGoogleForm = () => {
    if (!googleFormUrl) {
      toast.error("ฟอร์มยังไม่พร้อม กรุณารอสักครู่");
      return;
    }

    setIsLoading(true);

    // Open Google Form in same window (for LINE LIFF)
    if (isInLineClient) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 mb-6">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            ฟอร์มแจ้งซ่อมออนไลน์
          </h2>

          <p className="text-lg text-gray-600 mb-6">
            กรอกรายละเอียดการแจ้งซ่อมผ่าน Google Forms
          </p>

          {/* User Info Display */}
          {(session?.user || lineProfile) && (
            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center">
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
                    <p className="text-sm text-gray-500">
                      {session.user.email}
                    </p>
                  )}
                  {lineUid && (
                    <p className="text-xs text-green-600">LINE เชื่อมต่อแล้ว</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-8">
            {!googleFormUrl ? (
              <div className="text-center">
                <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-600">กำลังเตรียมฟอร์ม...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ฟอร์มพร้อมใช้งาน
                  </h3>
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
                    <svg
                      className="h-5 w-5 text-green-400 mt-0.5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm">
                      <h4 className="font-medium text-green-900 mb-1">
                        💡 คำแนะนำ
                      </h4>
                      <p className="text-green-700">
                        • กรอกข้อมูลให้ครบถ้วนเพื่อความรวดเร็วในการซ่อม
                        <br />
                        • แนบรูปภาพปัญหาถ้ามี
                        <br />• คุณจะได้รับการแจ้งเตือนผ่าน LINE
                        เมื่อมีการอัปเดต
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
