# DINK_BETSY_TINKERDEN_COMMAND_SURFACE_BITE_RECEIPT

status: ARTIFACT
timestamp: 2026-06-27T17:24:03.644Z

preview_path_used: `/tinkerden` Bridge at `http://127.0.0.1:3002/tinkerden`

packet_path_written: `tinkerden/inbox/td_command_20260627172403_daa8f7.json`

receipt_path_read: `tinkerden/receipts/td_command_receipt_20260627172403_daa8f7.json`

first_displayed_status: `ACK`

missing_proof_if_blocked: `NONE for Betsy-local receiver hash read. Independent cross-machine Aeye receiver process proof remains outside this bite.`

packet_id: `td_command_20260627172403_daa8f7`

receipt_id: `td_command_receipt_20260627172403_daa8f7`

packet_hash: `fb8cf9519050135c8db18c7b3292564a1eaaea161c7e33af3880da4afa926e60`

receiver_read_hash: `fb8cf9519050135c8db18c7b3292564a1eaaea161c7e33af3880da4afa926e60`

receiver_hash_match: `true`

receipt_panel_visible: `true`

receipt_pickup_api_first_row:
- receipt_id: `td_command_receipt_20260627172403_daa8f7`
- linked_packet_id: `td_command_20260627172403_daa8f7`
- status_guess: `ACK`
- path: `tinkerden/receipts/td_command_receipt_20260627172403_daa8f7.json`

required_file_backed_surfaces:
- `tinkerden/inbox`
- `tinkerden/receipts`
- `tinkerden/feedback/decision-ledger.jsonl`

pass_test:
- one_command_becomes_one_packet: `true`
- one_receiver_side_ack_blocker_artifact_displayed: `true`
- sent_counted_as_proof: `false`

limitation: `This bite proves UI -> packet preview -> write-to-inbox action -> Betsy-local receiver hash read -> receipt panel. It does not build Feral, full Nerdkle, Shadow Branch, or cross-machine transport.`
