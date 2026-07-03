import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const execFileAsync = promisify(execFile);

const COMMANDS = {
  PROVE_HOSTNAME: {
    command: "hostname",
    args: [] as string[],
  },
} as const;

type CommandId = keyof typeof COMMANDS;

type Receipt = {
  verdict: "SWAT";
  command_id: CommandId;
  executed: true;
  machine_hostname: string;
  timestamp: string;
  stdout: string;
  exit_code: 0;
};

async function proveDenIsAlive() {
  const commandId: CommandId = "PROVE_HOSTNAME";
  const command = COMMANDS[commandId];
  const { stdout } = await execFileAsync(command.command, command.args, {
    encoding: "utf8",
    timeout: 5000,
    windowsHide: true,
  });
  const normalizedStdout = stdout.trim();
  const receipt: Receipt = {
    verdict: "SWAT",
    command_id: commandId,
    executed: true,
    machine_hostname: normalizedStdout,
    timestamp: new Date().toISOString(),
    stdout: normalizedStdout,
    exit_code: 0,
  };

  return receipt;
}

export async function POST() {
  const receipt = await proveDenIsAlive();
  return NextResponse.json(receipt);
}

export async function GET() {
  const receipt = await proveDenIsAlive();
  return NextResponse.json(receipt);
}
