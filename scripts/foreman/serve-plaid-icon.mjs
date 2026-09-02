#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const ROOT = process.cwd();
const ICON = path.join(ROOT, "public/werkles-plaid-app-icon-1024.png");
const PORT = 8765;

const data = fs.readFileSync(ICON);

http
  .createServer((req, res) => {
    if (req.url === "/" || req.url?.includes("werkles-plaid")) {
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="Werkles-Plaid-App-Icon-1024.png"',
        "Content-Length": data.length
      });
      res.end(data);
      return;
    }
    res.writeHead(404);
    res.end("Not found");
  })
  .listen(PORT, "127.0.0.1", () => {
    console.log(`http://127.0.0.1:${PORT}/`);
  });
