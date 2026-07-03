import type { SpeakerHumanRead, SpeakerAlternative } from "@/lib/squibb/speaker-transparency-test-case-0";

import { ConfidenceMeter } from "./confidence-meter";



function AlternativeChip({ alt }: { alt: SpeakerAlternative }) {

  return (

    <li className="concierge-alt-chip">

      <strong>{alt.title}</strong>

      <span>{alt.plainEnglish}</span>

    </li>

  );

}



type SpeakerHumanReadPanelProps = {

  read: SpeakerHumanRead;

};



/** Full panel — used where the 60s card flow is not embedded. */

export function SpeakerHumanReadPanel({ read }: SpeakerHumanReadPanelProps) {

  return (

    <section className="speaker-read panel" aria-labelledby="speakerReadTitle">

      <header className="speaker-read__header">

        <p className="eyebrow">Speaker</p>

        <h2 id="speakerReadTitle">{read.speakersRead.headline}</h2>

        <p className="speaker-read__summary">{read.speakersRead.summary}</p>

      </header>



      <div className="speaker-read__block">

        <h3 className="speaker-read__label">Why</h3>

        <ul className="concierge-bullet-list">

          {read.whySpeakerThinksThis.reasons.map((reason) => (

            <li key={reason}>{reason}</li>

          ))}

        </ul>

      </div>



      <div className="speaker-read__block">

        <h3 className="speaker-read__label">Other plausible reads</h3>

        <ul className="concierge-alt-chips__list">

          {read.alternativeHypotheses.map((alt) => (

            <AlternativeChip key={alt.id} alt={alt} />

          ))}

        </ul>

      </div>



      <div className="speaker-read__block speaker-read__block--falsify">

        <h3 className="speaker-read__label">What would prove Speaker wrong?</h3>

        <ul className="concierge-bullet-list concierge-bullet-list--falsify">

          {read.wouldProveWrong.map((item) => (

            <li key={item}>{item}</li>

          ))}

        </ul>

      </div>



      <div className="speaker-read__confidence">

        <ConfidenceMeter

          score={read.confidence.score}

          label={read.confidence.label}

          why={read.confidence.why}

        />

      </div>

    </section>

  );

}



/** @deprecated Use SpeakerHumanReadPanel */

export const SpeakerTransparencyPanel = SpeakerHumanReadPanel;


