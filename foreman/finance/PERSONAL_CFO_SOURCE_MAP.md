# Personal CFO Source Map v1

**Mission:** `PERSONAL_CFO_SOURCE_MAP_V1`  
**Status:** inventory / planning only — no money movement, no account mutation, no secrets  
**Operator:** Ben  
**Companion:** `foreman/finance/FINANCE_COCKPIT_REQUIREMENTS.md` · `foreman/finance/FINANCE_COMMAND_README.md`

---

## Doctrine (locked)

| Allowed | Forbidden |
|---------|-----------|
| Read-only inventory of where data lives | Transfers, payments, account changes |
| Masks only (`...XXXX`, last-4) in repo files | Full account numbers, routing, CVV, tokens |
| Operator-initiated export from each provider UI | Credential export, password sharing, API keys in git |
| Manual CSV / structured paste into local cockpit JSON | Tax filing decisions, irreversible financial actions |
| Ben approves each import bridge | Agents clicking Pay, Transfer, Open account |

**No-password rule:** Ben never pastes passwords, MFA codes, full PAN, routing numbers, or Plaid/QBO/OAuth tokens into chat, repo, or Foreman files. Maker uses already-authorized sessions on Ben's machine or operator-exported CSV/PDF dropped into an approved inbox path — never asks Ben to type secrets.

---

## 1. Available data sources (inventory)

| # | Source | Access path (Operator) | Refresh cadence | Repo touch today |
|---|--------|------------------------|-----------------|------------------|
| A | **ChatGPT Finance** (linked accounts) | ChatGPT app → Finance / linked accounts view | When Ben opens session | None — not bridged |
| B | **Wells Fargo** (via Plaid in ChatGPT Finance) | Aggregated in ChatGPT Finance; native WF app for statements | Daily-ish aggregate | None |
| C | **Citizens mortgage** | Citizens portal / statement PDF | Monthly statement | None |
| D | **Chase card** | Chase app / statement | Monthly + ongoing tx | None |
| E | **Mercury** (business) | Mercury dashboard if authorized session exists | Real-time in app | Referenced in Bellows affiliate list only |
| F | **QuickBooks Online (QBO)** | QBO reports export (P&L, BS, register) | Per close / on demand | None |
| G | **Aramis Property Management** | PM portal / owner statements / rent reports | Monthly | None in repo |
| H | **Google Sheets — rent roll** | Ben's Google Drive (URL in Operator vault, not repo) | Operator-maintained | None |
| I | **Google Sheets — mortgage/debt tracker** | Same | Operator-maintained | None |
| J | **County tax records** | County assessor / treasurer public lookup | Annual + supplemental | None unless Ben saved refs |
| K | **Property valuation comps** | Zillow/Redfin exports, appraiser PDFs, BRRRR worksheets | Ad hoc | Template placeholders in education drafts only |
| L | **Foreman Finance Command** (local) | `foreman/finance/*.json` on Sally | Manual / `finance-command.mjs` | **Active** — entity ledger, not bank feed |

---

## 2. What each source proves

| Source | Proves | Does not prove |
|--------|--------|----------------|
| **ChatGPT Finance + Plaid aggregate** | Linked balances, recent categorized spend, cash snapshot | Entity attribution, tax basis, rent vs business split |
| **Wells Fargo (Plaid)** | WF balances and transactions for linked accounts | Which entity owns the account without Operator mapping |
| **Citizens mortgage** | Principal, rate, escrow, payment history, lien | Market value, NOI, capex plan |
| **Chase card** | Card spend, payment due | Reimbursable vs personal without classification |
| **Mercury** | Business cash, card, treasury if connected | Personal net worth, real estate |
| **QBO** | Accrual books per entity, COA, vendor history | Personal mortgage not in QBO, off-book properties |
| **Aramis PM** | Rent collected, vacancies, fees, owner distributions | Properties not under Aramis |
| **Sheets rent roll** | Unit mix, lease dates, scheduled rent | Bank proof of deposit without reconciliation |
| **Sheets mortgage/debt tracker** | Amortization intent, refi notes, combined debt | Live payoff without lender portal |
| **County tax** | Assessed value, tax line, parcel ID | Market value, insurance replacement cost |
| **Valuation comps** | Market range for sale/refi narrative | Appraisal for lending |
| **Foreman finance JSON** | Cross-entity spend classification, reimbursement queue | Live bank balance unless manually entered |

---

## 3. Missing fields for valuation

| Field | Tab | Likely source | Gap |
|-------|-----|---------------|-----|
| Property address / parcel ID | Properties | County, PM | Not in repo |
| Purchase date and price | Properties, Stock Counterfactual | Closing stmt, Sheets | Not centralized |
| Market estimate (low/base/high) | Properties, Net Worth | Comps export | No canonical row per property |
| Gross scheduled rent | Rent Roll | Sheets, Aramis | Merge rules undefined |
| Economic vacancy | Rent Roll, Business CF | PM + bank | Not automated |
| OpEx (tax, ins, maint, PM fee) | Business CF | QBO, PM, Sheets | Entity split unclear |
| Live mortgage balance | Mortgages, Debt | Citizens | Not imported |
| Rate, term, ARM reset | Mortgages | Citizens, Sheets | Single source of truth TBD |
| Escrow (tax/insurance) | Taxes/Insurance | Citizens, county | Not linked |
| Entity ownership % | Properties, Owner Distributions | Legal/org chart | Not in finance JSON |
| Werkles revenue / SDE | Business Valuation | QBO, Mercury | QBO not bridged |
| Owner draw vs distribution | Owner Distributions | QBO, Mercury | Unmapped |
| Personal liquid assets | Bank Balances, Net Worth | ChatGPT Finance | Entity tags missing |
| Credit card balances | Debt | Chase | Not in Foreman ledger |
| Stock/brokerage counterfactual | Stock Counterfactual | ChatGPT if linked | Confirm linkage |
| Cap rate / DSCR assumptions | Business Valuation | Operator model | Policy not documented |

---

## 4. Safe extraction method per source

| Source | Safe method | Output | Drop zone |
|--------|-------------|--------|-----------|
| ChatGPT Finance | CSV or redacted export from Finance view; or browser read with Ben present for MFA | date, merchant, amount, category, account_mask | `foreman/finance/imports/inbox/chatgpt-finance/` |
| Wells Fargo / Plaid | ChatGPT export or WF statement → redacted CSV | Ledger CSV | `imports/inbox/wells-fargo/` |
| Citizens mortgage | Statement PDF → one summary row in template CSV | balance, rate, payment, property link | `imports/inbox/citizens-mortgage/` |
| Chase card | Statement CSV (last-4 in label only) | Ledger CSV | `imports/inbox/chase/` |
| Mercury | Export transactions CSV while logged in | CSV with masks | `imports/inbox/mercury/` |
| QBO | P&L, BS, transaction detail CSV | Entity-tagged CSV | `imports/inbox/qbo/` |
| Aramis PM | Owner statement PDF/CSV | Rent lines per unit | `imports/inbox/aramis/` |
| Sheets rent roll | File → Download CSV | `rent-roll-YYYY-MM-DD.csv` | `imports/inbox/sheets-rent-roll/` |
| Sheets debt tracker | Download CSV | `debt-tracker-YYYY-MM-DD.csv` | `imports/inbox/sheets-debt/` |
| County tax | Assessor page PDF/CSV | parcel, assessed value, tax due | `imports/inbox/county-tax/` |
| Valuation comps | Comp export or 3-comp table CSV | address, price, date, source | `imports/inbox/valuations/` |
| Foreman finance | `finance-command.mjs validate` | JSON | `foreman/finance/` |

Import inbox is gitignored — raw exports stay off git until redaction review.

---

## 5. No-password rule

1. Never store passwords, OAuth tokens, Plaid link tokens, or API keys in repo or chat.
2. Never ask Ben to paste credentials for Maker login.
3. Allowed: Ben logged in; Maker uses browser with Ben at keyboard for MFA, or Ben drops exports in inbox.
4. Allowed in repo: account labels, masks, amounts, dates, merchants, entity IDs from `entities.json`.
5. Human gate before import scripts run: Ben replies `IMPORT APPROVED: <source>`.

---

## 6. Proposed unified model tabs

| Tab | Primary sources | Key columns (v1) |
|-----|-----------------|-------------------|
| **Properties** | Sheets, county, PM, valuations | property_id, address, parcel, entity, units, acquisition_date, acquisition_price, market_low/base/high, data_as_of |
| **Mortgages** | Citizens, Sheets debt | property_id, lender, balance, rate, term, payment_pi, escrow, maturity |
| **Rent Roll** | Sheets, Aramis | property_id, unit, tenant_mask, lease_start/end, rent_scheduled, rent_actual, vacancy_flag |
| **Taxes/Insurance** | County, Citizens escrow, QBO | property_id, tax_assessed, tax_due_annual, ins_premium, escrow_monthly |
| **Business Cash Flow** | QBO, Mercury | entity_id, month, revenue, cogs, opex, noi_proxy |
| **Owner Distributions** | QBO, Mercury, manual | entity_id, date, amount, type, destination_mask |
| **Bank Balances** | ChatGPT Finance, Mercury | as_of_date, institution, account_label, mask, balance, entity_id |
| **Debt** | Citizens, Chase, Sheets | debt_id, type, balance, rate, payment, collateral_property_id |
| **Net Worth** | Derived | as_of_date, assets_liquid, assets_property, liabilities, equity |
| **Stock Counterfactual** | ChatGPT if linked | scenario_name, invested_amount, benchmark, date_range |
| **Business Valuation** | QBO + assumptions | entity_id, sde, multiple_low/base/high, enterprise_value_range |

Join keys: `property_id`, `entity_id`, `as_of_date`.

---

## 7. Recommended first safe import

**Google Sheets rent roll → CSV → staging JSON**

Why: no new credentials; unlocks Rent Roll + Properties; proves pipeline before bank feeds.

1. Ben downloads CSV to `foreman/finance/imports/inbox/sheets-rent-roll/`.
2. Ben: `IMPORT APPROVED: sheets-rent-roll`.
3. Maker runs read-only normalizer → `foreman/finance/staging/rent-roll.json` → `validate`.
4. Operator reviews in Foreman — no auto-post to QBO.

**Second:** Citizens mortgage one-row summary CSV (balance, rate, payment) — statement-derived, no passwords.

**Defer:** Live Plaid, QBO API, Mercury API until separate provider gate.

---

## 8. Hard stops

No transfers · no payments · no account changes · no credential export · no secrets in files · no tax filing decisions · no irreversible financial action.

Bank linking requires a new entry in `foreman/HUMAN_GATES.md` before automation.
