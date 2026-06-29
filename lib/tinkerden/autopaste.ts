import {
  buildPacketRelayText,
  listPacketRelayCards,
  type PacketRelayCard
} from "./packet-relay";

export type AutopastePacketCard = PacketRelayCard & {
  autopaste_text: string;
};

export const buildAutopasteText = buildPacketRelayText;

export async function listAutopastePacketCards(): Promise<AutopastePacketCard[]> {
  const cards = await listPacketRelayCards();
  return cards.map((card) => ({ ...card, autopaste_text: card.packet_relay_text }));
}
