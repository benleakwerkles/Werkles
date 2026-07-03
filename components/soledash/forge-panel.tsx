"use client";

const FORGE_DREAMS = [
  {
    id: "spanzee",
    title: "Spanzee dreams",
    status: "Warming",
    detail: "Remote node reachability, fleet health receipts, and cousin auto-dispatch when instrumented."
  },
  {
    id: "mmorpg",
    title: "MMORPG",
    status: "Parked",
    detail: "Werkles Construction Arena — parallel build experiments for Petra-scoped cousin lanes."
  },
  {
    id: "space-mining",
    title: "Space Mining",
    status: "Parked",
    detail: "LightShip / Starship naming lane — explode surfaces and starship cockpit dreams."
  }
] as const;

export function ForgePanel() {
  return (
    <section className="sd-forge-panel" aria-label="Forge">
      <p className="sd-forge-panel__lead">The forge holds dreams too big for the desk — heat, not spreadsheets.</p>
      <div className="sd-forge-panel__embers" aria-hidden="true" />
      <ul className="sd-forge-panel__dreams">
        {FORGE_DREAMS.map((dream) => (
          <li key={dream.id} className="sd-forge-panel__dream">
            <div className="sd-forge-panel__dream-head">
              <h3 className="sd-forge-panel__dream-title">{dream.title}</h3>
              <span className="sd-forge-panel__dream-status">{dream.status}</span>
            </div>
            <p className="sd-forge-panel__dream-detail">{dream.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
