export type PetraTransportEnvelope = {
  envelope_id: string;
  target_cousin: "Petra";
  target_machine: "Betsy";
  source: "SoleDash";
  raw_text: string;
  created_at: string;
  delivery_status:
    | "created"
    | "attempting"
    | "attempted"
    | "attempted_partial"
    | "confirmed"
    | "failed";
  delivery_attempted: boolean;
  delivery_confirmed: boolean;
  transport_engine: string | null;
  failure_reason: string | null;
  composer_preview: string | null;
};

export type PetraTransportResponse = {
  ok: boolean;
  envelope: PetraTransportEnvelope;
  humanGate?: string;
  error?: string;
};
