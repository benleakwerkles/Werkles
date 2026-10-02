import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { chromium } from "playwright";

const HASH = /^[a-f0-9]{64}$/;
const HOST_KEY = "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.werkles.pookakind.stewart_generalized";
function fail(code) { const error = new Error(code); error.code = code; throw error; }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function contained(root, target) { return target.startsWith(`${root}${sep}`); }

/** One owned headless context; no browser, registry, or profile work occurs before exact package admission. */
export async function withStewartDisneyOwnedBrowser({
  package_root, package_observation, profile_parent, chrome_executable_path,
  initial_url, registry, launch, now = () => Date.now(),
}, execute) {
  if (typeof execute !== "function" || typeof launch !== "function"
    || typeof registry?.read !== "function" || typeof registry?.write !== "function" || typeof registry?.remove !== "function"
    || package_observation?.state !== "EXACT_HASH_VERIFIED" || !HASH.test(package_observation.package_sha256 ?? "")) fail("STEWART_DISNEY_OWNED_BROWSER_INPUT_INVALID");
  const packageRoot = realpathSync(resolve(package_root));
  const extension = realpathSync(join(packageRoot, "extension"));
  const manifest = realpathSync(join(packageRoot, "com.werkles.pookakind.stewart_generalized.json"));
  const chrome = realpathSync(resolve(chrome_executable_path));
  const profileParent = realpathSync(resolve(profile_parent));
  if (!contained(packageRoot, extension) || !contained(packageRoot, manifest)
    || package_observation.files?.find((file) => file.relative_path === "com.werkles.pookakind.stewart_generalized.json")?.sha256 !== sha256(readFileSync(manifest))) fail("STEWART_DISNEY_OWNED_BROWSER_PACKAGE_DRIFT");
  let url; try { url = new URL(initial_url); } catch { fail("STEWART_DISNEY_OWNED_BROWSER_ORIGIN_INVALID"); }
  if (url.protocol !== "https:" || url.hostname !== "login.disney.com" || url.username || url.password || url.hash) fail("STEWART_DISNEY_OWNED_BROWSER_ORIGIN_INVALID");
  if (await registry.read(HOST_KEY) !== null) fail("STEWART_DISNEY_OWNED_BROWSER_REGISTRY_NOT_CLEAN");
  const sessionRoot = join(profileParent, `disney-${randomUUID()}`);
  const profile = join(sessionRoot, "profile");
  let context = null; let madeRoot = false; let outcome;
  try {
    mkdirSync(sessionRoot, { recursive: false }); madeRoot = true;
    mkdirSync(profile, { recursive: false });
    await registry.write(HOST_KEY, manifest);
    if (await registry.read(HOST_KEY) !== manifest) fail("STEWART_DISNEY_OWNED_BROWSER_REGISTRY_READBACK_FAILED");
    context = await launch({ executablePath: chrome, userDataDir: profile, headless: true,
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`, "--disable-sync", "--disable-default-apps", "--no-first-run"] });
    const before = await context.storageState();
    const initialPages = context.pages();
    if ((before.cookies ?? []).length || (before.origins ?? []).length || initialPages.length > 1
      || initialPages.some((page) => page.url() !== "about:blank")) fail("STEWART_DISNEY_OWNED_BROWSER_IMPORTED_STATE");
    const page = initialPages[0] ?? await context.newPage();
    await page.goto(url.href, { waitUntil: "domcontentloaded" });
    if (context.pages().length !== 1 || page.url() !== url.href) fail("STEWART_DISNEY_OWNED_BROWSER_PAGE_DRIFT");
    const session_ref_sha256 = sha256(`${package_observation.package_sha256}:${profile}:${now()}`);
    outcome = await execute({ context, session_ref_sha256, initial_url: url.href });
  } finally {
    let cleanupError = null;
    try { if (context) await context.close(); } catch { cleanupError = "STEWART_DISNEY_OWNED_BROWSER_CLOSE_FAILED"; }
    try {
      const found = await registry.read(HOST_KEY);
      if (found !== null && found !== manifest) fail("STEWART_DISNEY_OWNED_BROWSER_REGISTRY_DRIFT");
      if (found === manifest) await registry.remove(HOST_KEY);
      if (await registry.read(HOST_KEY) !== null) fail("STEWART_DISNEY_OWNED_BROWSER_REGISTRY_RESIDUAL");
    } catch { cleanupError = "STEWART_DISNEY_OWNED_BROWSER_REGISTRY_CLEANUP_FAILED"; }
    try {
      if (madeRoot && existsSync(sessionRoot)) {
        if (!contained(profileParent, resolve(sessionRoot))) fail("STEWART_DISNEY_OWNED_BROWSER_PROFILE_PATH_ESCAPE");
        rmSync(sessionRoot, { recursive: true });
      }
    } catch { cleanupError = "STEWART_DISNEY_OWNED_BROWSER_PROFILE_CLEANUP_FAILED"; }
    if (cleanupError) fail(cleanupError);
  }
  return outcome;
}

/** Doss-only machine hands. The caller must verify activation before constructing this runtime. */
export function createDossStewartDisneyOwnedBrowserHands({ chrome_executable_path }) {
  const local = process.env.LOCALAPPDATA;
  if (process.platform !== "win32" || process.env.COMPUTERNAME?.toUpperCase() !== "DOSS"
    || typeof local !== "string" || !local) fail("STEWART_DISNEY_OWNED_BROWSER_DOSS_REQUIRED");
  const profile_parent = join(local, "PookaKind", "Stewart", "OwnedDisneySessions");
  const run = (args) => spawnSync("reg.exe", args, { windowsHide: true, encoding: "utf8", maxBuffer: 16 * 1024 });
  const registry = Object.freeze({
    async read(key) {
      if (key !== HOST_KEY) fail("STEWART_DISNEY_OWNED_BROWSER_REGISTRY_KEY_INVALID");
      const result = run(["QUERY", key, "/ve"]);
      if (result.status !== 0) return null;
      const value = /REG_SZ\s+(.+)$/m.exec(result.stdout)?.[1]?.trim();
      if (!value) fail("STEWART_DISNEY_OWNED_BROWSER_REGISTRY_READ_INVALID");
      return value;
    },
    async write(key, value) {
      if (key !== HOST_KEY || !value) fail("STEWART_DISNEY_OWNED_BROWSER_REGISTRY_WRITE_INVALID");
      if (run(["ADD", key, "/ve", "/t", "REG_SZ", "/d", value, "/f"]).status !== 0) fail("STEWART_DISNEY_OWNED_BROWSER_REGISTRY_WRITE_FAILED");
    },
    async remove(key) {
      if (key !== HOST_KEY || run(["DELETE", key, "/f"]).status !== 0) fail("STEWART_DISNEY_OWNED_BROWSER_REGISTRY_REMOVE_FAILED");
    },
  });
  return Object.freeze({ chrome_executable_path, profile_parent, registry,
    launch: ({ userDataDir, ...options }) => chromium.launchPersistentContext(userDataDir, options),
    prepareProfileParent() { mkdirSync(profile_parent, { recursive: true }); },
  });
}
