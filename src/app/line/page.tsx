"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { openUrl } from "@/lib/liff-utils";
import { useLiff } from "@/hooks/useLiff";
import toast from "react-hot-toast";

export default function LineEntryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [userStatus, setUserStatus] = useState<
    "checking" | "new" | "registered" | "error"
  >("checking");

  const {
    isLiffReady,
    isLineLoggedIn,
    lineProfile,
    lineUid,
    loading: liffLoading,
    error: liffError,
    loginToLine,
  } = useLiff();

  // Check if user exists in our system
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!isLiffReady || !isLineLoggedIn || !lineUid) {
        return;
      }

      try {
        const response = await fetch(`/api/user/check-line?lineUid=${lineUid}`);
        const data = await response.json();

        if (response.ok) {
          if (data.exists) {
            setUserStatus("registered");
            // User exists, redirect to Google Form after short delay
            setTimeout(() => {
              const googleFormUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;
              if (googleFormUrl) {
                // Pre-fill form with user data
                const prefilledUrl = new URL(googleFormUrl);
                prefilledUrl.searchParams.set("usp", "pp_url");
                prefilledUrl.searchParams.set(
                  "entry.name",
                  lineProfile?.displayName || ""
                );
                prefilledUrl.searchParams.set(
                  "entry.email",
                  data.user.email || ""
                );
                prefilledUrl.searchParams.set("entry.lineUid", lineUid);

                openUrl(prefilledUrl.toString());
              } else {
                toast.error("Google Form URL ไม่ได้ตั้งค่า");
              }
            }, 2000);
          } else {
            setUserStatus("new");
          }
        } else {
          setUserStatus("error");
          toast.error("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล");
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        setUserStatus("error");
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }
    };

    checkUserStatus();
  }, [isLiffReady, isLineLoggedIn, lineUid, lineProfile]);

  const handleRegister = async () => {
    if (!isLiffReady || !isLineLoggedIn || !lineUid) {
      toast.error("กรุณาเข้าสู่ระบบ LINE ก่อน");
      return;
    }

    setIsLoading(true);
    try {
      // Redirect to Google OAuth with LINE UID in URL
      const googleOAuthUrl = `/api/auth/signin/google?lineUid=${encodeURIComponent(lineUid)}`;
      window.location.href = googleOAuthUrl;
    } catch (error) {
      console.error("Error initiating Google OAuth:", error);
      toast.error("เกิดข้อผิดพลาดในการลงทะเบียน");
      setIsLoading(false);
    }
  };

  const handleLoginToLine = () => {
    if (!isLiffReady) {
      toast.error("LIFF ยังไม่พร้อมใช้งาน กรุณารอสักครู่");
      return;
    }
    const redirectUri = `${window.location.origin}/line`;
    loginToLine(redirectUri);
  };

  // Show loading while LIFF is initializing
  if (liffLoading || !isLiffReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
            <svg
              className="animate-spin h-8 w-8 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            กำลังโหลด...
          </h2>
          <p className="text-gray-600">กำลังเตรียมระบบแจ้งซ่อม</p>
        </div>
      </div>
    );
  }

  // Show error if LIFF failed
  if (liffError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-6">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-red-700 mb-4">{liffError}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              ลองใหม่
            </button>
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login to LINE if not logged in
  if (!isLineLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
            <svg
              className="h-8 w-8 text-green-600"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.621.629-.344 0-.628-.285-.628-.629V8.108c0-.27.173-.51.43-.595.063-.022.136-.033.202-.033.209 0 .387.09.506.25l2.446 3.316V8.108c0-.345.282-.63.625-.63.348 0 .624.285.624.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.628-.629.628M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.594.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ระบบแจ้งซ่อมออนไลน์
          </h2>
          <p className="text-gray-600 mb-6">
            กรุณาเข้าสู่ระบบ LINE เพื่อใช้งาน
          </p>
          <button
            onClick={handleLoginToLine}
            className="w-full py-3 px-4 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
          >
            เข้าสู่ระบบ LINE
          </button>
        </div>
      </div>
    );
  }

  // Main content based on user status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            ระบบแจ้งซ่อมออนไลน์
          </h2>

          {/* User Profile Display */}
          {lineProfile && (
            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center">
                {lineProfile.pictureUrl && (
                  <img
                    src={lineProfile.pictureUrl}
                    alt={lineProfile.displayName}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {lineProfile.displayName}
                  </p>
                  <p className="text-sm text-gray-500">
                    LINE UID: {lineUid?.substring(0, 8)}...
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-8">
            {userStatus === "checking" && (
              <div className="text-center">
                <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-600">กำลังตรวจสอบข้อมูล...</p>
              </div>
            )}

            {userStatus === "registered" && (
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
                  ยินดีต้อนรับกลับ!
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  กำลังเปิดฟอร์มแจ้งซ่อม...
                </p>
                <div className="animate-pulse text-blue-600">
                  🔄 กำลังโหลดฟอร์ม...
                </div>
              </div>
            )}

            {userStatus === "new" && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ยินดีต้อนรับ!
                  </h3>
                  <p className="text-sm text-gray-600">
                    คุณยังไม่ได้ลงทะเบียนในระบบ
                    <br />
                    กรุณาลงทะเบียนด้วย Google เพื่อใช้งาน
                  </p>
                </div>

                <button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="w-full py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "กำลังลงทะเบียน..." : "ลงทะเบียนด้วย Google"}
                </button>

                <div className="text-center text-sm text-gray-500">
                  <p>การลงทะเบียนจะเชื่อมต่อ LINE กับ Google Account</p>
                  <p>เพื่อให้คุณได้รับการแจ้งเตือนผ่าน LINE</p>
                </div>
              </div>
            )}

            {userStatus === "error" && (
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-red-900 mb-2">
                  เกิดข้อผิดพลาด
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  ไม่สามารถเชื่อมต่อกับระบบได้
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  ลองใหม่
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
