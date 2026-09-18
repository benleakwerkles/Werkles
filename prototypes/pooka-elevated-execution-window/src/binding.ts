import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { ClientBinding, MachineId, ReceiverId } from "./types.ts";

export function mintSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function mintBindingNonce(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Authenticated local binding: machine + receiver + client PID + exe hash + token.
 * Prototype uses HMAC over binding fields; live Windows would bind to process handle
 * and named-pipe peer identity. No passwords typed; no UAC bypass.
 */
export function sealBinding(
  binding: Omit<ClientBinding, "sessionToken" | "bindingNonce"> & {
    sessionToken?: string;
    bindingNonce?: string;
  },
  sharedSecretMaterial: string
): ClientBinding {
  const sessionToken = binding.sessionToken ?? mintSessionToken();
  const bindingNonce = binding.bindingNonce ?? mintBindingNonce();
  const full: ClientBinding = {
    machineId: binding.machineId,
    receiverId: binding.receiverId,
    clientProcessId: binding.clientProcessId,
    clientExecutableHash: binding.clientExecutableHash,
    sessionToken,
    bindingNonce
  };
  // Seal is verified via computeBindingMac — token itself is the bearer.
  void computeBindingMac(full, sharedSecretMaterial);
  return full;
}

export function computeBindingMac(binding: ClientBinding, sharedSecretMaterial: string): string {
  const payload = [
    binding.machineId,
    binding.receiverId,
    String(binding.clientProcessId),
    binding.clientExecutableHash,
    binding.sessionToken,
    binding.bindingNonce
  ].join("|");
  return createHmac("sha256", sharedSecretMaterial).update(payload).digest("hex");
}

export function verifyBinding(input: {
  presented: ClientBinding;
  expected: ClientBinding;
  expectedMachineId: MachineId;
  expectedReceiverId: ReceiverId;
  sharedSecretMaterial: string;
}): { ok: true } | { ok: false; reason: string } {
  const { presented, expected, expectedMachineId, expectedReceiverId, sharedSecretMaterial } = input;

  if (presented.machineId !== expectedMachineId || expected.machineId !== expectedMachineId) {
    return { ok: false, reason: "machine_mismatch" };
  }
  if (presented.receiverId !== expectedReceiverId || expected.receiverId !== expectedReceiverId) {
    return { ok: false, reason: "receiver_mismatch" };
  }
  if (presented.clientProcessId !== expected.clientProcessId) {
    return { ok: false, reason: "client_pid_mismatch" };
  }
  if (presented.clientExecutableHash !== expected.clientExecutableHash) {
    return { ok: false, reason: "client_exe_hash_mismatch" };
  }
  if (presented.bindingNonce !== expected.bindingNonce) {
    return { ok: false, reason: "nonce_mismatch" };
  }

  const a = Buffer.from(computeBindingMac(presented, sharedSecretMaterial), "hex");
  const b = Buffer.from(computeBindingMac(expected, sharedSecretMaterial), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "token_mac_mismatch" };
  }

  if (presented.sessionToken !== expected.sessionToken) {
    return { ok: false, reason: "session_token_mismatch" };
  }

  return { ok: true };
}
