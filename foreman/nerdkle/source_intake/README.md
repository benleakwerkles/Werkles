# Nerdkle GitHub Source Intake

This inbox records source material that lives on GitHub review branches.

The intake does not promote branches, merge code, or call manuscript text working proof. It verifies that a GitHub branch, commit, packet, and named artifact exist, then writes a status artifact for the Nerdkle kernel verifier.

## Inbox

Drop source manifests into:

`foreman/nerdkle/source_intake/inbox/`

Then run:

```powershell
node foreman\nerdkle\ingest-github-source-material.mjs
```

## Proof Boundary

- GitHub branch existence proves source availability.
- A manuscript artifact proves a manuscript exists.
- A preserved proof body proves a candidate is preserved.
- Pending real-input packets remain pending until production receipts exist.
- Review branches are not canonical until a human promotion gate says so.
