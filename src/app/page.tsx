"use client";

import { useEffect, useState } from "react";
import { useLiff } from "@/hooks/useLiff";

export default function HomePage() {
  const { isLiffReady, isInLineClient } = useLiff();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // เช็คว่าเป็น mobile หรือไม่
    const checkMobile = () => {
      const userAgent = navigator.userAgent || (window as any).opera;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    };

    setIsMobile(checkMobile());
  }, []);

  useEffect(() => {
    if (isLiffReady) {
      if (isInLineClient && isMobile) {
        // อยู่ใน LINE app บนมือถือ → ไปหน้า LINE
        window.location.href = "/line";
      } else {
        // ไม่ใช่ LINE app หรือไม่ใช่มือถือ → แสดงข้อความแนะนำ
        // ไม่ redirect อัตโนมัติ
      }
    }
  }, [isLiffReady, isInLineClient, isMobile]);

  // ถ้าไม่ใช่ LINE app บนมือถือ แสดงข้อความแนะนำ
  if (isLiffReady && (!isInLineClient || !isMobile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.621.629-.344 0-.628-.285-.628-.629V8.108c0-.27.173-.51.43-.595.063-.022.136-.033.202-.033.209 0 .387.09.506.25l2.446 3.316V8.108c0-.345.282-.63.625-.63.348 0 .624.285.624.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.628-.629.628M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.594.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ระบบแจ้งซ่อมออนไลน์
          </h2>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                📱 กรุณาเปิดในแอป LINE บนมือถือ
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ระบบนี้ใช้งานได้เฉพาะในแอป LINE บนมือถือเท่านั้น
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-center text-sm text-gray-700">
                  <span className="mr-2">1.</span>
                  <span>เปิดแอป LINE บนมือถือ</span>
                </div>
                <div className="flex items-center justify-center text-sm text-gray-700">
                  <span className="mr-2">2.</span>
                  <span>สแกน QR Code หรือกดลิงก์</span>
                </div>
                <div className="flex items-center justify-center text-sm text-gray-700">
                  <span className="mr-2">3.</span>
                  <span>เริ่มใช้งานระบบแจ้งซ่อม</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700">
              💡 <strong>เคล็ดลับ:</strong> หากต้องการทดสอบบนคอมพิวเตอร์
              <br />
              สามารถใช้ Developer Tools จำลองมือถือได้
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-600">กำลังโหลดระบบแจ้งซ่อม...</p>
      </div>
    </div>
  );
}