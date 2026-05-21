import { readFileSync } from "node:fs";
import path from "node:path";

function bodyFromHtml(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

export function readStaticBody(fileName: "index.html" | "proof.html") {
  const html = readFileSync(path.join(process.cwd(), fileName), "utf8");

  return bodyFromHtml(html)
    .replace(/<script\s+src="app\.js"><\/script>/i, "")
    .replaceAll('src="assets/', 'src="/assets/')
    .replaceAll('href="proof.html"', 'href="/proof"')
    .replaceAll('href="index.html#', 'href="/#')
    .replaceAll('href="index.html"', 'href="/"');
}
