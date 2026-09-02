import type { Metadata } from "next";

import { listPacketRelayCards } from "@/lib/tinkerden/packet-relay";

import { PacketRelayClient } from "./autopaste-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TinkerDen Packet Relay",
  description: "Clipboard-ready Aeye packet blocks.",
  robots: { index: false, follow: false }
};

export default async function TinkerDenPacketRelayPage() {
  const packets = await listPacketRelayCards();

  return <PacketRelayClient packets={packets} />;
}
