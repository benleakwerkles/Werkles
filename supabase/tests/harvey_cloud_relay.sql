-- Behavioral regression for the private Harvey relay. Run only after the
-- migration is loaded. Every mutation is rolled back.
begin;

insert into public.harvey_relay_recipients
  (recipient_id, label, seat, machine, provider, route_kind, route_state)
values
  ('relay-test-a', 'Relay Test A', 'Test A@Doss', 'Doss', 'Test', 'HARVEY_INBOX', 'BOUND_PROVEN'),
  ('relay-test-b', 'Relay Test B', 'Test B@Doss', 'Doss', 'Test', 'HARVEY_INBOX', 'BOUND_PROVEN'),
  ('relay-test-wait', 'Relay Test Wait', 'Test Wait@Doss', 'Doss', 'Test', 'HARVEY_INBOX', 'UNBOUND'),
  ('relay-test-betsy', 'Relay Test Betsy', 'Test@Betsy', 'Betsy', 'Test', 'HARVEY_INBOX', 'BOUND_PROVEN');

insert into public.harvey_relay_receivers (receiver_id, machine)
values
  ('doss:test-a', 'Doss'),
  ('doss:test-b', 'Doss'),
  ('betsy:test', 'Betsy');

insert into public.harvey_relay_receiver_routes (receiver_id, recipient_id)
values
  ('doss:test-a', 'relay-test-a'),
  ('doss:test-b', 'relay-test-b'),
  ('betsy:test', 'relay-test-betsy');

do $test$
declare
  v_first record;
  v_second record;
begin
  select * into v_first from public.harvey_enqueue_command(
    'f0000000000000000000000000000001', 'GO', 'All Aeyes',
    'Relay behavioral test one.', 'test-operator', array['relay-test-a', 'relay-test-b']
  );
  if v_first.recipient_count <> 2 or v_first.queued_count <> 2 or v_first.command_status <> 'QUEUED' then
    raise exception 'HARVEY_TEST_ENQUEUE_COUNTS_FAILED';
  end if;

  select * into v_second from public.harvey_enqueue_command(
    'f0000000000000000000000000000001', 'GO', 'All Aeyes',
    'Relay behavioral test one.', 'test-operator', array['relay-test-b', 'relay-test-a']
  );
  if v_second.command_id <> v_first.command_id then raise exception 'HARVEY_TEST_IDEMPOTENCY_FAILED'; end if;

  begin
    perform * from public.harvey_enqueue_command(
      'f0000000000000000000000000000001', 'GO', 'All Aeyes',
      'Relay behavioral test one.', 'test-operator', array['relay-test-a']
    );
    raise exception 'HARVEY_TEST_RECIPIENT_CONFLICT_NOT_REJECTED';
  exception when others then
    if sqlerrm <> 'HARVEY_SUBMISSION_CONFLICT' then raise; end if;
  end;

  begin
    perform * from public.harvey_claim_deliveries('Betsy', 'doss:test-a', 1, 120);
    raise exception 'HARVEY_TEST_MACHINE_IMPERSONATION_NOT_REJECTED';
  exception when others then
    if sqlerrm <> 'HARVEY_RECEIVER_MACHINE_BINDING_INVALID' then raise; end if;
  end;

  begin
    perform * from public.harvey_claim_deliveries('Doss', 'doss:unknown', 1, 120);
    raise exception 'HARVEY_TEST_UNKNOWN_RECEIVER_NOT_REJECTED';
  exception when others then
    if sqlerrm <> 'HARVEY_RECEIVER_MACHINE_BINDING_INVALID' then raise; end if;
  end;
end
$test$;

create temporary table harvey_claim_a on commit drop as
select * from public.harvey_claim_deliveries('Doss', 'doss:test-a', 1, 120);

do $test$
declare
  v_delivery uuid;
  v_command uuid;
  v_claim_token uuid;
  v_status text;
begin
  if (select count(*) from harvey_claim_a) <> 1 then raise exception 'HARVEY_TEST_BOUND_CLAIM_COUNT_FAILED'; end if;
  if (select recipient_id from harvey_claim_a) <> 'relay-test-a' then raise exception 'HARVEY_TEST_CROSS_RECIPIENT_CLAIM_FAILED'; end if;
  if (select count(*) from public.harvey_claim_deliveries('Doss', 'doss:test-a', 1, 120)) <> 0 then raise exception 'HARVEY_TEST_ACTIVE_LEASE_RECLAIMED'; end if;
  select delivery_id, command_id, claim_token into v_delivery, v_command, v_claim_token from harvey_claim_a;

  begin
    perform public.harvey_record_delivery_receipt(v_delivery, 'doss:test-a', v_claim_token, 'REPLIED', 'Invalid direct reply.', null, '{}'::jsonb);
    raise exception 'HARVEY_TEST_INVALID_TRANSITION_NOT_REJECTED';
  exception when others then
    if sqlerrm <> 'HARVEY_RECEIPT_TRANSITION_INVALID' then raise; end if;
  end;

  begin
    perform public.harvey_record_delivery_receipt(v_delivery, 'doss:test-a', gen_random_uuid(), 'WORKING', 'Wrong claim token.', null, '{}'::jsonb);
    raise exception 'HARVEY_TEST_CLAIM_TOKEN_NOT_REJECTED';
  exception when others then
    if sqlerrm <> 'HARVEY_DELIVERY_CLAIM_TOKEN_MISMATCH' then raise; end if;
  end;

  perform public.harvey_record_delivery_receipt(v_delivery, 'doss:test-a', v_claim_token, 'WORKING', 'Receiver is working.', null, '{}'::jsonb);
  perform public.harvey_record_delivery_receipt(v_delivery, 'doss:test-a', v_claim_token, 'COMPLETED', 'Receiver completed.', null, '{}'::jsonb);
  select status into v_status from public.harvey_relay_commands where command_id = v_command;
  if v_status <> 'PARTIAL' then raise exception 'HARVEY_TEST_COMPLETED_PLUS_QUEUED_STATUS_FAILED:%', v_status; end if;
end
$test$;

create temporary table harvey_claim_b on commit drop as
select * from public.harvey_claim_deliveries('Doss', 'doss:test-b', 1, 120);

do $test$
declare
  v_delivery uuid;
  v_command uuid;
  v_claim_token uuid;
  v_status text;
begin
  select delivery_id, command_id, claim_token into v_delivery, v_command, v_claim_token from harvey_claim_b;
  perform public.harvey_record_delivery_receipt(
    v_delivery, 'doss:test-b', v_claim_token, 'BLOCKED', 'Receiver blocked.', 'Needs a route.', '{"error_code":"TEST_BLOCKER"}'::jsonb
  );
  select status into v_status from public.harvey_relay_commands where command_id = v_command;
  if v_status <> 'PARTIAL' then raise exception 'HARVEY_TEST_COMPLETED_PLUS_BLOCKED_STATUS_FAILED:%', v_status; end if;
end
$test$;

do $test$
begin
  perform * from public.harvey_enqueue_command(
    'f0000000000000000000000000000004', 'PREPARE', 'relay-test-a',
    'Relay replied reclaim test.', 'test-operator', array['relay-test-a']
  );
end
$test$;

create temporary table harvey_claim_replied_first on commit drop as
select * from public.harvey_claim_deliveries('Doss', 'doss:test-a', 1, 120);

do $test$
declare
  v_delivery uuid;
  v_claim_token uuid;
begin
  select delivery_id, claim_token into v_delivery, v_claim_token from harvey_claim_replied_first;
  perform public.harvey_record_delivery_receipt(v_delivery, 'doss:test-a', v_claim_token, 'WORKING', 'Receiver is working.', null, '{}'::jsonb);
  perform public.harvey_record_delivery_receipt(v_delivery, 'doss:test-a', v_claim_token, 'REPLIED', 'Receiver replied.', 'A tested reply.', '{}'::jsonb);
end
$test$;

update public.harvey_relay_deliveries delivery
set lease_expires_at = now() - interval '1 second'
from harvey_claim_replied_first claimed
where delivery.delivery_id = claimed.delivery_id;

create temporary table harvey_claim_replied_reclaimed on commit drop as
select * from public.harvey_claim_deliveries('Doss', 'doss:test-a', 1, 120);

do $test$
declare
  v_delivery uuid;
  v_old_claim_token uuid;
  v_new_claim_token uuid;
begin
  if (select count(*) from harvey_claim_replied_reclaimed) <> 1 then raise exception 'HARVEY_TEST_EXPIRED_REPLIED_NOT_RECLAIMED'; end if;
  select delivery_id, claim_token into v_delivery, v_old_claim_token from harvey_claim_replied_first;
  select claim_token into v_new_claim_token from harvey_claim_replied_reclaimed;
  if v_old_claim_token = v_new_claim_token then raise exception 'HARVEY_TEST_REPLIED_RECLAIM_TOKEN_NOT_ROTATED'; end if;
  begin
    perform public.harvey_record_delivery_receipt(v_delivery, 'doss:test-a', v_old_claim_token, 'WORKING', 'Stale worker.', null, '{}'::jsonb);
    raise exception 'HARVEY_TEST_STALE_REPLIED_TOKEN_NOT_REJECTED';
  exception when others then
    if sqlerrm <> 'HARVEY_DELIVERY_CLAIM_TOKEN_MISMATCH' then raise; end if;
  end;
  perform public.harvey_record_delivery_receipt(v_delivery, 'doss:test-a', v_new_claim_token, 'WORKING', 'Reclaimed receiver working.', null, '{}'::jsonb);
  perform public.harvey_record_delivery_receipt(v_delivery, 'doss:test-a', v_new_claim_token, 'REPLIED', 'Reclaimed receiver replied.', 'Recovered reply.', '{}'::jsonb);
  perform public.harvey_record_delivery_receipt(v_delivery, 'doss:test-a', v_new_claim_token, 'COMPLETED', 'Reclaimed receiver completed.', null, '{}'::jsonb);
end
$test$;

do $test$
declare
  v_command record;
begin
  select * into v_command from public.harvey_enqueue_command(
    'f0000000000000000000000000000002', 'VERIFY', 'All Aeyes',
    'Relay awaiting-receiver test.', 'test-operator', array['relay-test-a', 'relay-test-wait']
  );
  if v_command.queued_count <> 1 or v_command.awaiting_receiver_count <> 1 then raise exception 'HARVEY_TEST_AWAITING_COUNTS_FAILED'; end if;
end
$test$;

do $test$
declare
  v_now bigint := extract(epoch from now())::bigint;
  v_index integer;
begin
  for v_index in 1..256 loop
    perform public.harvey_consume_receiver_nonce('doss:test-b', 'Doss', lpad(to_hex(v_index), 32, '0'), v_now);
  end loop;
  begin
    perform public.harvey_consume_receiver_nonce('doss:test-b', 'Doss', lpad(to_hex(257), 32, '0'), v_now);
    raise exception 'HARVEY_TEST_NONCE_CAP_NOT_ENFORCED';
  exception when others then
    if sqlerrm <> 'HARVEY_RECEIVER_NONCE_CAPACITY_EXCEEDED' then raise; end if;
  end;
end
$test$;

create temporary table harvey_claim_wait_mix on commit drop as
select * from public.harvey_claim_deliveries('Doss', 'doss:test-a', 1, 120);

do $test$
declare
  v_delivery uuid;
  v_command uuid;
  v_claim_token uuid;
  v_status text;
begin
  select delivery_id, command_id, claim_token into v_delivery, v_command, v_claim_token from harvey_claim_wait_mix;
  perform public.harvey_record_delivery_receipt(v_delivery, 'doss:test-a', v_claim_token, 'COMPLETED', 'Receiver completed.', null, '{}'::jsonb);
  select status into v_status from public.harvey_relay_commands where command_id = v_command;
  if v_status <> 'PARTIAL' then raise exception 'HARVEY_TEST_COMPLETED_PLUS_AWAITING_STATUS_FAILED:%', v_status; end if;
end
$test$;

do $test$
begin
  perform * from public.harvey_enqueue_command(
    'f0000000000000000000000000000003', 'KNOCK', 'relay-test-a',
    'Relay expired lease test.', 'test-operator', array['relay-test-a']
  );
end
$test$;

create temporary table harvey_claim_expiring on commit drop as
select * from public.harvey_claim_deliveries('Doss', 'doss:test-a', 1, 120);

update public.harvey_relay_deliveries delivery
set lease_expires_at = now() - interval '1 second'
from harvey_claim_expiring claimed
where delivery.delivery_id = claimed.delivery_id;

create temporary table harvey_claim_reclaimed on commit drop as
select * from public.harvey_claim_deliveries('Doss', 'doss:test-a', 1, 120);

do $test$
declare
  v_delivery uuid;
  v_first_claim_token uuid;
  v_second_claim_token uuid;
  v_claim_count integer;
  v_receipt_count integer;
begin
  if (select count(*) from harvey_claim_reclaimed) <> 1 then raise exception 'HARVEY_TEST_EXPIRED_LEASE_NOT_RECLAIMED'; end if;
  select delivery_id, claim_token into v_delivery, v_second_claim_token from harvey_claim_reclaimed;
  select claim_token into v_first_claim_token from harvey_claim_expiring;
  if v_first_claim_token = v_second_claim_token then raise exception 'HARVEY_TEST_RECLAIM_CLAIM_TOKEN_NOT_ROTATED'; end if;
  select claim_count into v_claim_count from public.harvey_relay_deliveries where delivery_id = v_delivery;
  select count(*) into v_receipt_count from public.harvey_relay_receipts where delivery_id = v_delivery and state = 'CLAIMED';
  if v_claim_count <> 2 or v_receipt_count <> 2 then raise exception 'HARVEY_TEST_RECLAIM_EVIDENCE_FAILED'; end if;
end
$test$;

do $test$
declare
  v_now bigint := extract(epoch from now())::bigint;
begin
  perform public.harvey_consume_receiver_nonce('doss:test-a', 'Doss', '11111111111111111111111111111111', v_now);
  begin
    perform public.harvey_consume_receiver_nonce('doss:test-a', 'Doss', '11111111111111111111111111111111', v_now);
    raise exception 'HARVEY_TEST_NONCE_REPLAY_NOT_REJECTED';
  exception when others then
    if sqlerrm <> 'HARVEY_RECEIVER_NONCE_REPLAYED' then raise; end if;
  end;
  begin
    perform public.harvey_consume_receiver_nonce('doss:test-a', 'Betsy', '22222222222222222222222222222222', v_now);
    raise exception 'HARVEY_TEST_NONCE_MACHINE_IMPERSONATION_NOT_REJECTED';
  exception when others then
    if sqlerrm <> 'HARVEY_RECEIVER_MACHINE_BINDING_INVALID' then raise; end if;
  end;
end
$test$;

do $test$
begin
  if has_table_privilege('anon', 'public.harvey_relay_commands', 'select') then raise exception 'HARVEY_TEST_ANON_SELECT_FAILED'; end if;
  if has_table_privilege('authenticated', 'public.harvey_relay_commands', 'select') then raise exception 'HARVEY_TEST_AUTHENTICATED_SELECT_FAILED'; end if;
  if has_function_privilege('anon', 'public.harvey_enqueue_command(text,text,text,text,text,text[])', 'execute') then raise exception 'HARVEY_TEST_ANON_EXECUTE_FAILED'; end if;
  if has_function_privilege('anon', 'public.harvey_claim_deliveries(text,text,integer,integer)', 'execute') then raise exception 'HARVEY_TEST_ANON_CLAIM_EXECUTE_FAILED'; end if;
  if has_function_privilege('anon', 'public.harvey_record_delivery_receipt(uuid,text,uuid,text,text,text,jsonb)', 'execute') then raise exception 'HARVEY_TEST_ANON_RECEIPT_EXECUTE_FAILED'; end if;
  if not has_function_privilege('service_role', 'public.harvey_enqueue_command(text,text,text,text,text,text[])', 'execute') then raise exception 'HARVEY_TEST_SERVICE_ENQUEUE_FAILED'; end if;
  if not has_function_privilege('service_role', 'public.harvey_consume_receiver_nonce(text,text,text,bigint)', 'execute') then raise exception 'HARVEY_TEST_SERVICE_NONCE_EXECUTE_FAILED'; end if;
  if not has_function_privilege('service_role', 'public.harvey_claim_deliveries(text,text,integer,integer)', 'execute') then raise exception 'HARVEY_TEST_SERVICE_CLAIM_EXECUTE_FAILED'; end if;
  if not has_function_privilege('service_role', 'public.harvey_record_delivery_receipt(uuid,text,uuid,text,text,text,jsonb)', 'execute') then raise exception 'HARVEY_TEST_SERVICE_RECEIPT_EXECUTE_FAILED'; end if;
  if has_table_privilege('service_role', 'public.harvey_relay_receipts', 'insert')
    or has_table_privilege('service_role', 'public.harvey_relay_receipts', 'update')
    or has_table_privilege('service_role', 'public.harvey_relay_receipts', 'delete') then
    raise exception 'HARVEY_TEST_RECEIPT_MUTATION_PRIVILEGE_FAILED';
  end if;
end
$test$;

rollback;
