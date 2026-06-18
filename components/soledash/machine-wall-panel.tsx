"use client";

import { AdvancedDetails } from "@/components/soledash/advanced-details";
import { AgentInventoryRoster } from "@/components/soledash/agent-inventory-roster";
import { MachineWallHealth } from "@/components/soledash/machine-wall-health";
import { WonkaDenTerminalProof } from "@/components/soledash/wonka-den-terminal-proof";
import { useAgentInventory } from "@/lib/soledash/agent-inventory/use-agent-inventory";

export function MachineWallPanel({ rosterOnly = false }: { rosterOnly?: boolean }) {
  const { roster, machineHealth, loading } = useAgentInventory();

  return (
    <div className="sd-machine-wall">
      <MachineWallHealth machines={machineHealth} loading={loading} />
      {rosterOnly ? (
        <AdvancedDetails summary="Cousin roster" className="sd-machine-wall__roster-advanced">
          <AgentInventoryRoster
            roster={roster}
            loading={loading}
            selectedEntryId={null}
            disabled
            onSelect={() => {}}
          />
        </AdvancedDetails>
      ) : (
        <>
          <AgentInventoryRoster
            roster={roster}
            loading={loading}
            selectedEntryId={null}
            disabled={false}
            onSelect={() => {}}
          />
          <div className="sd-machine-wall__proofs">
            <p className="sd-machine-wall__proof-label">Safe machine proofs</p>
            <WonkaDenTerminalProof hideScoreboard compact />
          </div>
        </>
      )}
    </div>
  );
}
