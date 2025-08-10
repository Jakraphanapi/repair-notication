"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">
                ระบบแจ้งซ่อม
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">สวัสดี {session.user?.name}</span>
              <Link
                href="/api/auth/signout"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                ออกจากระบบ
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ยินดีต้อนรับเข้าสู่ระบบแจ้งซ่อม
              </h2>
              <p className="text-gray-600">
                จัดการการแจ้งซ่อมของคุณได้อย่างง่ายดาย พร้อมการแจ้งเตือนแบบ
                Real-time
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Link
              href="/repair/new"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        แจ้งซ่อมใหม่
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        สร้างรายการแจ้งซ่อม
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/tickets"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        ประวัติการซ่อม
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ดูรายการทั้งหมด
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        กำลังดำเนินการ
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        0 รายการ
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        เสร็จสิ้นแล้ว
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        0 รายการ
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                การแจ้งซ่อมล่าสุด
              </h3>
              <div className="text-center py-8">
                <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  ยังไม่มีการแจ้งซ่อม
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  เริ่มต้นโดยการสร้างการแจ้งซ่อมใหม่
                </p>
                <div className="mt-6">
                  <Link
                    href="/repair/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <WrenchScrewdriverIcon className="-ml-1 mr-2 h-5 w-5" />
                    แจ้งซ่อมใหม่
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
