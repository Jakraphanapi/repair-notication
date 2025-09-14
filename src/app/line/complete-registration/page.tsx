"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function CompleteRegistrationPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLinking, setIsLinking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const lineUid = searchParams.get("lineUid");
  const displayName = searchParams.get("displayName");
  const pictureUrl = searchParams.get("pictureUrl");

  useEffect(() => {
    const linkLineUid = async () => {
      if (!session?.user || !lineUid || isLinking || isComplete) {
        return;
      }

      setIsLinking(true);
      try {
        const response = await fetch("/api/user/link-line", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lineUid,
            displayName: displayName || session.user.name,
            pictureUrl: pictureUrl || session.user.image,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success("ลงทะเบียนสำเร็จ! กำลังเปิดฟอร์มแจ้งซ่อม...");
          setIsComplete(true);

          // Update session with LINE UID
          await update({
            ...session,
            user: {
              ...session.user,
              lineUserId: lineUid,
            },
          });

          // Redirect to Google Form after short delay
          setTimeout(() => {
            const googleFormUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;
            if (googleFormUrl) {
              // Pre-fill form with user data
              const prefilledUrl = new URL(googleFormUrl);
              prefilledUrl.searchParams.set("usp", "pp_url");
              prefilledUrl.searchParams.set(
                "entry.name",
                session.user.name || ""
              );
              prefilledUrl.searchParams.set(
                "entry.email",
                session.user.email || ""
              );
              prefilledUrl.searchParams.set("entry.lineUid", lineUid);

              window.location.href = prefilledUrl.toString();
            } else {
              // Fallback to repair form page
              router.push("/repair/new");
            }
          }, 3000);
        } else {
          toast.error(result.error || "เกิดข้อผิดพลาดในการลงทะเบียน");
          router.push("/line");
        }
      } catch (error) {
        console.error("Error linking LINE UID:", error);
        toast.error("เกิดข้อผิดพลาดในการลงทะเบียน");
        router.push("/line");
      } finally {
        setIsLinking(false);
      }
    };

    if (session?.user) {
      linkLineUid();
    }
  }, [
    session,
    lineUid,
    displayName,
    pictureUrl,
    isLinking,
    isComplete,
    router,
    update,
  ]);

  // Redirect to LINE page if missing required params
  useEffect(() => {
    if (!lineUid) {
      toast.error("ข้อมูล LINE UID ไม่ถูกต้อง");
      router.push("/line");
    }
  }, [lineUid, router]);

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
            {isComplete ? (
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
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
            )}
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            {isComplete ? "ลงทะเบียนสำเร็จ!" : "กำลังลงทะเบียน..."}
          </h2>

          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* User Info Display */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center">
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

            {isLinking && !isComplete && (
              <div className="text-center">
                <div className="mb-4">
                  <div className="animate-pulse flex space-x-1 justify-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  กำลังเชื่อมต่อ LINE
                </h3>
                <p className="text-sm text-blue-700">
                  กำลังบันทึกข้อมูลและเชื่อมต่อ LINE UID...
                </p>
              </div>
            )}

            {isComplete && (
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
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  ลงทะเบียนสำเร็จ!
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  ระบบได้เชื่อมต่อ LINE ของคุณแล้ว
                  <br />
                  กำลังเปิดฟอร์มแจ้งซ่อม...
                </p>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-center text-sm text-green-700">
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
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
                    กำลังเตรียมฟอร์ม...
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  🎉 การตั้งค่าเสร็จสิ้น
                </h4>
                <p className="text-sm text-blue-700">
                  คุณจะได้รับการแจ้งเตือนผ่าน LINE
                  <br />
                  เมื่อมีการอัปเดตสถานะการซ่อม
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
