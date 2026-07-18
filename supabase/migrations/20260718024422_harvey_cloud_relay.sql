-- Private Harvey cloud relay. Browser traffic goes through Werkles server
-- routes; these tables and RPCs are never granted to anon/authenticated.

create table if not exists public.harvey_relay_recipients (
  recipient_id text primary key check (recipient_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  label text not null check (length(btrim(label)) between 1 and 120),
  seat text not null check (length(btrim(seat)) between 1 and 160),
  machine text not null check (machine in ('Doss', 'Betsy', 'Spanzee', 'Medullina', 'Sally')),
  provider text not null check (length(btrim(provider)) between 1 and 80),
  route_kind text not null check (route_kind in ('HARVEY_INBOX', 'CODEX_TASK', 'MACHINE_HANDEYE', 'APP_ADAPTER', 'UNBOUND')),
  route_state text not null check (route_state in ('BOUND_PROVEN', 'REGISTERED_UNPROVEN', 'UNBOUND', 'SUSPENDED')),
  accepts_broadcast boolean not null default true,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.harvey_relay_commands (
  command_id uuid primary key default gen_random_uuid(),
  submission_id text not null unique check (submission_id ~ '^[a-f0-9]{32}$'),
  verb text not null check (verb in ('VERIFY', 'PREPARE', 'GO', 'KNOCK')),
  target text not null check (length(btrim(target)) between 1 and 120),
  instruction text not null check (octet_length(instruction) between 1 and 8192),
  status text not null default 'AWAITING_RECEIVERS' check (status in ('AWAITING_RECEIVERS', 'QUEUED', 'CLAIMED', 'WORKING', 'PARTIAL', 'COMPLETED', 'BLOCKED')),
  created_by text not null check (length(btrim(created_by)) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.harvey_relay_receivers (
  receiver_id text primary key check (receiver_id ~ '^[a-z0-9][a-z0-9:_-]{0,127}$'),
  machine text not null check (machine in ('Doss', 'Betsy', 'Spanzee', 'Medullina', 'Sally')),
  state text not null default 'ACTIVE' check (state in ('ACTIVE', 'SUSPENDED')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.harvey_relay_receiver_routes (
  receiver_id text not null references public.harvey_relay_receivers(receiver_id) on delete cascade,
  recipient_id text not null references public.harvey_relay_recipients(recipient_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (receiver_id, recipient_id)
);

create table if not exists public.harvey_relay_receiver_nonces (
  receiver_id text not null references public.harvey_relay_receivers(receiver_id) on delete cascade,
  nonce text not null check (nonce ~ '^[a-f0-9]{32}$'),
  timestamp_seconds bigint not null,
  consumed_at timestamptz not null default now(),
  primary key (receiver_id, nonce)
);

create table if not exists public.harvey_relay_deliveries (
  delivery_id uuid primary key default gen_random_uuid(),
  command_id uuid not null references public.harvey_relay_commands(command_id) on delete cascade,
  recipient_id text not null references public.harvey_relay_recipients(recipient_id) on delete restrict,
  state text not null check (state in ('AWAITING_RECEIVER', 'QUEUED', 'CLAIMED', 'WORKING', 'REPLIED', 'COMPLETED', 'BLOCKED')),
  receiver_id text,
  claim_token uuid,
  lease_expires_at timestamptz,
  claim_count integer not null default 0 check (claim_count >= 0),
  claimed_at timestamptz,
  completed_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint harvey_relay_deliveries_command_recipient_key unique (command_id, recipient_id),
  check (receiver_id is null or receiver_id ~ '^[a-z0-9][a-z0-9:_-]{0,127}$')
);

create table if not exists public.harvey_relay_receipts (
  sequence bigint generated always as identity unique,
  receipt_id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.harvey_relay_deliveries(delivery_id) on delete cascade,
  receiver_id text not null check (receiver_id ~ '^[a-z0-9][a-z0-9:_-]{0,127}$'),
  state text not null check (state in ('CLAIMED', 'WORKING', 'REPLIED', 'COMPLETED', 'BLOCKED')),
  detail text not null check (octet_length(detail) between 1 and 4096),
  reply text check (reply is null or octet_length(reply) <= 16384),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  recorded_at timestamptz not null default now()
);

create index if not exists harvey_relay_commands_created_idx
  on public.harvey_relay_commands (created_at desc);
create index if not exists harvey_relay_deliveries_recipient_state_idx
  on public.harvey_relay_deliveries (recipient_id, state, created_at);
create index if not exists harvey_relay_deliveries_claim_idx
  on public.harvey_relay_deliveries (state, lease_expires_at, created_at);
create index if not exists harvey_relay_receipts_delivery_sequence_idx
  on public.harvey_relay_receipts (delivery_id, sequence);
create index if not exists harvey_relay_receiver_routes_recipient_idx
  on public.harvey_relay_receiver_routes (recipient_id, receiver_id);
create index if not exists harvey_relay_receiver_nonces_consumed_idx
  on public.harvey_relay_receiver_nonces (consumed_at);

insert into public.harvey_relay_recipients (
  recipient_id, label, seat, machine, provider, route_kind, route_state, accepts_broadcast, metadata
)
values (
  'shakespeare-doss', 'Shakespeare', 'Shakespeare@Doss', 'Doss', 'Codex', 'CODEX_TASK', 'BOUND_PROVEN', true,
  '{"thread_id":"019f719e-1b67-77c0-a9be-6ca901377747","receiver_truth":"SIGNED_DOSS_COURIER_REQUIRED"}'::jsonb
)
on conflict (recipient_id) do nothing;

insert into public.harvey_relay_receivers (receiver_id, machine, state, metadata)
values (
  'handeye-doss-doss', 'Doss', 'ACTIVE',
  '{"adapter":"HARVEY_DOSS_CODEX_TASK_COURIER_V1","recipient_scope":["shakespeare-doss"]}'::jsonb
)
on conflict (receiver_id) do nothing;

insert into public.harvey_relay_receiver_routes (receiver_id, recipient_id)
values ('handeye-doss-doss', 'shakespeare-doss')
on conflict (receiver_id, recipient_id) do nothing;

alter table public.harvey_relay_recipients enable row level security;
alter table public.harvey_relay_receivers enable row level security;
alter table public.harvey_relay_receiver_routes enable row level security;
alter table public.harvey_relay_receiver_nonces enable row level security;
alter table public.harvey_relay_commands enable row level security;
alter table public.harvey_relay_deliveries enable row level security;
alter table public.harvey_relay_receipts enable row level security;

revoke all on public.harvey_relay_recipients from public, anon, authenticated;
revoke all on public.harvey_relay_receivers from public, anon, authenticated;
revoke all on public.harvey_relay_receiver_routes from public, anon, authenticated;
revoke all on public.harvey_relay_receiver_nonces from public, anon, authenticated;
revoke all on public.harvey_relay_commands from public, anon, authenticated;
revoke all on public.harvey_relay_deliveries from public, anon, authenticated;
revoke all on public.harvey_relay_receipts from public, anon, authenticated;
revoke all on public.harvey_relay_recipients from service_role;
revoke all on public.harvey_relay_receivers from service_role;
revoke all on public.harvey_relay_receiver_routes from service_role;
revoke all on public.harvey_relay_receiver_nonces from service_role;
revoke all on public.harvey_relay_commands from service_role;
revoke all on public.harvey_relay_deliveries from service_role;
revoke all on public.harvey_relay_receipts from service_role;
grant select, insert, update on public.harvey_relay_recipients to service_role;
grant select on public.harvey_relay_receivers to service_role;
grant select on public.harvey_relay_receiver_routes to service_role;
grant select on public.harvey_relay_commands to service_role;
grant select on public.harvey_relay_deliveries to service_role;
grant select on public.harvey_relay_receipts to service_role;

create or replace function public.harvey_enqueue_command(
  p_submission_id text,
  p_verb text,
  p_target text,
  p_instruction text,
  p_created_by text,
  p_recipient_ids text[]
)
returns table (
  command_id uuid,
  command_status text,
  recipient_count integer,
  queued_count integer,
  awaiting_receiver_count integer
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_command public.harvey_relay_commands%rowtype;
  v_missing integer;
  v_recipient_count integer;
  v_queued_count integer;
  v_awaiting_count integer;
  v_inserted_count integer;
  v_requested_recipient_ids text[];
  v_existing_recipient_ids text[];
begin
  if p_submission_id !~ '^[a-f0-9]{32}$' then raise exception 'HARVEY_SUBMISSION_ID_INVALID'; end if;
  if p_verb not in ('VERIFY', 'PREPARE', 'GO', 'KNOCK') then raise exception 'HARVEY_VERB_INVALID'; end if;
  if length(btrim(p_target)) not between 1 and 120 then raise exception 'HARVEY_TARGET_INVALID'; end if;
  if octet_length(p_instruction) not between 1 and 8192 then raise exception 'HARVEY_INSTRUCTION_INVALID'; end if;
  if length(btrim(p_created_by)) not between 1 and 160 then raise exception 'HARVEY_CREATED_BY_INVALID'; end if;
  if coalesce(cardinality(p_recipient_ids), 0) < 1 or cardinality(p_recipient_ids) > 100 then raise exception 'HARVEY_RECIPIENT_SET_INVALID'; end if;

  select array_agg(distinct requested.recipient_id order by requested.recipient_id)
    into v_requested_recipient_ids
  from unnest(p_recipient_ids) requested(recipient_id);

  select count(*) into v_missing
  from (select distinct unnest(p_recipient_ids) as recipient_id) requested
  left join public.harvey_relay_recipients recipient using (recipient_id)
  where recipient.recipient_id is null;
  if v_missing > 0 then raise exception 'HARVEY_RECIPIENT_UNKNOWN'; end if;

  -- Serialize each operator's enqueue decisions so concurrent requests cannot
  -- bypass the bounded cloud-command creation rate.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('harvey-relay:' || p_created_by, 0));
  if not exists (
    select 1 from public.harvey_relay_commands command_row where command_row.submission_id = p_submission_id
  ) and (
    select count(*) from public.harvey_relay_commands command_row
    where command_row.created_by = p_created_by
      and command_row.created_at >= now() - interval '1 hour'
  ) >= 120 then
    raise exception 'HARVEY_COMMAND_RATE_LIMIT';
  end if;

  insert into public.harvey_relay_commands (submission_id, verb, target, instruction, created_by)
  values (p_submission_id, p_verb, btrim(p_target), btrim(p_instruction), p_created_by)
  on conflict (submission_id) do nothing;
  get diagnostics v_inserted_count = row_count;

  select * into strict v_command
  from public.harvey_relay_commands command_row
  where command_row.submission_id = p_submission_id
  for update;

  if v_command.verb <> p_verb or v_command.target <> btrim(p_target) or v_command.instruction <> btrim(p_instruction) or v_command.created_by <> p_created_by then
    raise exception 'HARVEY_SUBMISSION_CONFLICT';
  end if;

  if v_inserted_count = 0 then
    select array_agg(delivery.recipient_id order by delivery.recipient_id)
      into v_existing_recipient_ids
    from public.harvey_relay_deliveries delivery
    where delivery.command_id = v_command.command_id;
    if v_existing_recipient_ids is distinct from v_requested_recipient_ids then
      raise exception 'HARVEY_SUBMISSION_CONFLICT';
    end if;
  end if;

  insert into public.harvey_relay_deliveries (command_id, recipient_id, state)
  select v_command.command_id,
         recipient.recipient_id,
         case when recipient.route_state = 'BOUND_PROVEN' then 'QUEUED' else 'AWAITING_RECEIVER' end
  from public.harvey_relay_recipients recipient
  join (select distinct unnest(p_recipient_ids) as recipient_id) requested using (recipient_id)
  on conflict on constraint harvey_relay_deliveries_command_recipient_key do nothing;

  select count(*)::integer,
         count(*) filter (where delivery.state = 'QUEUED')::integer,
         count(*) filter (where delivery.state = 'AWAITING_RECEIVER')::integer
    into v_recipient_count, v_queued_count, v_awaiting_count
  from public.harvey_relay_deliveries delivery
  where delivery.command_id = v_command.command_id;

  update public.harvey_relay_commands
  set status = case when v_queued_count > 0 then 'QUEUED' else 'AWAITING_RECEIVERS' end,
      updated_at = now()
  where public.harvey_relay_commands.command_id = v_command.command_id
  returning status into v_command.status;

  return query select v_command.command_id, v_command.status, v_recipient_count, v_queued_count, v_awaiting_count;
end;
$$;

create or replace function public.harvey_consume_receiver_nonce(
  p_receiver_id text,
  p_machine text,
  p_nonce text,
  p_timestamp_seconds bigint
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_nonce !~ '^[a-f0-9]{32}$' then raise exception 'HARVEY_RECEIVER_NONCE_INVALID'; end if;
  if abs(extract(epoch from now())::bigint - p_timestamp_seconds) > 90 then raise exception 'HARVEY_RECEIVER_TIMESTAMP_EXPIRED'; end if;
  if not exists (
    select 1 from public.harvey_relay_receivers receiver
    where receiver.receiver_id = p_receiver_id
      and receiver.machine = p_machine
      and receiver.state = 'ACTIVE'
  ) then raise exception 'HARVEY_RECEIVER_MACHINE_BINDING_INVALID'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('harvey-receiver-nonce:' || p_receiver_id, 0));

  delete from public.harvey_relay_receiver_nonces nonce_row
  where nonce_row.consumed_at < now() - interval '4 minutes';

  if (
    select count(*) from public.harvey_relay_receiver_nonces nonce_row
    where nonce_row.receiver_id = p_receiver_id
  ) >= 256 then raise exception 'HARVEY_RECEIVER_NONCE_CAPACITY_EXCEEDED'; end if;

  begin
    insert into public.harvey_relay_receiver_nonces (receiver_id, nonce, timestamp_seconds)
    values (p_receiver_id, p_nonce, p_timestamp_seconds);
  exception when unique_violation then
    raise exception 'HARVEY_RECEIVER_NONCE_REPLAYED';
  end;
end;
$$;

create or replace function public.harvey_claim_deliveries(
  p_machine text,
  p_receiver_id text,
  p_limit integer default 8,
  p_lease_seconds integer default 120
)
returns table (
  delivery_id uuid,
  claim_token uuid,
  command_id uuid,
  recipient_id text,
  verb text,
  target text,
  instruction text,
  created_at timestamptz,
  lease_expires_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_machine not in ('Doss', 'Betsy', 'Spanzee', 'Medullina', 'Sally') then raise exception 'HARVEY_MACHINE_INVALID'; end if;
  if p_receiver_id !~ '^[a-z0-9][a-z0-9:_-]{0,127}$' then raise exception 'HARVEY_RECEIVER_ID_INVALID'; end if;
  if p_limit not between 1 and 25 or p_lease_seconds not between 30 and 900 then raise exception 'HARVEY_CLAIM_LIMIT_INVALID'; end if;
  if not exists (
    select 1
    from public.harvey_relay_receivers receiver
    where receiver.receiver_id = p_receiver_id
      and receiver.machine = p_machine
      and receiver.state = 'ACTIVE'
  ) then raise exception 'HARVEY_RECEIVER_MACHINE_BINDING_INVALID'; end if;

  return query
  with candidates as (
    select delivery.delivery_id
    from public.harvey_relay_deliveries delivery
    join public.harvey_relay_recipients recipient using (recipient_id)
    join public.harvey_relay_receiver_routes receiver_route
      on receiver_route.recipient_id = recipient.recipient_id
     and receiver_route.receiver_id = p_receiver_id
    where recipient.machine = p_machine
      and (
        delivery.state = 'QUEUED'
        or (delivery.state in ('CLAIMED', 'WORKING', 'REPLIED') and delivery.lease_expires_at < now())
      )
    order by delivery.created_at, delivery.delivery_id
    for update of delivery skip locked
    limit p_limit
  ), claimed as (
    update public.harvey_relay_deliveries delivery
    set state = 'CLAIMED',
        receiver_id = p_receiver_id,
        claim_token = gen_random_uuid(),
        lease_expires_at = now() + make_interval(secs => p_lease_seconds),
        claim_count = delivery.claim_count + 1,
        claimed_at = coalesce(delivery.claimed_at, now()),
        updated_at = now()
    from candidates
    where delivery.delivery_id = candidates.delivery_id
    returning delivery.*
  ), claim_receipts as (
    insert into public.harvey_relay_receipts as receipt (delivery_id, receiver_id, state, detail)
    select claimed.delivery_id, p_receiver_id, 'CLAIMED', 'Receiver claimed the Harvey inbox delivery.'
    from claimed
    returning receipt.delivery_id
  ), command_updates as (
    update public.harvey_relay_commands command_row
    set status = 'CLAIMED', updated_at = now()
    from (select distinct claimed.command_id from claimed) touched
    where command_row.command_id = touched.command_id
      and command_row.status in ('AWAITING_RECEIVERS', 'QUEUED')
    returning command_row.command_id
  )
  select claimed.delivery_id,
         claimed.claim_token,
         claimed.command_id,
         claimed.recipient_id,
         command_row.verb,
         command_row.target,
         command_row.instruction,
         command_row.created_at,
         claimed.lease_expires_at
  from claimed
  join claim_receipts on claim_receipts.delivery_id = claimed.delivery_id
  join public.harvey_relay_commands command_row on command_row.command_id = claimed.command_id;
end;
$$;

create or replace function public.harvey_record_delivery_receipt(
  p_delivery_id uuid,
  p_receiver_id text,
  p_claim_token uuid,
  p_state text,
  p_detail text,
  p_reply text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_delivery public.harvey_relay_deliveries%rowtype;
  v_receipt public.harvey_relay_receipts%rowtype;
  v_command_status text;
begin
  if p_receiver_id !~ '^[a-z0-9][a-z0-9:_-]{0,127}$' then raise exception 'HARVEY_RECEIVER_ID_INVALID'; end if;
  if p_state not in ('WORKING', 'REPLIED', 'COMPLETED', 'BLOCKED') then raise exception 'HARVEY_RECEIPT_STATE_INVALID'; end if;
  if octet_length(p_detail) not between 1 and 4096 or (p_reply is not null and octet_length(p_reply) > 16384) then raise exception 'HARVEY_RECEIPT_BODY_INVALID'; end if;
  if jsonb_typeof(p_metadata) <> 'object' then raise exception 'HARVEY_RECEIPT_METADATA_INVALID'; end if;

  select * into v_delivery
  from public.harvey_relay_deliveries delivery
  where delivery.delivery_id = p_delivery_id
  for update;
  if not found then raise exception 'HARVEY_DELIVERY_NOT_FOUND'; end if;
  if not exists (
    select 1
    from public.harvey_relay_receivers receiver
    join public.harvey_relay_receiver_routes receiver_route using (receiver_id)
    where receiver.receiver_id = p_receiver_id
      and receiver.state = 'ACTIVE'
      and receiver_route.recipient_id = v_delivery.recipient_id
  ) then raise exception 'HARVEY_RECEIVER_ROUTE_BINDING_INVALID'; end if;
  if v_delivery.receiver_id is distinct from p_receiver_id then raise exception 'HARVEY_DELIVERY_RECEIVER_MISMATCH'; end if;
  if v_delivery.claim_token is distinct from p_claim_token then raise exception 'HARVEY_DELIVERY_CLAIM_TOKEN_MISMATCH'; end if;
  if v_delivery.lease_expires_at is null or v_delivery.lease_expires_at <= now() then raise exception 'HARVEY_DELIVERY_LEASE_EXPIRED'; end if;
  if v_delivery.state in ('COMPLETED', 'BLOCKED') then raise exception 'HARVEY_DELIVERY_ALREADY_TERMINAL'; end if;
  if v_delivery.state = 'CLAIMED' and p_state not in ('WORKING', 'COMPLETED', 'BLOCKED') then raise exception 'HARVEY_RECEIPT_TRANSITION_INVALID'; end if;
  if v_delivery.state = 'WORKING' and p_state not in ('REPLIED', 'COMPLETED', 'BLOCKED') then raise exception 'HARVEY_RECEIPT_TRANSITION_INVALID'; end if;
  if v_delivery.state = 'REPLIED' and p_state not in ('COMPLETED', 'BLOCKED') then raise exception 'HARVEY_RECEIPT_TRANSITION_INVALID'; end if;

  insert into public.harvey_relay_receipts (delivery_id, receiver_id, state, detail, reply, metadata)
  values (p_delivery_id, p_receiver_id, p_state, btrim(p_detail), p_reply, p_metadata)
  returning * into v_receipt;

  update public.harvey_relay_deliveries
  set state = p_state,
      lease_expires_at = case when p_state in ('COMPLETED', 'BLOCKED') then lease_expires_at else now() + interval '15 minutes' end,
      completed_at = case when p_state in ('COMPLETED', 'BLOCKED') then now() else completed_at end,
      error_code = case when p_state = 'BLOCKED' then coalesce(p_metadata->>'error_code', 'RECEIVER_BLOCKED') else null end,
      updated_at = now()
  where public.harvey_relay_deliveries.delivery_id = p_delivery_id;

  select case
    when bool_and(delivery.state = 'COMPLETED') then 'COMPLETED'
    when bool_or(delivery.state = 'BLOCKED') and bool_or(delivery.state <> 'BLOCKED') then 'PARTIAL'
    when bool_and(delivery.state = 'BLOCKED') then 'BLOCKED'
    when bool_or(delivery.state in ('COMPLETED', 'BLOCKED'))
      and bool_or(delivery.state not in ('COMPLETED', 'BLOCKED')) then 'PARTIAL'
    when bool_or(delivery.state in ('WORKING', 'REPLIED')) then 'WORKING'
    when bool_or(delivery.state = 'CLAIMED') then 'CLAIMED'
    when bool_or(delivery.state = 'QUEUED') then 'QUEUED'
    else 'AWAITING_RECEIVERS'
  end into v_command_status
  from public.harvey_relay_deliveries delivery
  where delivery.command_id = v_delivery.command_id;

  update public.harvey_relay_commands
  set status = v_command_status, updated_at = now()
  where public.harvey_relay_commands.command_id = v_delivery.command_id;

  return jsonb_build_object(
    'receipt_id', v_receipt.receipt_id,
    'sequence', v_receipt.sequence,
    'delivery_id', p_delivery_id,
    'delivery_state', p_state,
    'command_id', v_delivery.command_id,
    'command_status', v_command_status,
    'recorded_at', v_receipt.recorded_at
  );
end;
$$;

revoke all on function public.harvey_enqueue_command(text, text, text, text, text, text[]) from public, anon, authenticated;
revoke all on function public.harvey_consume_receiver_nonce(text, text, text, bigint) from public, anon, authenticated;
revoke all on function public.harvey_claim_deliveries(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.harvey_record_delivery_receipt(uuid, text, uuid, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.harvey_enqueue_command(text, text, text, text, text, text[]) to service_role;
grant execute on function public.harvey_consume_receiver_nonce(text, text, text, bigint) to service_role;
grant execute on function public.harvey_claim_deliveries(text, text, integer, integer) to service_role;
grant execute on function public.harvey_record_delivery_receipt(uuid, text, uuid, text, text, text, jsonb) to service_role;

comment on table public.harvey_relay_commands is 'Private Harvey operator commands. No secrets or credential material allowed.';
comment on table public.harvey_relay_deliveries is 'Per-recipient delivery truth; QUEUED is not RECEIVED and CLAIMED is not COMPLETED.';
comment on table public.harvey_relay_receipts is 'Append-only receiver evidence for Harvey command delivery state.';
comment on table public.harvey_relay_receivers is 'Receiver identities bound to one canonical machine; service_role cannot register or mutate them.';
comment on table public.harvey_relay_receiver_routes is 'Database-enforced receiver-to-Aeye inbox allowlist.';
comment on table public.harvey_relay_receiver_nonces is 'Short-lived replay protection for signed cloud receiver requests.';
comment on function public.harvey_claim_deliveries(text, text, integer, integer) is 'Receiver claim contract callable only behind the signed, machine-bound Harvey adapter.';
comment on function public.harvey_record_delivery_receipt(uuid, text, uuid, text, text, text, jsonb) is 'Claim-token-bound receipt contract callable only behind the signed Harvey adapter.';
