import { laneById } from "@/lib/visual-system/lanes";
import type { ProfileCardModel } from "@/lib/visual-system/types";

type ProfileCardProps = {
  model: ProfileCardModel;
  compact?: boolean;
};

const stateLabels: Record<ProfileCardModel["state"], string> = {
  undeclared: "Undeclared",
  "lane-chosen": "Lane chosen",
  "in-formation": "In formation",
  formed: "Formed"
};

export function ProfileCard({ model, compact = false }: ProfileCardProps) {
  const lane = model.lane ? laneById[model.lane] : null;
  const accent = lane?.accentVar ?? "--werkles-iron";

  return (
    <article
      className={`vs-profile-card vs-profile-card--${model.state}${compact ? " vs-profile-card--compact" : ""}`}
      style={{ ["--vs-lane-accent" as string]: `var(${accent})` }}
      aria-label={`Profile card — ${stateLabels[model.state]}`}
    >
      <header className="vs-profile-card__header">
        <div className="vs-profile-card__identity">
          <p className="vs-profile-card__eyebrow">{stateLabels[model.state]}</p>
          <h3 className="vs-profile-card__name">{model.name}</h3>
          {model.location ? <p className="vs-profile-card__meta">{model.location}</p> : null}
        </div>
        {model.roleLabel ? (
          <p className="vs-profile-card__role-stamp">{model.roleLabel}</p>
        ) : (
          <p className="vs-profile-card__role-outline">Lane open</p>
        )}
      </header>

      {model.currentTitle && model.state === "undeclared" ? (
        <p className="vs-profile-card__current">
          <span>Currently</span> {model.currentTitle}
        </p>
      ) : null}

      <div className="vs-profile-card__status-row">
        <span className="vs-profile-card__formation">{model.formationStatus}</span>
        {model.werkileLabel ? <span className="vs-profile-card__werkile">{model.werkileLabel}</span> : null}
      </div>

      {model.skills?.length ? (
        <ul className="vs-profile-card__skills" aria-label="Skills">
          {model.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      ) : null}

      {(model.availability || model.projectState) && model.state !== "undeclared" ? (
        <dl className="vs-profile-card__details">
          {model.availability ? (
            <>
              <dt>Availability</dt>
              <dd>{model.availability}</dd>
            </>
          ) : null}
          {model.projectState ? (
            <>
              <dt>Project</dt>
              <dd>{model.projectState}</dd>
            </>
          ) : null}
          {model.formedOn ? (
            <>
              <dt>Formed</dt>
              <dd>{model.formedOn}</dd>
            </>
          ) : null}
        </dl>
      ) : null}

      {model.state === "formed" ? <div className="vs-profile-card__formed-frame" aria-hidden="true" /> : null}
    </article>
  );
}
