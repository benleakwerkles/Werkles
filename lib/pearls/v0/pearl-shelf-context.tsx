"use client";

import { createContext, useContext, type ReactNode } from "react";

import { usePearlShelf, type PearlShelfRow } from "./use-pearl-shelf";
import type { PearlAction, PearlStatus } from "./types";

type PearlShelfContextValue = {
  pearls: PearlShelfRow[];
  byStatus: Record<PearlStatus, PearlShelfRow[]>;
  statusCounts: Record<PearlStatus, number>;
  totalCount: number;
  loading: boolean;
  busyId: string | null;
  notice: string | null;
  loadError: string | null;
  storePath: string | null;
  newCount: number;
  reload: () => Promise<void>;
  runAction: (pearlId: string, action: PearlAction) => Promise<void>;
};

const PearlShelfContext = createContext<PearlShelfContextValue | null>(null);

export function PearlShelfProvider({ children }: { children: ReactNode }) {
  const value = usePearlShelf();
  return <PearlShelfContext.Provider value={value}>{children}</PearlShelfContext.Provider>;
}

export function usePearlShelfContext(): PearlShelfContextValue {
  const value = useContext(PearlShelfContext);
  if (!value) {
    throw new Error("usePearlShelfContext requires PearlShelfProvider");
  }
  return value;
}
