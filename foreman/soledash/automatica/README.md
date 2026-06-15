# Automatica Real Routes

Route map:

```text
foreman/soledash/AUTOMATICA_ROUTE_MAP.json
```

Runner:

```text
python foreman/soledash/automatica/run_automatica_route.py <route_id>
```

Run all:

```text
python foreman/soledash/automatica/run_automatica_route.py --all
```

Each route writes:

- `foreman/soledash/actions/automatica_<route_id>_<timestamp>.json`
- `foreman/soledash/receipts/automatica_<route_id>_<timestamp>.json`

Every receipt carries:

- `decision`
- `why`
- `evidence`
- `assumption`
- `blocker`
- `next_action`
- `confidence`

Maker should render cards from `AUTOMATICA_ROUTE_MAP.json` and call the route command from each card button. A failed or blocked route is still a successful transport event if it writes a receipt.
