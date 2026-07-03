import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "..", "foreman", "receipts", "browser-capture", "playwright-video");
const stopFile = path.join(outDir, "STOP.requested");

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(stopFile, new Date().toISOString());
console.log("STOP_REQUESTED", stopFile);
