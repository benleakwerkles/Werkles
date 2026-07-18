import { randomBytes, scrypt } from "node:crypto";

const N = 131_072;
const r = 8;
const p = 1;
const keyLength = 32;

if (process.argv[2] !== "--internal-stdio" || process.stdin.isTTY || process.stdout.isTTY) {
  process.stderr.write("INTERNAL_BRIDGE_ONLY\n");
  process.exit(2);
}

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const password = Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
if (!password || Buffer.byteLength(password, "utf8") > 1024) {
  process.stderr.write("PASSWORD_INPUT_INVALID\n");
  process.exit(3);
}

const salt = randomBytes(24);
const derived = await new Promise((resolve, reject) => {
  scrypt(password, salt, keyLength, { N, r, p, maxmem: 256 * 1024 * 1024 }, (error, value) => error ? reject(error) : resolve(value));
});
const verifier = ["scrypt-v1", N, r, p, salt.toString("base64url"), derived.toString("base64url")].join("$");
const sessionSecret = randomBytes(48).toString("base64url");
process.stdout.write(JSON.stringify({ verifier, sessionSecret }));
