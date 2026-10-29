"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent
} from "react";

type SkyPookaRefreshContextValue = {
  registerRefresh: (key: string, handler: () => Promise<void> | void) => void;
  unregisterRefresh: (key: string) => void;
  refreshAll: () => Promise<void>;
  isRefreshing: boolean;
  isOnline: boolean;
  pullDistance: number;
};

const SkyPookaRefreshContext = createContext<SkyPookaRefreshContextValue | null>(null);

export function SkyPookaRefreshProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef<Map<string, () => Promise<void> | void>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const pulling = useRef(false);

  useEffect(() => {
    const syncOnline = () => setIsOnline(window.navigator.onLine);
    syncOnline();
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  const registerRefresh = useCallback((key: string, handler: () => Promise<void> | void) => {
    handlersRef.current.set(key, handler);
  }, []);

  const unregisterRefresh = useCallback((key: string) => {
    handlersRef.current.delete(key);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all(
        Array.from(handlersRef.current.values()).map(async (handler) => {
          await handler();
        })
      );
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, []);

  // Battery-friendly live polling: refresh while the tab is visible,
  // and immediately on return to the foreground.
  useEffect(() => {
    const POLL_MS = 30000;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && window.navigator.onLine) {
        void refreshAll();
      }
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible" && window.navigator.onLine) {
        void refreshAll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshAll]);

  const onTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (window.scrollY > 0 || isRefreshing) return;
    touchStartY.current = event.touches[0]?.clientY ?? null;
    pulling.current = touchStartY.current !== null;
  }, [isRefreshing]);

  const onTouchMove = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (!pulling.current || touchStartY.current === null || isRefreshing) return;
    const currentY = event.touches[0]?.clientY ?? touchStartY.current;
    const delta = Math.max(0, currentY - touchStartY.current);
    if (delta > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(delta, 96));
    }
  }, [isRefreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    touchStartY.current = null;
    if (pullDistance >= 72) {
      await refreshAll();
      return;
    }
    setPullDistance(0);
  }, [pullDistance, refreshAll]);

  const value = useMemo(
    () => ({
      registerRefresh,
      unregisterRefresh,
      refreshAll,
      isRefreshing,
      isOnline,
      pullDistance
    }),
    [registerRefresh, unregisterRefresh, refreshAll, isRefreshing, isOnline, pullDistance]
  );

  return (
    <SkyPookaRefreshContext.Provider value={value}>
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => {
          void onTouchEnd();
        }}
      >
        {pullDistance > 0 ? (
          <div
            className="skypooka-pull-indicator"
            style={{ height: `${pullDistance}px` }}
            aria-hidden="true"
          >
            {pullDistance >= 72 ? "Release to refresh" : "Pull to refresh"}
          </div>
        ) : null}
        {children}
      </div>
    </SkyPookaRefreshContext.Provider>
  );
}

export function useSkyPookaRefresh() {
  const context = useContext(SkyPookaRefreshContext);
  if (!context) {
    throw new Error("useSkyPookaRefresh must be used within SkyPookaRefreshProvider");
  }
  return context;
}

export function useSkyPookaRefreshRegistration(key: string, handler: () => Promise<void> | void) {
  const { registerRefresh, unregisterRefresh } = useSkyPookaRefresh();

  useEffect(() => {
    registerRefresh(key, handler);
    return () => unregisterRefresh(key);
  }, [key, handler, registerRefresh, unregisterRefresh]);
}
