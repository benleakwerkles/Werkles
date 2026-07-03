import { createServer } from "node:http";
import { handleRequest } from "./router.js";

const port = Number(process.env.WERKLES_API_PORT || 8787);

createServer(handleRequest).listen(port, () => {
  console.log(`werkles-api listening on http://127.0.0.1:${port}`);
});
