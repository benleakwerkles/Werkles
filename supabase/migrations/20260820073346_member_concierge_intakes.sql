-- Durable, member-owned Concierge Intake custody.
-- Apply only through the SQL/RLS human gate after hostile review.

create table if not exists public.member_concierge_intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_submission_id uuid not null,
  intake_id text not null,
  answers jsonb not null,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint member_concierge_intakes_submission_unique
    unique (user_id, client_submission_id),
  constraint member_concierge_intakes_intake_unique
    unique (user_id, intake_id),
  constraint member_concierge_intakes_answers_object
    check (jsonb_typeof(answers) = 'object'),
  constraint member_concierge_intakes_answers_exact_keys
    check (
      answers ?& array[
        'heaviest_lift', 'business_stage', 'success_twelve_months',
        'time_cost', 'stuck_decision', 'already_tried',
        'resources_on_hand', 'what_you_offer', 'constraints'
      ]
      and answers - array[
        'heaviest_lift', 'business_stage', 'success_twelve_months',
        'time_cost', 'stuck_decision', 'already_tried',
        'resources_on_hand', 'what_you_offer', 'constraints'
      ] = '{}'::jsonb
    ),
  constraint member_concierge_intakes_answers_string_values
    check (
      jsonb_typeof(answers -> 'heaviest_lift') = 'string'
      and jsonb_typeof(answers -> 'business_stage') = 'string'
      and jsonb_typeof(answers -> 'success_twelve_months') = 'string'
      and jsonb_typeof(answers -> 'time_cost') = 'string'
      and jsonb_typeof(answers -> 'stuck_decision') = 'string'
      and jsonb_typeof(answers -> 'already_tried') = 'string'
      and jsonb_typeof(answers -> 'resources_on_hand') = 'string'
      and jsonb_typeof(answers -> 'what_you_offer') = 'string'
      and jsonb_typeof(answers -> 'constraints') = 'string'
    ),
  constraint member_concierge_intakes_answers_bounded
    check (
      length(answers ->> 'heaviest_lift') <= 600
      and length(answers ->> 'business_stage') <= 600
      and length(answers ->> 'success_twelve_months') <= 600
      and length(answers ->> 'time_cost') <= 600
      and length(answers ->> 'stuck_decision') <= 600
      and length(answers ->> 'already_tried') <= 600
      and length(answers ->> 'resources_on_hand') <= 600
      and length(answers ->> 'what_you_offer') <= 600
      and length(answers ->> 'constraints') <= 600
    ),
  constraint member_concierge_intakes_at_least_one_answer
    check (
      length(trim(answers ->> 'heaviest_lift')) > 0
      or length(trim(answers ->> 'business_stage')) > 0
      or length(trim(answers ->> 'success_twelve_months')) > 0
      or length(trim(answers ->> 'time_cost')) > 0
      or length(trim(answers ->> 'stuck_decision')) > 0
      or length(trim(answers ->> 'already_tried')) > 0
      or length(trim(answers ->> 'resources_on_hand')) > 0
      or length(trim(answers ->> 'what_you_offer')) > 0
      or length(trim(answers ->> 'constraints')) > 0
    ),
  constraint member_concierge_intakes_intake_id_not_blank
    check (length(trim(intake_id)) between 1 and 160)
);

create index if not exists member_concierge_intakes_user_latest_idx
  on public.member_concierge_intakes (user_id, captured_at desc, created_at desc);

alter table public.member_concierge_intakes enable row level security;

revoke all on public.member_concierge_intakes from anon;
revoke all on public.member_concierge_intakes from authenticated;
grant select, delete on public.member_concierge_intakes to authenticated;
grant insert (client_submission_id, intake_id, answers)
  on public.member_concierge_intakes to authenticated;

create policy "members select own concierge intakes"
  on public.member_concierge_intakes
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "members insert own concierge intakes"
  on public.member_concierge_intakes
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "members delete own concierge intakes"
  on public.member_concierge_intakes
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

comment on table public.member_concierge_intakes is
  'Append-only member Intake history. Derived packets and provider evidence do not belong here.';
