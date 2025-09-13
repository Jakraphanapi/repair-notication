"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Company {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
}

interface Device {
  id: string;
  serialNumber: string;
}

export default function NewRepairPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    companyId: "",
    brandId: "",
    modelId: "",
    deviceId: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  // Load brands when company changes
  useEffect(() => {
    if (formData.companyId) {
      loadBrands(formData.companyId);
      setBrands([]);
      setModels([]);
      setDevices([]);
      setFormData((prev) => ({
        ...prev,
        brandId: "",
        modelId: "",
        deviceId: "",
      }));
    }
  }, [formData.companyId]);

  // Load models when brand changes
  useEffect(() => {
    if (formData.brandId) {
      loadModels(formData.brandId);
      setModels([]);
      setDevices([]);
      setFormData((prev) => ({ ...prev, modelId: "", deviceId: "" }));
    }
  }, [formData.brandId]);

  // Load devices when model changes
  useEffect(() => {
    if (formData.modelId) {
      loadDevices(formData.modelId);
      setDevices([]);
      setFormData((prev) => ({ ...prev, deviceId: "" }));
    }
  }, [formData.modelId]);

  const loadCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("ไม่สามารถดึงข้อมูลบริษัทได้");
    }
  };

  const loadBrands = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/brands`);
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error("Error loading brands:", error);
      toast.error("ไม่สามารถดึงข้อมูลแบรนด์ได้");
    }
  };

  const loadModels = async (brandId: string) => {
    try {
      const response = await fetch(`/api/brands/${brandId}/models`);
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error("Error loading models:", error);
      toast.error("ไม่สามารถดึงข้อมูลรุ่นได้");
    }
  };

  const loadDevices = async (modelId: string) => {
    try {
      const response = await fetch(`/api/models/${modelId}/devices`);
      const data = await response.json();
      setDevices(data);
    } catch (error) {
      console.error("Error loading devices:", error);
      toast.error("ไม่สามารถดึงข้อมูลอุปกรณ์ได้");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.deviceId) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          deviceId: formData.deviceId,
        }),
      });

      if (response.ok) {
        const ticket = await response.json();
        toast.success("แจ้งซ่อมสำเร็จ!");
        router.push(`/tickets/${ticket.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "เกิดข้อผิดพลาดในการแจ้งซ่อม");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            แจ้งซ่อมใหม่
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            กรอกข้อมูลการแจ้งซ่อมของคุณ
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                หัวข้อปัญหา
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="เช่น เครื่องเปิดไม่ติด, หน้าจอดับ"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                รายละเอียดปัญหา
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="อธิบายปัญหาที่พบเจอ..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700"
              >
                ความเร่งด่วน
              </label>
              <select
                id="priority"
                name="priority"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="LOW">ต่ำ</option>
                <option value="MEDIUM">ปานกลาง</option>
                <option value="HIGH">สูง</option>
                <option value="URGENT">เร่งด่วน</option>
              </select>
            </div>

            {/* Company */}
            <div>
              <label
                htmlFor="companyId"
                className="block text-sm font-medium text-gray-700"
              >
                บริษัทผู้ผลิต
              </label>
              <select
                id="companyId"
                name="companyId"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.companyId}
                onChange={handleChange}
              >
                <option value="">เลือกบริษัทผู้ผลิต</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label
                htmlFor="brandId"
                className="block text-sm font-medium text-gray-700"
              >
                แบรนด์
              </label>
              <select
                id="brandId"
                name="brandId"
                required
                disabled={!formData.companyId}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                value={formData.brandId}
                onChange={handleChange}
              >
                <option value="">เลือกแบรนด์</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label
                htmlFor="modelId"
                className="block text-sm font-medium text-gray-700"
              >
                รุ่น
              </label>
              <select
                id="modelId"
                name="modelId"
                required
                disabled={!formData.brandId}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                value={formData.modelId}
                onChange={handleChange}
              >
                <option value="">เลือกรุ่น</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Device */}
            <div>
              <label
                htmlFor="deviceId"
                className="block text-sm font-medium text-gray-700"
              >
                หมายเลขเครื่อง
              </label>
              <select
                id="deviceId"
                name="deviceId"
                required
                disabled={!formData.modelId}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                value={formData.deviceId}
                onChange={handleChange}
              >
                <option value="">เลือกหมายเลขเครื่อง</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.serialNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  กำลังส่ง...
                </>
              ) : (
                "ส่งคำขอแจ้งซ่อม"
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              กลับหน้าหลัก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
