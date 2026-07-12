# F — Artifact Capability Placement and Install — 2026-07-12

Packet ID: `F_ARTIFACT_CAPABILITY_PLACEMENT_AND_INSTALL_20260712`
Packet class: `F`
Status: `READY_TO_CLAIM`
Repository: `benleakwerkles/Werkles`
Required branch: `machine-readiness-packets-20260711`
Purpose: give Werkles, Oddly Godly, and Kind Sir reliable open-format document,
spreadsheet, PDF, image, media, CAD, and data handling without installing the
whole toolchain on every machine.

## Governing Rule

Audit first. Install only a missing capability explicitly assigned below. A
program being free or open source is not enough reason to install it everywhere.

Prefer:

1. existing software already proved on the machine;
2. portable or bundled command-line capability with no background service;
3. cloud/ephemeral workers for heavy or infrequent jobs;
4. desktop installation only on a machine that repeatedly owns the work.

## Open-Format Standard

| Work | Canonical/open format | Compatibility delivery |
| --- | --- | --- |
| Repo doctrine, packets, books | Markdown / UTF-8 | DOCX, PDF |
| Formal documents/contracts | ODT | DOCX, PDF/A |
| Spreadsheets | ODS, CSV, TSV | XLSX, PDF |
| Large analytical data | Parquet, SQLite, DuckDB | XLSX/CSV extracts |
| Presentations | ODP | PPTX, PDF |
| Cockpit/config data | JSON, TOML, YAML | CSV when needed |
| Vector graphics | SVG | PDF, PNG |
| Raster/scan masters | PNG, TIFF | JPEG/WebP delivery |
| Scanned records | searchable PDF/A | ordinary PDF |
| Audio | FLAC/WAV | Opus/MP3 delivery |
| Video | WebM/AV1 or archival master | MP4/H.264 delivery |
| 3D/web | glTF/GLB | OBJ/STL when required |
| CAD/manufacturing | STEP | DXF/DWG when required |
| Construction/BIM | IFC, BCF | PDF drawing sets |
| Mapping/property | GeoJSON, GeoPackage | KML, CSV, PDF maps |

## Global Install Boundaries

- Begin with LOCAL HANDS READBACK and report machine, hostname, user, repo,
  branch, commit, dirty state, terminal, localhost, and ports.
- Inventory existing commands/apps before installing anything.
- Use exact package IDs and noninteractive package-manager commands when safe.
- Do not accept bundled offers, browser extensions, cloud-sync enablement, login,
  telemetry prompts, file sharing, or default-app takeover automatically.
- Do not install Google Drive for desktop as part of this packet.
- Do not enable startup entries, scheduled tasks, watchers, servers, sync agents,
  indexers, or background workers.
- Do not install language models, large sample libraries, media packs, or caches.
- No secrets and no `op account list`, `op whoami`, or `gh auth status`.
- Do not modify repositories except writing the authorized redacted receipt.
- If elevation, login, license acceptance beyond the package's normal open-source
  license, or provider approval is required, return a specific `BLOCKER`.

## Capability Labels

- `ODF_EDIT`
- `DOCX_RENDER`
- `XLSX_RENDER`
- `PPTX_RENDER`
- `PDF_RENDER`
- `PDF_INSPECT`
- `PDF_OCR`
- `PDF_A_VALIDATE`
- `SVG_EDIT_RENDER`
- `RASTER_EDIT`
- `AUDIO_EDIT`
- `VIDEO_TRANSCODE`
- `CAD_STEP_IFC`
- `GIS_GEOPACKAGE`
- `DATA_SQLITE_DUCKDB_PARQUET`

## Assignments

### `DOSS_DOCUMENT_VERIFICATION_BASELINE`

Target: hands local to Doss.

Required capabilities:

- `ODF_EDIT`, `DOCX_RENDER`, `XLSX_RENDER`, `PPTX_RENDER`
- `PDF_RENDER`, `PDF_INSPECT`
- `DATA_SQLITE_DUCKDB_PARQUET` through existing bundled runtimes when available

Audit for LibreOffice/`soffice` first. If missing, install LibreOffice only.
Use existing Codex bundled PDF/data dependencies before installing Poppler, qpdf,
Python, DuckDB, or other duplicate runtimes globally. Do not install creative,
CAD, GIS, audio, video, or OCR suites under this assignment.

### `BETSY_ARTIFACT_FORGE_BASELINE`

Target: hands local to Betsy.

Required baseline:

- LibreOffice for ODF and Office-format rendering
- Inkscape for `SVG_EDIT_RENDER`

Conditional only when an active claimed job needs it:

- Krita for `RASTER_EDIT`
- Audacity for `AUDIO_EDIT`
- FFmpeg for `VIDEO_TRANSCODE`
- Blender, FreeCAD, or QGIS only under a later Kind Sir/Oddly Godly job packet

Do not install the conditional tools merely to make Betsy look complete.

### `SPANZEE_ARTIFACT_CAPABILITY_AUDIT`

Target: hands local to Spanzee.
Dependency: `SPANZEE_WORKSPACE_CLI_BASELINE` must be complete.

Audit existing artifact capabilities and report gaps. Install nothing in this
assignment. Foreman will issue a later install only if Spanzee receives a durable
artifact role.

### `MEDULLINA_CLOUD_ONLY_ARTIFACT_ROUTE`

Target: hands local to Medullina (`HOSTNAME: COURTNEY`).

Install nothing. Confirm Google Docs/Drive browser access can be used when already
authorized, and route conversion/render/OCR jobs to a cloud or forge worker.
Do not enable offline files, Drive desktop sync, persistent browser automation,
or background processes. This assignment is a routing receipt, not an install.

### `SALLY_VIEWER_ARCHIVE_ROUTE`

Target: hands local to Sally.

Install nothing. Inventory existing viewers only. Route conversions and editing
to Doss, Betsy, or an ephemeral worker. Preserve Sally's archive/snapshot role and
the Ender@Sally retirement lock.

### `EPHEMERAL_ARTIFACT_WORKER_SPEC`

Target: Doozer, Codex cloud/container builder, or infrastructure reviewer.

Design a disposable worker image or job definition with:

- LibreOffice headless
- Poppler
- qpdf/pikepdf
- OCRmyPDF + Tesseract
- veraPDF for actual PDF/A validation
- Inkscape CLI
- FFmpeg
- Python data runtime with SQLite, DuckDB, Parquet support

The worker must start on demand, process an explicit input, return outputs plus
rendered previews/hashes, then discard temporary data and caches. Do not deploy or
create a paid service under this packet; return the spec and smallest build plan.

### `KIND_SIR_SPECIALIST_TOOL_DECISION`

Target: Kind Sir operator/reviewer, Dink, Doozer, or qualified cousin.

Determine whether active Kind Sir work actually needs FreeCAD, QGIS, Blender,
IFC/BCF tooling, or none. Cite the real job and required format. Return
`NO_INSTALL_WARRANTED` when PDFs, spreadsheets, or vendor exports are sufficient.

## Required Receipt

```text
RECEIVED
PACKET_ID: F_ARTIFACT_CAPABILITY_PLACEMENT_AND_INSTALL_20260712
CLAIM_ID: <packet/assignment/cousin/machine/timestamp>
ASSIGNMENT_ID: <assignment>
COUSIN: <role>
MACHINE: <machine or EPHEMERAL_CONTAINER>
HOSTNAME: <hostname>
SOURCE_COMMIT: <commit read>
EXISTING_CAPABILITIES: <labels>
MISSING_ASSIGNED_CAPABILITIES: <labels>
PROGRAMS_INSTALLED: <exact names and versions | NONE>
PACKAGE_IDS_USED: <exact IDs | NONE>
BACKGROUND_PROCESSES_ADDED: NO
STARTUP_ENTRIES_ADDED: NO
SYNC_ENABLED: NO
LARGE_CACHES_CREATED: NO
SECRETS_READ_OR_PRINTED: NO
FORBIDDEN_AUTH_COMMANDS_RUN: NO
VERIFICATION: <commands, versions, render tests, paths, hashes>
BLOCKERS: <NONE or specific blockers>
NEXT_ACTION: <specific next action>
COMPLETED
```

## Completion Rule

An install assignment is complete only after the required commands/apps are
read back and one harmless local fixture is rendered or converted successfully.
Installation success alone is not capability proof.

