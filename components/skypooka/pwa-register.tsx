"use client";

import { useEffect } from "react";

export default function SkyPookaPwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/skypooka-sw.js", { scope: "/skypooka" }).catch(() => {
      // Service worker registration is best-effort for home-screen install.
    });
  }, []);

  return null;
}
