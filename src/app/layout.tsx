import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบแจ้งซ่อม - Repair Notification System",
  description: "ระบบแจ้งซ่อมออนไลน์พร้อมการแจ้งเตือนผ่าน LINE และ Monday.com",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                style: {
                  background: "#059669",
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: "#DC2626",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
