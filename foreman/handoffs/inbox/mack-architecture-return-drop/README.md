# Mack Architecture Return Drop

Status: WAITING_FOR_MACK_RETURN

Put Mack's returned `MACK REVIEW RETURN` block here as a `.txt` or `.md` file.

The processor reads the newest `.txt` or `.md` file in this folder:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Process-MackArchitectureReturnDrop.ps1
```

The processor is dry-run by default. It does not write the canonical intake unless `-Commit` is explicitly provided.

This folder is a local inbox only. It does not send anything to Mack, does not read the clipboard, does not claim Mack returned review while empty, and does not create a next-build packet.
