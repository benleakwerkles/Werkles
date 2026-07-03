import { WonkaDenProof } from "./wonka-den-proof";
import { SwatterProof } from "./swatter-proof";
import { PermissionSwatterPanel } from "./permission-swatter-panel";

export function NextStepPanel() {
  return (
    <section className="next-step-panel" aria-label="Soledash proof tools">
      <PermissionSwatterPanel />
      <WonkaDenProof />
      <SwatterProof />
    </section>
  );
}
