import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const appRoot = path.resolve("app");
const HEADER_NAMES = new Set(["SiteHeader", "LocalAwareSiteHeader"]);
const EXCEPTIONS = Object.freeze({
  "/gd/command-console": "redirect_only",
  "/gd/speaker": "redirect_only",
  "/soledash": "fullscreen_operator_app"
});

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(absolute) : [absolute];
  });
}

function routeFor(pageFile) {
  const relative = path.relative(appRoot, path.dirname(pageFile)).replaceAll(path.sep, "/");
  return relative ? `/${relative.replace(/\([^/]+\)\/?/g, "")}`.replace(/\/$/, "") : "/";
}

function headerMountCount(file) {
  if (!fs.existsSync(file)) return 0;
  const source = fs.readFileSync(file, "utf8");
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let count = 0;
  function walk(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      if (HEADER_NAMES.has(node.tagName.getText(tree))) count += 1;
    }
    ts.forEachChild(node, walk);
  }
  walk(tree);
  return count;
}

function compositionFiles(pageFile) {
  const files = [pageFile];
  let directory = path.dirname(pageFile);
  while (directory.startsWith(appRoot)) {
    const layout = path.join(directory, "layout.tsx");
    if (fs.existsSync(layout)) files.push(layout);
    if (directory === appRoot) break;
    directory = path.dirname(directory);
  }
  return files;
}

const pages = filesUnder(appRoot)
  .filter((file) => file.endsWith(`${path.sep}page.tsx`) && !file.includes(`${path.sep}api${path.sep}`))
  .sort();

const report = pages.map((pageFile) => {
  const route = routeFor(pageFile);
  const files = compositionFiles(pageFile);
  const mounts = files.reduce((sum, file) => sum + headerMountCount(file), 0);
  return { route, mounts, exception: EXCEPTIONS[route] ?? null };
});

for (const row of report) {
  if (row.exception === "redirect_only") {
    const source = fs.readFileSync(path.join(appRoot, row.route.slice(1), "page.tsx"), "utf8");
    assert.match(source, /redirect\(/, `${row.route} must remain redirect-only`);
    assert.equal(row.mounts, 0, `${row.route} redirect must not flash a duplicate header`);
    continue;
  }
  if (row.exception === "fullscreen_operator_app") {
    const layout = fs.readFileSync(path.join(appRoot, "soledash", "layout.tsx"), "utf8");
    assert.match(layout, /aria-label="Return to Werkles"/, "SoleDash needs a visible return to Werkles");
    assert.equal(row.mounts, 0, "SoleDash uses its explicit focused-surface exception");
    continue;
  }
  assert.equal(row.mounts, 1, `${row.route} must inherit exactly one shared Werkles header; found ${row.mounts}`);
}

const siteHeader = fs.readFileSync("components/foundry/site-header.tsx", "utf8");
assert.match(siteHeader, /id="werkles-site-header"/);
assert.match(siteHeader, /primaryNavItems\.map/);
assert.match(siteHeader, /memberNavItems\.map/);
assert.match(siteHeader, /aria-label="Primary navigation"/);
assert.match(siteHeader, /aria-label="Member navigation"/);

console.log(`PASS sitewide header continuity: ${report.length} rendered routes; ${report.length - Object.keys(EXCEPTIONS).length} shared-header routes; ${Object.keys(EXCEPTIONS).length} explicit exceptions`);
