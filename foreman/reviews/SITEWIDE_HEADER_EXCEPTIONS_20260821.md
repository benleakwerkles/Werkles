# Sitewide Header Exceptions

Version: `sitewide-header-exceptions/v1`  
Date: 2026-08-21  
Status: local audit contract

All ordinary Werkles pages render exactly one shared Werkles header. These are
the only current exceptions:

| Route | Category | Reason | Required continuity control |
|---|---|---|---|
| `/gd/command-console` | Redirect-only utility | Immediately redirects to the local Foreman control surface; it does not render a Werkles page. | Destination owns its chrome; no intermediate header flash. |
| `/gd/speaker` | Redirect-only utility | Immediately redirects to the local Speaker surface; it does not render a Werkles page. | Destination owns its chrome; no intermediate header flash. |
| `/soledash` | Full-screen focused operator application | Wonka Den is an explicitly separate AEYE workbench with its own application identity and viewport contract. | A persistent, keyboard-visible `Return to Werkles` control appears at the upper edge. |

API routes, metadata assets, and framework error files are excluded by
construction because they are not `page.tsx` routes. Adding another exception
requires a written row with a member-truth reason and continuity control.
