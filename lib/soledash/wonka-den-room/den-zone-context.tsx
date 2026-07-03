"use client";

import type { DenZoneId } from "@/lib/soledash/wonka-den-room/zones";
import { createContext, useContext, type ReactNode } from "react";

const DenZoneOpenContext = createContext<(zone: DenZoneId) => void>(() => {});

export function DenZoneOpenProvider({
  openZone,
  children
}: {
  openZone: (zone: DenZoneId) => void;
  children: ReactNode;
}) {
  return <DenZoneOpenContext.Provider value={openZone}>{children}</DenZoneOpenContext.Provider>;
}

export function useDenZoneOpen(): (zone: DenZoneId) => void {
  return useContext(DenZoneOpenContext);
}
