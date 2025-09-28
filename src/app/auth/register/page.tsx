"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLiff } from "@/hooks/useLiff";
import { storeLineUidInLocalStorage, isValidLineUid } from "@/lib/auth-utils";

export default function GmailRegistrationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

  // Store LINE UID when available from LIFF
  useEffect(() => {
    if (isLiffReady && isLineLoggedIn && lineUid && isValidLineUid(lineUid)) {
      storeLineUidInLocalStorage(lineUid);
      console.log('LINE UID stored for Gmail registration:', lineUid);
    }
  }, [isLiffReady, isLineLoggedIn, lineUid]);

  const handleGmailRegistration = async () => {
    setIsLoading(true);
    try {
      // Check if we're in LINE client and can get LINE UID
      let callbackUrl = "/repair/new";

      if (isLiffReady && isInLineClient && lineUid) {
        // If we have LINE UID, redirect to complete registration page
        callbackUrl = `/line/complete-registration?lineUid=${encodeURIComponent(lineUid)}&displayName=${encodeURIComponent(lineProfile?.displayName || "")}&pictureUrl=${encodeURIComponent(lineProfile?.pictureUrl || "")}`;
        console.log('Gmail registration with LINE UID:', lineUid);
      } else if (isLiffReady && isInLineClient && !isLineLoggedIn) {
        // If in LINE client but not logged in, try to login first
        toast.info("กรุณาเข้าสู่ระบบ LINE ก่อนเพื่อรับการแจ้งเตือน");
        loginToLine();
        setIsLoading(false);
        return;
      }

      const result = await signIn("google", {
        callbackUrl,
        redirect: true,
      });

      if (result?.error) {
        console.error("Google registration error:", result.error);
        toast.error("เกิดข้อผิดพลาดในการลงทะเบียน");
        setIsLoading(false);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลงทะเบียน");
      console.error("Registration error:", error);
      setIsLoading(false);
    }
  };

  const handleLoginToLine = () => {
    if (!isLiffReady) {
      toast.error("LIFF ยังไม่พร้อมใช้งาน กรุณารอสักครู่");
      return;
    }
    const redirectUri = `${window.location.origin}/auth/register`;
    loginToLine(redirectUri);
  };

  // Show loading while LIFF is initializing
  if (liffLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">กำลังเตรียมระบบ...</p>
        </div>
      </div>
    );
  }

  // Show error if LIFF failed to initialize
  if (liffError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-600 mb-6">{liffError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 mb-6">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            ลงทะเบียนด้วย Gmail
          </h2>

          <p className="text-gray-600 mb-8">
            ลงทะเบียนเพื่อใช้งานระบบแจ้งซ่อม
            {isInLineClient && (
              <span className="block mt-2 text-sm text-green-600">
                🎉 ตรวจพบ LINE! คุณจะได้รับการแจ้งเตือนผ่าน LINE อัตโนมัติ
              </span>
            )}
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* LINE Status Display */}
            {isInLineClient && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .63.285.63.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">
                    เชื่อมต่อ LINE แล้ว
                  </span>
                </div>
                {lineProfile && (
                  <div className="mt-2 text-sm text-green-600">
                    สวัสดี {lineProfile.displayName}! คุณจะได้รับการแจ้งเตือนผ่าน LINE
                  </div>
                )}
              </div>
            )}

            {/* Registration Button */}
            <button
              onClick={handleGmailRegistration}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังลงทะเบียน...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  ลงทะเบียนด้วย Gmail
                </>
              )}
            </button>

            {/* LINE Login Option */}
            {isInLineClient && !isLineLoggedIn && (
              <div className="mt-4">
                <button
                  onClick={handleLoginToLine}
                  className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .63.285.63.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  เข้าสู่ระบบ LINE ก่อน
                </button>
              </div>
            )}

            {/* Benefits */}
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600">
                <div className="flex items-center justify-center mb-2">
                  <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  รับการแจ้งเตือนผ่าน LINE
                </div>
                <div className="flex items-center justify-center mb-2">
                  <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  ติดตามสถานะการซ่อมแบบเรียลไทม์
                </div>
                <div className="flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  ใช้งานง่ายผ่าน LINE App
                </div>
              </div>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}