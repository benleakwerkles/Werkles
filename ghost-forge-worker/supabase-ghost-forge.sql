-- Ghost Forge Storage Bucket
-- Private read/write. Worker uses SUPABASE_SERVICE_ROLE_KEY server-side.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to browser/client code.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'ghost-forge',
  'ghost-forge',
  false,
  26214400,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Batch tracking table.

create table if not exists public.ghost_forge_batches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  brief text not null,
  model text not null default 'ideogram-ai/ideogram-v3-quality',
  total_prompts int not null default 0,
  estimated_cost_usd numeric not null default 0,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);

-- Output tracking table.

create table if not exists public.ghost_forge_outputs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.ghost_forge_batches(id) on delete cascade,
  prediction_id text unique,
  prompt text not null,
  category text,
  model text,
  aspect_ratio text,
  status text not null default 'pending',
  storage_bucket text not null default 'ghost-forge',
  storage_path text,
  source_url text,
  content_type text,
  byte_size integer,
  error text,
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Spend governor table.

create table if not exists public.ghost_forge_spend (
  date date primary key,
  estimated_amount_usd numeric not null default 0,
  actual_amount_usd numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- Claude/API brain spend table.

create table if not exists public.ghost_forge_claude_spend (
  date date primary key,
  estimated_amount_usd numeric not null default 0,
  actual_amount_usd numeric not null default 0,
  request_count int not null default 0,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists ghost_forge_outputs_batch_id_idx
  on public.ghost_forge_outputs(batch_id);

create index if not exists ghost_forge_outputs_prediction_id_idx
  on public.ghost_forge_outputs(prediction_id);

create index if not exists ghost_forge_outputs_status_idx
  on public.ghost_forge_outputs(status);

-- Cost Governor helpers. These keep daily spend reservation atomic.

create or replace function public.ghost_forge_reserve_spend(
  p_date date,
  p_estimated_amount_usd numeric,
  p_daily_budget_usd numeric
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_estimated numeric;
begin
  insert into public.ghost_forge_spend(date, estimated_amount_usd, actual_amount_usd)
  values (p_date, 0, 0)
  on conflict (date) do nothing;

  select estimated_amount_usd
  into current_estimated
  from public.ghost_forge_spend
  where date = p_date
  for update;

  if current_estimated + p_estimated_amount_usd > p_daily_budget_usd then
    return false;
  end if;

  update public.ghost_forge_spend
  set estimated_amount_usd = estimated_amount_usd + p_estimated_amount_usd,
      updated_at = now()
  where date = p_date;

  return true;
end;
$$;

create or replace function public.ghost_forge_record_actual_spend(
  p_date date,
  p_actual_amount_usd numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ghost_forge_spend(date, estimated_amount_usd, actual_amount_usd)
  values (p_date, 0, p_actual_amount_usd)
  on conflict (date) do update set
    actual_amount_usd = public.ghost_forge_spend.actual_amount_usd + excluded.actual_amount_usd,
    updated_at = now();
end;
$$;

create or replace function public.ghost_forge_reserve_claude_spend(
  p_date date,
  p_estimated_amount_usd numeric,
  p_daily_budget_usd numeric
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_estimated numeric;
begin
  insert into public.ghost_forge_claude_spend(
    date,
    estimated_amount_usd,
    actual_amount_usd,
    request_count,
    input_tokens,
    output_tokens
  )
  values (p_date, 0, 0, 0, 0, 0)
  on conflict (date) do nothing;

  select estimated_amount_usd
  into current_estimated
  from public.ghost_forge_claude_spend
  where date = p_date
  for update;

  if current_estimated + p_estimated_amount_usd > p_daily_budget_usd then
    return false;
  end if;

  update public.ghost_forge_claude_spend
  set estimated_amount_usd = estimated_amount_usd + p_estimated_amount_usd,
      request_count = request_count + 1,
      updated_at = now()
  where date = p_date;

  return true;
end;
$$;

create or replace function public.ghost_forge_record_claude_usage(
  p_date date,
  p_actual_amount_usd numeric,
  p_input_tokens int,
  p_output_tokens int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ghost_forge_claude_spend(
    date,
    estimated_amount_usd,
    actual_amount_usd,
    request_count,
    input_tokens,
    output_tokens
  )
  values (
    p_date,
    0,
    p_actual_amount_usd,
    0,
    greatest(p_input_tokens, 0),
    greatest(p_output_tokens, 0)
  )
  on conflict (date) do update set
    actual_amount_usd = public.ghost_forge_claude_spend.actual_amount_usd + excluded.actual_amount_usd,
    input_tokens = public.ghost_forge_claude_spend.input_tokens + excluded.input_tokens,
    output_tokens = public.ghost_forge_claude_spend.output_tokens + excluded.output_tokens,
    updated_at = now();
end;
$$;

alter table public.ghost_forge_batches enable row level security;
alter table public.ghost_forge_outputs enable row level security;
alter table public.ghost_forge_spend enable row level security;
alter table public.ghost_forge_claude_spend enable row level security;

-- No anon/authenticated write policies.
-- Worker uses service role server-side.
-- Dashboard read policies come later.
