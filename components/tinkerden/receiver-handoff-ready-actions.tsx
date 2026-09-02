type ReceiverHandoffReadyActionsProps = {
  bundleId: string;
  postCommand: string;
};

export function ReceiverHandoffReadyActions({ bundleId, postCommand }: ReceiverHandoffReadyActionsProps) {
  return (
    <div
      className="td-receiver-handoff-actions"
      data-receiver-handoff-ready-action-panel
      data-bundle-id={bundleId}
      data-posted-receipt-id=""
      data-contract-receipt-path=""
    >
      <button
        type="button"
        data-copy-receiver-handoff-ready-command
        data-command={postCommand}
      >
        COPY POST COMMAND
      </button>
      <button
        type="button"
        data-post-receiver-handoff-return
        data-post-receiver-handoff-ready-return
        data-bundle-id={bundleId}
        data-posted-receipt-id=""
        data-contract-receipt-path=""
      >
        POST RETURNED RECEIPT
      </button>
      <span data-receiver-handoff-ready-action-status />
    </div>
  );
}
