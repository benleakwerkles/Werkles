-- PLAID_SCHEMA_DRAFT_V0.sql
-- Status: DRAFT — DO NOT APPLY without operator gate APPROVE PLAID PERSISTENCE SCHEMA
-- Doctrine: company/PLAID_PERSISTENT_LIQUIDITY_PROOF_V0.md
-- Compliance: store verification receipts/statuses, not raw sensitive documents.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Plaid Item custody (encrypted access_token at application layer)
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  access_token_ciphertext text not null,
  access_token_key_id text not null default 'v1',
  institution_id text,
  institution_name text,
  products text[] not null default array['assets']::text[],
  env text not null default 'sandbox'
    check (env in ('sandbox', 'production')),
  status text not null default 'active'
    check (status in ('active', 'login_required', 'error', 'revoked')),
  consent_at timestamptz not null default now(),
  last_successful_refresh_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plaid_items_user_item_unique unique (user_id, item_id)
);

comment on table public.plaid_items is
  'Plaid Item custody. access_token stored encrypted server-side only. One row per linked Item per user.';

create index if not exists plaid_items_user_idx on public.plaid_items(user_id);
create index if not exists plaid_items_status_idx on public.plaid_items(status);

alter table public.plaid_items enable row level security;

create policy "Users can view own plaid items"
  on public.plaid_items for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can manage plaid items"
  on public.plaid_items for all
  to authenticated
  using (public.is_admin());

-- Inserts/updates via service role API routes only (no direct client write)

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Liquidity proof receipts (shareable derived facts)
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.liquidity_proof_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plaid_item_id uuid references public.plaid_items(id) on delete set null,
  proof_kind text not null default 'snapshot'
    check (proof_kind in ('snapshot', 'refresh', 'mutual')),
  threshold_cents bigint,
  threshold_met boolean not null,
  liquidity_band text not null
    check (liquidity_band in (
      'under_25k', '25k_50k', '50k_100k', '100k_250k', '250k_plus', 'unknown'
    )),
  currency text not null default 'USD',
  as_of timestamptz not null default now(),
  expires_at timestamptz not null,
  evidence_strength text not null default 'provider_verified'
    check (evidence_strength in ('provider_verified', 'self_reported', 'inferred', 'missing')),
  provider text not null default 'plaid',
  provider_env text not null default 'sandbox'
    check (provider_env in ('sandbox', 'production')),
  provider_request_id text,
  superseded_by uuid references public.liquidity_proof_receipts(id),
  falsifiers jsonb not null default '[]'::jsonb,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

comment on table public.liquidity_proof_receipts is
  'Derived liquidity proof receipts. No raw Plaid asset payloads. Bands + threshold only.';

create index if not exists liquidity_proof_receipts_user_idx on public.liquidity_proof_receipts(user_id);
create index if not exists liquidity_proof_receipts_expires_idx on public.liquidity_proof_receipts(expires_at);

alter table public.liquidity_proof_receipts enable row level security;

create policy "Users can view own liquidity receipts"
  on public.liquidity_proof_receipts for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can manage liquidity receipts"
  on public.liquidity_proof_receipts for all
  to authenticated
  using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Proof sessions (share / mutual exchange)
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.liquidity_proof_sessions (
  id uuid primary key default gen_random_uuid(),
  initiator_user_id uuid not null references auth.users(id) on delete cascade,
  counterparty_user_id uuid not null references auth.users(id) on delete cascade,
  session_kind text not null default 'share'
    check (session_kind in ('share', 'mutual')),
  status text not null default 'requested'
    check (status in (
      'requested', 'accepted', 'both_connected',
      'receipts_ready', 'closed', 'canceled', 'expired'
    )),
  context_kind text
    check (context_kind in ('intro', 'blueprint', 'matching', 'manual')),
  context_id text,
  initiator_receipt_id uuid references public.liquidity_proof_receipts(id),
  counterparty_receipt_id uuid references public.liquidity_proof_receipts(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint liquidity_proof_sessions_distinct_users
    check (initiator_user_id <> counterparty_user_id)
);

create index if not exists liquidity_proof_sessions_initiator_idx
  on public.liquidity_proof_sessions(initiator_user_id);
create index if not exists liquidity_proof_sessions_counterparty_idx
  on public.liquidity_proof_sessions(counterparty_user_id);

alter table public.liquidity_proof_sessions enable row level security;

create policy "Participants can view own proof sessions"
  on public.liquidity_proof_sessions for select
  to authenticated
  using (
    initiator_user_id = auth.uid()
    or counterparty_user_id = auth.uid()
  );

create policy "Admins can manage proof sessions"
  on public.liquidity_proof_sessions for all
  to authenticated
  using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Disclosure audit log
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.liquidity_proof_disclosures (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.liquidity_proof_receipts(id) on delete cascade,
  session_id uuid references public.liquidity_proof_sessions(id) on delete set null,
  disclosed_by_user_id uuid not null references auth.users(id) on delete cascade,
  disclosed_to_user_id uuid not null references auth.users(id) on delete cascade,
  disclosed_at timestamptz not null default now()
);

alter table public.liquidity_proof_disclosures enable row level security;

create policy "Disclosure participants can view"
  on public.liquidity_proof_disclosures for select
  to authenticated
  using (
    disclosed_by_user_id = auth.uid()
    or disclosed_to_user_id = auth.uid()
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. Profile extension (optional — threshold member configures)
-- ═══════════════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists liquidity_threshold_cents bigint,
  add column if not exists plaid_item_status text default 'none'
    check (plaid_item_status in ('none', 'connected', 'login_required', 'revoked'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. Counterparty receipt read via security definer function (planned)
-- ═══════════════════════════════════════════════════════════════════════════════

-- create or replace function public.liquidity_receipt_for_session(...)
-- returns liquidity_proof_receipts for counterparty when session active;
-- implement in application slice after counsel review.
