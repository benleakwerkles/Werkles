import {
  readPacketRelayEventPipeline,
  readPacketRelayReadyEvents,
  type PacketRelayReadyEvent
} from "./packet-relay-events";

export type AutopasteReadyEvent = PacketRelayReadyEvent;

export async function readAutopasteReadyEvents(limit = 10): Promise<AutopasteReadyEvent[]> {
  return readPacketRelayReadyEvents(limit);
}

export async function readAutopasteEventPipeline(limit = 10) {
  return readPacketRelayEventPipeline(limit);
}
