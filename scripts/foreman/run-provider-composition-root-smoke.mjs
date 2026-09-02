import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const target = fileURLToPath(new URL("./provider-composition-root-smoke.ts", import.meta.url));
const result = spawnSync(process.execPath, ["--conditions=react-server", target], {
  cwd: process.cwd(),
  encoding: "utf8",
  stdio: "inherit"
});

if (result.error) {
  console.error(result.error.message);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
