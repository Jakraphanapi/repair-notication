"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  WrenchScrewdriverIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface RepairTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  device: {
    serialNumber: string;
    model: {
      name: string;
      brand: {
        name: string;
        company: {
          name: string;
        };
      };
    };
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function TicketsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  // Load tickets
  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/tickets?${searchParams}`);
      const data = await response.json();

      if (response.ok) {
        setTickets(data.tickets);
        setPagination(data.pagination);
      } else {
        console.error("Error loading tickets:", data.error);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    if (session) {
      loadTickets();
    }
  }, [session, loadTickets]);

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: {
        color: "bg-yellow-100 text-yellow-800",
        icon: ClockIcon,
        text: "รอดำเนินการ",
      },
      IN_PROGRESS: {
        color: "bg-blue-100 text-blue-800",
        icon: WrenchScrewdriverIcon,
        text: "กำลังซ่อม",
      },
      WAITING_PARTS: {
        color: "bg-orange-100 text-orange-800",
        icon: ClockIcon,
        text: "รออะไหล่",
      },
      COMPLETED: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircleIcon,
        text: "เสร็จสิ้น",
      },
      CANCELLED: {
        color: "bg-red-100 text-red-800",
        icon: XCircleIcon,
        text: "ยกเลิก",
      },
    };

    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    const IconComponent = badge.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
      >
        <IconComponent className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      LOW: { color: "bg-gray-100 text-gray-800", text: "ต่ำ" },
      MEDIUM: { color: "bg-yellow-100 text-yellow-800", text: "ปานกลาง" },
      HIGH: { color: "bg-orange-100 text-orange-800", text: "สูง" },
      URGENT: { color: "bg-red-100 text-red-800", text: "เร่งด่วน" },
    };

    const badge = badges[priority as keyof typeof badges] || badges.MEDIUM;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.text}
      </span>
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

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
                รายการแจ้งซ่อม
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/repair/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                แจ้งซ่อมใหม่
              </Link>
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                หน้าหลัก
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                title="Filter by status"
                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">ทุกสถานะ</option>
                <option value="PENDING">รอดำเนินการ</option>
                <option value="IN_PROGRESS">กำลังซ่อม</option>
                <option value="WAITING_PARTS">รออะไหล่</option>
                <option value="COMPLETED">เสร็จสิ้น</option>
                <option value="CANCELLED">ยกเลิก</option>
              </select>

              {/* Priority Filter */}
              <select
                title="Filter by priority"
                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
              >
                <option value="">ทุกระดับความเร่งด่วน</option>
                <option value="LOW">ต่ำ</option>
                <option value="MEDIUM">ปานกลาง</option>
                <option value="HIGH">สูง</option>
                <option value="URGENT">เร่งด่วน</option>
              </select>

              {/* Clear Filters */}
              <button
                onClick={() =>
                  setFilters({ status: "", priority: "", search: "" })
                }
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>

          {/* Tickets List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">กำลังโหลด...</p>
              </div>
            )}

            {!isLoading && tickets.length === 0 && (
              <div className="text-center py-12">
                <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  ไม่มีรายการแจ้งซ่อม
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  เริ่มต้นโดยการสร้างการแจ้งซ่อมใหม่
                </p>
                <div className="mt-6">
                  <Link
                    href="/repair/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <WrenchScrewdriverIcon className="-ml-1 mr-2 h-5 w-5" />
                    แจ้งซ่อมใหม่
                  </Link>
                </div>
              </div>
            )}

            {!isLoading && tickets.length > 0 && (
              <ul className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-4 min-w-0 flex-1">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-blue-600 truncate">
                                {ticket.ticketNumber}
                              </p>
                              <div className="ml-2 flex space-x-2">
                                {getStatusBadge(ticket.status)}
                                {getPriorityBadge(ticket.priority)}
                              </div>
                            </div>
                            <p className="text-lg font-medium text-gray-900 mt-1">
                              {ticket.title}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {ticket.device.model.brand.company.name}{" "}
                              {ticket.device.model.brand.name}{" "}
                              {ticket.device.model.name} (S/N:{" "}
                              {ticket.device.serialNumber})
                            </p>
                            <p className="text-sm text-gray-500">
                              แจ้งโดย: {ticket.user.name} •{" "}
                              {new Date(ticket.createdAt).toLocaleDateString(
                                "th-TH"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="text-blue-600 hover:text-blue-500 font-medium text-sm"
                          >
                            ดูรายละเอียด →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-md shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    แสดง{" "}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    ถึง{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}
                    </span>{" "}
                    จาก <span className="font-medium">{pagination.total}</span>{" "}
                    รายการ
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ก่อนหน้า
                    </button>
                    {Array.from(
                      { length: pagination.pages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ถัดไป
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
