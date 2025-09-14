"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useLiff } from "@/hooks/useLiff";
import toast from "react-hot-toast";

export default function LinkLineUidPage() {
  const { data: session, update } = useSession();
  const [isLinking, setIsLinking] = useState(false);
  const [isLinked, setIsLinked] = useState(false);

  const {
    isLiffReady,
    isLineLoggedIn,
    isInLineClient,
    lineProfile,
    lineUid,
    loading: liffLoading,
    error: liffError,
    loginToLine,
  } = useLiff();

  const handleLinkLineUid = useCallback(async () => {
    try {
      setIsLinking(true);

      if (!lineUid || !lineProfile) {
        toast.error("ไม่สามารถดึงข้อมูล LINE ได้");
        return;
      }

      const response = await fetch("/api/user/link-line", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineUid,
          displayName: lineProfile.displayName,
          pictureUrl: lineProfile.pictureUrl,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("เชื่อมต่อ LINE UID สำเร็จ!");
        setIsLinked(true);

        // Update session
        await update({
          lineUserId: lineUid,
        });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }
    } catch (error) {
      console.error("Error linking LINE UID:", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
    } finally {
      setIsLinking(false);
    }
  }, [lineUid, lineProfile, update]);

  useEffect(() => {
    // Check if user already has LINE UID linked
    if (session?.user?.lineUserId) {
      setIsLinked(true);
    }
  }, [session]);

  useEffect(() => {
    // Auto-link LINE UID when LIFF is ready and user is logged in
    const autoLinkLineUid = async () => {
      if (
        isLiffReady &&
        isLineLoggedIn &&
        lineUid &&
        lineProfile &&
        session?.user &&
        !isLinked &&
        !isLinking
      ) {
        await handleLinkLineUid();
      }
    };

    autoLinkLineUid();
  }, [
    isLiffReady,
    isLineLoggedIn,
    lineUid,
    lineProfile,
    session,
    isLinked,
    isLinking,
    handleLinkLineUid,
  ]);

  const handleLoginToLine = () => {
    if (!isLiffReady) {
      toast.error("LIFF ยังไม่พร้อมใช้งาน กรุณารอสักครู่");
      return;
    }
    loginToLine();
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-lg text-gray-600">กรุณาเข้าสู่ระบบก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
            <svg
              className="h-8 w-8 text-green-600"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.621.629-.344 0-.628-.285-.628-.629V8.108c0-.27.173-.51.43-.595.063-.022.136-.033.202-.033.209 0 .387.09.506.25l2.446 3.316V8.108c0-.345.282-.63.625-.63.348 0 .624.285.624.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.628-.629.628M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.594.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            เชื่อมต่อ LINE สำหรับการแจ้งเตือน
          </h2>

          <p className="text-lg text-gray-600 mb-6">
            เชื่อมต่อ LINE UID เพื่อรับการแจ้งเตือนสถานะการซ่อม
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* User Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || ""}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {session.user.name}
                  </p>
                  <p className="text-sm text-gray-500">{session.user.email}</p>
                </div>
              </div>
            </div>

            {isLinked ? (
              /* Already Linked */
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  เชื่อมต่อ LINE สำเร็จแล้ว
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  ระบบจะส่งการแจ้งเตือนไปยัง LINE ของคุณ
                </p>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ไปหน้าหลัก
                </button>
              </div>
            ) : (
              /* Link LINE UID */
              <div className="space-y-4">
                {!isInLineClient && (
                  <div className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-md mb-4">
                    📱 เปิดลิงก์นี้ในแอป LINE เพื่อเชื่อมต่อ LINE UID อัตโนมัติ
                  </div>
                )}

                {isInLineClient && !isLineLoggedIn && (
                  <button
                    onClick={handleLoginToLine}
                    disabled={!isLiffReady || liffLoading}
                    className="w-full py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {liffLoading ? "กำลังโหลด..." : "เข้าสู่ระบบ LINE"}
                  </button>
                )}

                {isLineLoggedIn && lineProfile && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        {lineProfile.pictureUrl && (
                          <img
                            src={lineProfile.pictureUrl}
                            alt={lineProfile.displayName}
                            className="w-12 h-12 rounded-full mr-4"
                          />
                        )}
                        <div>
                          <p className="font-medium text-green-900">
                            {lineProfile.displayName}
                          </p>
                          <p className="text-sm text-green-700">
                            LINE UID: {lineUid}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleLinkLineUid}
                      disabled={isLinking}
                      className="w-full py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLinking ? "กำลังเชื่อมต่อ..." : "เชื่อมต่อ LINE UID"}
                    </button>
                  </div>
                )}

                {liffError && (
                  <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {liffError}
                  </div>
                )}

                <div className="text-center">
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    ข้ามขั้นตอนนี้ (สามารถเชื่อมต่อทีหลังได้)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
