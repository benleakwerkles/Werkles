# BETSY Baseline v1

Status: canonical Werkles workstation specification (read-only audit).  
Audit date: 2026-06-12  
Execution context: `LOCAL_SALLY_WINDOWS`  
Machine role: **Betsy** — primary build machine. Canonical bind: `foreman/MACHINE_TOPOLOGY.md` (Physical machine registry, confirmed 2026-06-12).

---

## Machine

| Field | Value |
|-------|-------|
| **Werkles name** | Betsy |
| **Windows hostname** | `DESKTOP-KTBH0LA` *(factory name — Operator rename to `Betsy` pending)* |
| **CPU** | AMD Ryzen 9 9950X 16-Core Processor (16 cores / 32 logical) |
| **RAM** | 31.16 GB (32 GB class) |
| **GPU** | AMD Radeon(TM) Graphics (integrated; driver 32.0.21042.62) — no discrete GPU detected in audit |
| **Motherboard** | ASUS ROG STRIX B850-A GAMING WIFI (Rev 1.xx) |
| **Storage (physical)** | WD_BLACK SN8100 4000GB SSD (~3.73 TB); Crucial CT2000P310SSD8 2000GB SSD (~1.86 TB, no mounted volume at audit) |
| **Storage (mounted)** | `C:` NTFS — 3725.03 GB total, 3641.77 GB free |
| **Windows version** | Microsoft Windows 11 Home 25H2 — build 10.0.26200 (26100.1.amd64fre.ge_release.240331-1435) |
| **BIOS version** | American Megatrends Inc. 1066 (ALASKA - 1072009); release date 2025-06-12 |

---

## Development

| Tool | Version / status |
|------|------------------|
| **Cursor** | 3.7.27 (`C:\Users\Ben Leak\AppData\Local\Programs\cursor\Cursor.exe`) |
| **Git** | 2.54.0.windows.1 |
| **Node.js** | v24.16.0 (`C:\Program Files\nodejs\`) |
| **npm** | 11.13.0 |
| **GitHub Desktop** | 3.5.12 (`C:\Users\Ben Leak\AppData\Local\GitHubDesktop\GitHubDesktop.exe`) |
| **VS Code** | 1.124.0 (`C:\Users\Ben Leak\AppData\Local\Programs\Microsoft VS Code\Code.exe`) |
| **WSL** | Not installed |
| **Docker** | Not installed / not on PATH |

### Operational notes (audit observations, not changes)

- Node.js and npm are installed under `C:\Program Files\nodejs\` but may not be on the default shell PATH; agents may need PATH prepended before `npm run dev`.
- Git is available when `C:\Program Files\Git\cmd` is on PATH.

---

## Network

| Field | Value |
|-------|-------|
| **Primary LAN interface** | Ethernet — Intel(R) Ethernet Controller I226-V |
| **LAN IP** | `10.1.10.194/24` |
| **Link speed** | 1 Gbps |
| **Internet speed** | Not measured (audit only; no speed test performed) |

---

## Werkles

| Field | Value |
|-------|-------|
| **Repo path** | `C:\Users\Ben Leak\Desktop\github\Werkles` |
| **Remote** | `https://github.com/benleakwerkles/Werkles1` |
| **Current branch** | `snapshot/sally-good-werkles-2026-06-12` |
| **Current commit** | `437792b6ee8e907f80f088e15de9adb0f9525e6d` — `docs(crew): mandate LOCAL HANDS READBACK at session start` |
| **Working tree** | At audit: 5 gd-intent-router run paths failed checkout (265–273 char paths). Restored 2026-06-12 from verified `foreman/handoffs/` mirrors; `git config core.longpaths true` set locally. Pending local foreman only: `MACHINE_TOPOLOGY.md` (modified), `BETSY_BASELINE_v1.md` (untracked). |

### Localhost status (at audit)

| Port | Process | HTTP | Page title |
|------|---------|------|------------|
| **3000** | `node` (PID 23184) | 200 OK | Werkles \| Business partner matching |
| **3001** | `node` (PID 20172) | 200 OK | Werkles \| Business partner matching |

Both ports responded with the Werkles Next.js dev preview at audit time.

---

## Audit constraints

- No software installed.
- No software updated.
- No settings changed.
- Machine state read only; this file is the audit artifact.
