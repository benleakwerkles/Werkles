# Harvey Codex Task Migration Ledger

Status: EXECUTED
Updated: 2026-07-15
Scope: Ben's Harvey/Werkles tasks only
Archive policy: reversible; no task deletion

## Cloud source receipt

~~~text
Repository: benleakwerkles/Werkles
Branch: codex/cloud-harvey-mobile-vpg-20260715
Folder: Harvey/Werkles Mobile/
Local source checkout: NONE
~~~

## Active anchor

| Task id | Title | Codex project | State | Pin |
|---|---|---|---|---|
| 019f6742-a15b-7a51-844e-a0554eada943 | BEN — Harvey Mobile Cloud | Werkles Reboot empty task container | ACTIVE | PINNED |

This is the only active Harvey build/source task. Its source authority is the GitHub cloud branch, not its empty local task-container path.

## Reference task

| Task id | Title | Codex project | State | Pin |
|---|---|---|---|---|
| 019f544f-fc25-74a3-be8a-88f856b22fcf | BEN — Werkles Machine Readiness | Werkles Reboot empty task container | REFERENCE | UNPINNED |

## Archived superseded Harvey tasks

| Task id | Former title | Former workspace | Reason |
|---|---|---|---|
| 019f4efd-12e2-7733-baf9-8254dc82a590 | Attach project to Harvey Mobile | Werkles Reboot | Superseded by the pinned cloud anchor |
| 019f34ee-0291-7800-812c-77095020701f | Locate Werkles mobile folder | Courtney Game | Goal completed; wrong project boundary |
| 019f2ecd-4eba-7473-8b64-15d53b4eeb93 | Prepare Werkles Mobile handoff | Courtney Game | Superseded handoff; wrong project boundary |
| 019f2ecc-ddfd-7882-b09c-fcd5e8a0481e | Prepare Werkles Mobile handoff | Courtney Game | Duplicate superseded handoff |
| 019f28da-0a0c-78b1-be65-18ff22e25d0d | Work on Harvey Mobile | Courtney Game | Superseded by the pinned cloud anchor |
| 019f28bf-76ac-7e21-9444-d72e8075376b | Create Harvey Mobile app | Courtney Game | Goal moved to Ben's GitHub cloud branch |
| 019f2105-a7cc-7bc0-b43a-5bae56581fd4 | Publish Werkles app to GitHub | Courtney Game | Publishing work consolidated in cloud anchor |
| 019f243b-3ca2-7ba1-a411-42545a8e4984 | Werkles Mobile Sandbox | temporary local sandbox | Local sandbox retired after cloud publication |

All eight tasks were archived through Codex task metadata. They were not deleted and may be restored if historical continuation is required.

## Explicitly excluded from Harvey cleanup

These tasks remain untouched because they are Courtney, machine-admin, or unrelated work:

- Review shared chat
- Document ProtoCall workflow
- Add admin Gimp
- Locate ShareX and GCC origin
- Run systems check
- Fix Chrome sign-in hang

## Status vocabulary

- ACTIVE: current execution anchor
- REFERENCE: useful context, not an execution lane
- SUPERSEDED: replaced by a newer proven task
- ARCHIVED: hidden from active clutter, restorable, not deleted

## Next project move

The current Codex app exposes only local projects to this agent and no project-creation action. When a GitHub-backed remote project becomes available:

1. create or select BEN — Werkles Cloud
2. reopen the active anchor in that remote project
3. verify GitHub repository and branch context
4. retire the empty Werkles Reboot task container

Until that receipt exists, do not call the empty local project shell canonical source.
