import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Canon hash verifier. The VPGM packet instructs the Foreman to return
 * BLOCKER: OPERATING_CANON_NOT_VERIFIED rather than reconstruct canon from
 * memory, so canon needs a hash that can actually be checked.
 *
 * The hash covers only the bytes between the canon markers, so the surrounding
 * preamble can be edited without invalidating canon.
 */

const ROOT = process.cwd();
const CANON = path.join(ROOT, "foreman/VPGM_OPERATING_CANON.md");
const LOCK = path.join(ROOT, "foreman/VPGM_OPERATING_CANON.sha256");
const BEGIN = "<!-- VPGM_CANON_BEGIN -->";
const END = "<!-- VPGM_CANON_END -->";

function canonBytes() {
  if (!fs.existsSync(CANON)) return null;
  const raw = fs.readFileSync(CANON, "utf8");
  const start = raw.indexOf(BEGIN);
  const stop = raw.indexOf(END);
  if (start < 0 || stop < 0 || stop < start) return null;
  /* Normalise line endings so a Windows checkout and a Linux one agree. */
  return raw.slice(start + BEGIN.length, stop).replace(/\r\n/g, "\n").trim();
}

const body = canonBytes();

if (body === null) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        blocker: "OPERATING_CANON_NOT_VERIFIED",
        reason: fs.existsSync(CANON)
          ? "Canon markers missing or malformed."
          : `Canon file absent: ${path.relative(ROOT, CANON)}`,
      },
      null,
      2
    )
  );
  process.exit(1);
}

const hash = crypto.createHash("sha256").update(body, "utf8").digest("hex");
const args = process.argv.slice(2);

if (args.includes("--write")) {
  fs.writeFileSync(LOCK, `${hash}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, wrote: path.relative(ROOT, LOCK), sha256: hash }, null, 2));
  process.exit(0);
}

if (!fs.existsSync(LOCK)) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        blocker: "OPERATING_CANON_NOT_VERIFIED",
        reason: "No recorded hash to compare against. Run with --write once, after the Operator confirms the canon text.",
        computed: hash,
      },
      null,
      2
    )
  );
  process.exit(1);
}

const recorded = fs.readFileSync(LOCK, "utf8").trim();
const ok = recorded === hash;

console.log(
  JSON.stringify(
    {
      ok,
      blocker: ok ? null : "OPERATING_CANON_NOT_VERIFIED",
      canon: path.relative(ROOT, CANON),
      recorded,
      computed: hash,
      bytes: Buffer.byteLength(body, "utf8"),
    },
    null,
    2
  )
);
process.exit(ok ? 0 : 1);
