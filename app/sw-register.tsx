"use client";

import { useEffect } from "react";

/** 서비스 워커 등록 (배포 환경에서만 — 개발 중에는 캐시가 헷갈림을 만든다) */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);

  return null;
}
