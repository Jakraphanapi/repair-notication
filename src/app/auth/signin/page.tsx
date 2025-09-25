"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useLiff } from "@/hooks/useLiff";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signIn("google", {
        callbackUrl: "/repair/new",
        redirect: true,
      });

      if (result?.error) {
        console.error("Google sign-in error:", result.error);
        toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        setIsLoading(false);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  const handleLineSignIn = async () => {
    try {
      if (!isLiffReady) {
        toast.error("LIFF ยังไม่พร้อมใช้งาน กรุณารอสักครู่");
        return;
      }

      if (isLineLoggedIn && lineUid && lineProfile) {
        // Sign in via NextAuth LINE credentials; stay in LIFF and return to /line
        await signIn("line", {
          lineUid,
          displayName: lineProfile.displayName,
          email: lineProfile.email || `line_${lineUid}@example.com`,
          pictureUrl: lineProfile.pictureUrl || "",
          redirect: true,
          callbackUrl: "/line",
        });
      } else {
        // Need to login to LINE first, ensure redirect returns to /line to avoid loops
        const redirectUri = `${window.location.origin}/line`;
        loginToLine(redirectUri);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE");
      console.error("LINE sign in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
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
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            ระบบแจ้งซ่อมออนไลน์
          </h2>

          <p className="text-lg text-gray-600 mb-6">
            เข้าสู่ระบบด้วย Google Account หรือ LINE
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading || liffLoading}
              className="w-full inline-flex justify-center items-center py-4 px-6 border border-gray-300 rounded-lg shadow-sm bg-white text-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-4"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-6 w-6 text-gray-500"
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
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  เข้าสู่ระบบด้วย Google
                </>
              )}
            </button>

            {/* Divider */}
            {(isInLineClient || isLiffReady) && (
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">หรือ</span>
                </div>
              </div>
            )}

            {/* LINE Sign In Button - Show only if LIFF is ready or in LINE client */}
            {(isInLineClient || isLiffReady) && (
              <button
                onClick={handleLineSignIn}
                disabled={isLoading || liffLoading || !isLiffReady}
                className="w-full inline-flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-sm bg-green-500 text-lg font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {liffLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
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
                    กำลังโหลด LINE...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6 mr-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.621.629-.344 0-.628-.285-.628-.629V8.108c0-.27.173-.51.43-.595.063-.022.136-.033.202-.033.209 0 .387.09.506.25l2.446 3.316V8.108c0-.345.282-.63.625-.63.348 0 .624.285.624.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.628-.629.628M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.594.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                    {isLineLoggedIn && lineProfile
                      ? `เข้าสู่ระบบด้วย LINE (${lineProfile.displayName})`
                      : "เข้าสู่ระบบด้วย LINE"}
                  </>
                )}
              </button>
            )}

            {/* LIFF Error Display */}
            {liffError && (
              <div className="mt-4 text-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {liffError}
              </div>
            )}

            <div className="mt-6 text-sm text-gray-500 text-center">
              <p>ใช้บัญชี Google หรือ LINE ของคุณเพื่อเข้าสู่ระบบ</p>
              <p className="mt-2">ระบบจะสร้างบัญชีให้อัตโนมัติหากยังไม่มี</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                🔧 ระบบใหม่: ใช้ Google Forms
              </h3>
              <p className="text-sm text-blue-700">
                ตอนนี้ระบบใช้ Google Forms สำหรับการแจ้งซ่อม
                <br />
                ง่ายและสะดวกกว่าเดิม!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
