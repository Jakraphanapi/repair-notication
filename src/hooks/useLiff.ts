"use client";

import { useState, useEffect, useCallback } from "react";
import {
  initLiff,
  isLoggedIn,
  login,
  logout,
  getLiffProfile,
  getCurrentLineUid,
  isInClient,
  checkLineConnectivity,
  type LiffProfile,
} from "@/lib/liff-utils";

interface UseLiffReturn {
  isLiffReady: boolean;
  isLineLoggedIn: boolean;
  isInLineClient: boolean;
  lineProfile: LiffProfile | null;
  lineUid: string | null;
  loading: boolean;
  error: string | null;
  loginToLine: (redirectUri?: string) => void;
  logoutFromLine: () => void;
  refreshProfile: () => Promise<void>;
}

export const useLiff = (): UseLiffReturn => {
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [isLineLoggedIn, setIsLineLoggedIn] = useState(false);
  const [isInLineClient, setIsInLineClient] = useState(false);
  const [lineProfile, setLineProfile] = useState<LiffProfile | null>(null);
  const [lineUid, setLineUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      setError(null);

      if (!isLoggedIn()) {
        setLineProfile(null);
        setLineUid(null);
        return;
      }

      const profile = await getLiffProfile();
      const uid = await getCurrentLineUid();

      setLineProfile(profile);
      setLineUid(uid);
    } catch (err) {
      console.error("Error refreshing profile:", err);
      setError("Failed to get LINE profile");
    }
  }, []);

  const initializeLiff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ตรวจสอบการเชื่อมต่อกับ LINE servers ก่อน
      console.log("Checking LINE server connectivity...");
      const canConnect = await checkLineConnectivity();
      if (!canConnect) {
        setError("ไม่สามารถเชื่อมต่อกับ LINE servers ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
        return;
      }

      // ลอง init LIFF หลายครั้งถ้าจำเป็น
      let initialized = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!initialized && attempts < maxAttempts) {
        attempts++;
        console.log(`LIFF initialization attempt ${attempts}/${maxAttempts}`);

        initialized = await initLiff();

        if (!initialized && attempts < maxAttempts) {
          console.log(`Waiting before retry... (${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 3000)); // เพิ่มเป็น 3 วินาที
        }
      }

      if (!initialized) {
        setError("ไม่สามารถเชื่อมต่อกับ LINE ได้ กรุณาลองใหม่หรือตรวจสอบการตั้งค่า LIFF");
        return;
      }

      setIsLiffReady(true);
      setIsLineLoggedIn(isLoggedIn());
      setIsInLineClient(isInClient());

      // Get profile if logged in
      if (isLoggedIn()) {
        await refreshProfile();
      }
    } catch (err) {
      console.error("LIFF initialization error:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  const loginToLine = useCallback((redirectUri?: string) => {
    try {
      login(redirectUri);
    } catch (err) {
      console.error("LINE login error:", err);
      setError("LINE login failed");
    }
  }, []);

  const logoutFromLine = useCallback(() => {
    try {
      logout();
      setIsLineLoggedIn(false);
      setLineProfile(null);
      setLineUid(null);
    } catch (err) {
      console.error("LINE logout error:", err);
      setError("LINE logout failed");
    }
  }, []);

  return {
    isLiffReady,
    isLineLoggedIn,
    isInLineClient,
    lineProfile,
    lineUid,
    loading,
    error,
    loginToLine,
    logoutFromLine,
    refreshProfile,
  };
};
