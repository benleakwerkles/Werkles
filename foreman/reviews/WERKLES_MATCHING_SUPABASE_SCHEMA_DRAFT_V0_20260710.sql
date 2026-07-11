-- REVIEW ONLY — DO NOT APPLY
-- Proposed durable custody for discovery intakes and matching shadow runs.
-- Requires a separate Ben-approved SQL/RLS gate before migration promotion.

create table if not exists public.discovery_intakes (
  intake_id text primary key,
  source text not null check (source in ('discovery', 'bellows_concierge')),
  state text not null default 'Received',
  normalized_payload jsonb not null,
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discovery_intakes_received_at_idx
  on public.discovery_intakes (received_at desc);

create table if not exists public.matching_shadow_runs (
  run_id text primary key,
  intake_id text not null,
  source text not null check (source in ('discovery', 'bellows_concierge')),
  mode text not null check (mode = 'shadow'),
  engine_version text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint matching_shadow_runs_intake_fk
    foreign key (intake_id) references public.discovery_intakes (intake_id)
    on update cascade on delete restrict
);

create index if not exists matching_shadow_runs_created_at_idx
  on public.matching_shadow_runs (created_at desc);

create index if not exists matching_shadow_runs_intake_id_idx
  on public.matching_shadow_runs (intake_id, created_at desc);

alter table public.discovery_intakes enable row level security;
alter table public.matching_shadow_runs enable row level security;

-- Service-role requests bypass RLS and perform server-side intake/run writes.
-- Authenticated operator reads depend on the existing public.admin_users table.

create policy "operators read discovery intakes"
  on public.discovery_intakes for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_users admin
      where admin.user_id = auth.uid()
    )
  );

create policy "operators read matching shadow runs"
  on public.matching_shadow_runs for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_users admin
      where admin.user_id = auth.uid()
    )
  );

comment on table public.discovery_intakes is
  'DRAFT: durable normalized discovery/concierge intake custody. Retention policy requires Operator approval.';

comment on table public.matching_shadow_runs is
  'DRAFT: append-only matching shadow payloads. Public matching remains disabled.';

-- Open review questions before apply:
-- 1. Retention duration and deletion/export rights for personal intake payloads.
-- 2. Whether intake payload fields require column-level separation or encryption.
-- 3. Whether operator reads should use admin_users or a narrower matching-review role.
-- 4. Whether repeated run_id upserts should be rejected instead of idempotently accepted.
-- 5. Whether discovery intake writes require a separate audit/event table.
