"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function NewRepairPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [googleFormUrl, setGoogleFormUrl] = useState<string>("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // Set Google Form URL from environment variable or default
    const formUrl =
      process.env.NEXT_PUBLIC_GOOGLE_FORM_URL ||
      "https://forms.gle/YOUR_GOOGLE_FORM_ID";
    setGoogleFormUrl(formUrl);
  }, [session, status, router]);

  const handleOpenGoogleForm = () => {
    if (googleFormUrl) {
      // Pre-fill user information in Google Form
      const prefillParams = new URLSearchParams({
        "entry.email": session?.user?.email || "",
        "entry.name": session?.user?.name || "",
        "entry.userId": session?.user?.id || "",
      });

      const formUrlWithPrefill = `${googleFormUrl}?${prefillParams.toString()}`;
      window.open(formUrlWithPrefill, "_blank");

      toast.success("เปิด Google Form สำหรับแจ้งซ่อมแล้ว");
    } else {
      toast.error("ไม่พบลิงก์ Google Form");
    }
  };

  const handleCopyFormLink = async () => {
    if (googleFormUrl) {
      try {
        await navigator.clipboard.writeText(googleFormUrl);
        toast.success("คัดลอกลิงก์แล้ว");
      } catch {
        toast.error("ไม่สามารถคัดลอกลิงก์ได้");
      }
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
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

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                แจ้งซ่อมออนไลน์
              </h1>

              <p className="text-lg text-gray-600 mb-8">
                ระบบใหม่ใช้ Google Forms เพื่อความสะดวกและรวดเร็ว
              </p>

              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">
                  ข้อมูลผู้ใช้
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white rounded p-3">
                    <span className="font-medium text-gray-700">ชื่อ:</span>
                    <span className="ml-2 text-gray-900">
                      {session.user.name}
                    </span>
                  </div>
                  <div className="bg-white rounded p-3">
                    <span className="font-medium text-gray-700">อีเมล:</span>
                    <span className="ml-2 text-gray-900">
                      {session.user.email}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-blue-700 mt-3">
                  ข้อมูลนี้จะถูกส่งไปยัง Google Form อัตโนมัติ
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleOpenGoogleForm}
                  className="w-full inline-flex justify-center items-center px-6 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg
                    className="w-6 h-6 mr-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  เปิด Google Form แจ้งซ่อม
                </button>

                <button
                  onClick={handleCopyFormLink}
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  คัดลอกลิงก์ฟอร์ม
                </button>
              </div>

              <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  📝 วิธีการใช้งาน
                </h3>
                <div className="text-sm text-yellow-700 text-left space-y-1">
                  <p>
                    1. คลิก &quot;เปิด Google Form แจ้งซ่อม&quot;
                    เพื่อเปิดฟอร์มในหน้าต่างใหม่
                  </p>
                  <p>2. กรอกรายละเอียดการแจ้งซ่อมในฟอร์ม</p>
                  <p>3. ส่งฟอร์มเมื่อกรอกข้อมูลครบถ้วน</p>
                  <p>4. ระบบจะแจ้งเตือนและสร้างรายการซ่อมโดยอัตโนมัติ</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => router.push("/tickets")}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  ดูรายการแจ้งซ่อม
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
