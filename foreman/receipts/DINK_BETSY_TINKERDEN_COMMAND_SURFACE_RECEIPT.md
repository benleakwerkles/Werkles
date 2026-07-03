# DINK_BETSY_TINKERDEN_COMMAND_SURFACE_RECEIPT

status: ARTIFACT
artifact: TINKERDEN_COMMAND_SURFACE_V0
timestamp: 2026-06-27T17:38:08.172Z

artifact_path: `app/tinkerden/page.tsx`

preview_path_used: `/tinkerden` Bridge at `http://127.0.0.1:3002/tinkerden`

packet_path_written: `tinkerden/inbox/td_command_20260627173808_9d30ed.json`

receipt_path_read: `tinkerden/receipts/td_command_receipt_20260627173808_9d30ed.json`

first_displayed_receipt_status: `ACK`

destination_selected: `Dink@Betsy`

destination_id: `dink_betsy_aeye_inbox_v0`

packet_id: `td_command_20260627173808_9d30ed`

receipt_id: `td_command_receipt_20260627173808_9d30ed`

packet_hash: `6e4683d9a71e52d03bc2517f59c8a01214f75474c92e92dc46f157b95cf4b1ca`

receiver_read_hash: `6e4683d9a71e52d03bc2517f59c8a01214f75474c92e92dc46f157b95cf4b1ca`

receiver_hash_match: `true`

missing_proof_if_blocked: `NONE for Betsy-local receiver hash read. Independent cross-machine Aeye receiver process proof remains outside this cockpit/membrane surface.`

minimum_ui:
- command_input: `present`
- aeye_machine_destination_selector: `present; sourced from foreman/messages/DESTINATION_DIRECTORY.json`
- packet_preview: `present`
- send_write_action: `WRITE TO INBOX`
- receipt_panel: `present`
- ack_blocker_artifact_display: `ACK displayed`
- stale_no_receipt_warning: `present before receipt returns`

required_file_backed_surfaces:
- `tinkerden/inbox`
- `tinkerden/receipts`
- `tinkerden/feedback/decision-ledger.jsonl`

pass_test:
- one_command_becomes_one_packet: `true`
- one_receiver_side_ack_blocker_artifact_displayed: `true`
- sent_counted_as_proof: `false`

receipt_pickup_api_first_row:
- receipt_id: `td_command_receipt_20260627173808_9d30ed`
- linked_packet_id: `td_command_20260627173808_9d30ed`
- status_guess: `ACK`
- path: `tinkerden/receipts/td_command_receipt_20260627173808_9d30ed.json`

boundary:
- full_feral_shell_built: `false`
- nerdkle_body_proof_claimed: `false`
- nmclr_proof_used_as_cockpit_proof: `false`
- automation_claimed_without_receiver_receipt: `false`

ben_action: `None`
