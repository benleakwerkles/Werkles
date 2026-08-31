import Link from "next/link";

import { BellowsVisualPause } from "@/components/bellows/bellows-visual-pause";
import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";
import { copy } from "@/lib/copy";
import {
  bellowsLessons,
  bellowsPrimarySources,
  bellowsSourceReviewDate,
  partnershipAlignmentTopics
} from "@/lib/bellows/operator-library";

import "./bellows-library.css";

export const metadata = {
  title: "Public Bellows | Werkles",
  description:
    "Plain-language lessons for testing business advice, preparing a company launch, inspecting proof, and aligning a partnership."
};

export default function BellowsOperatorLibraryPage() {
  return (
    <>
      <LocalAwareSiteHeader />
      <main className="bellows-library">
        <nav className="bellows-library__nav" aria-label="Bellows library navigation">
          <Link href="/bellows">← Bellows</Link>
          <a href="#lessons">{bellowsLessons.length} lessons</a>
          <a href="#alignment-memo">Alignment memo</a>
          <a href="#sources">Primary sources</a>
        </nav>

        <header className="bellows-library__hero">
          <div>
            <p className="eyebrow">Public Bellows</p>
            <h1>Build it before you bind it.</h1>
            <p className="bellows-library__lede">
              Short lessons for the moment when “I need a partner” or “I need funding” sounds like an
              answer—but may only be your first guess.
            </p>
          </div>
          <aside className="bellows-library__promise" aria-label="How Bellows teaches">
            <strong>Leave with something useful.</strong>
            <span>See where an idea works.</span>
            <span>Catch where it breaks.</span>
            <span>Make one move you can reconsider.</span>
          </aside>
        </header>

        <div className="bellows-library__boundary" role="note">
          <strong>Educational information and planning questions only.</strong>
          <span>
            Not legal, tax, accounting, investment, lending, insurance, or other professional advice. Requirements
            vary by jurisdiction and facts. Werkles does not form your entity, approve your agreement, recommend a
            transaction, or make a checklist proof of compliance. This page does not create an attorney-client or
            other professional relationship. Use independent qualified professionals before signing, filing,
            issuing equity, borrowing, guaranteeing debt, or relying on a document.
          </span>
        </div>

        <section id="lessons" className="bellows-library__map" aria-labelledby="libraryMapTitle">
          <div className="bellows-library__section-heading">
            <p className="eyebrow">Start anywhere</p>
            <h2 id="libraryMapTitle">Choose the problem you need help with today.</h2>
          </div>
          <div className="bellows-library__map-grid">
            {bellowsLessons.map((lesson, index) => (
              <Link key={lesson.slug} href={`/bellows/library/${lesson.slug}`} className="bellows-library__map-card">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{lesson.eyebrow}</p>
                <strong>{lesson.title}</strong>
                <small>{lesson.promise}</small>
                <b>Open this lesson →</b>
              </Link>
            ))}
          </div>
        </section>

        <BellowsVisualPause variant="people" />

        <section id="alignment-memo" className="alignment-memo" aria-labelledby="alignmentMemoTitle">
          <div className="bellows-library__section-heading">
            <p className="eyebrow">Partnership starter kit</p>
            <h2 id="alignmentMemoTitle">A conversation memo—not an agreement.</h2>
            <p>
              Each person answers separately. Compare the answers. Circle the differences. Those differences are
              the useful handoff to independent legal and tax advisers.
            </p>
          </div>
          <div className="alignment-memo__grid">
            {partnershipAlignmentTopics.map(([topic, prompt], index) => (
              <article key={topic}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{topic}</h3>
                <p>{prompt}</p>
              </article>
            ))}
          </div>
          <p className="alignment-memo__warning" role="note">
            Do not sign or rely on this page as an operating agreement, partnership agreement, employment
            agreement, tax election, securities document, or legal opinion.
          </p>
        </section>

        <section className="bellows-example" aria-labelledby="bellowsExampleTitle">
          <p className="eyebrow">Fictional example</p>
          <h2 id="bellowsExampleTitle">The percentage was not the disagreement.</h2>
          <p>
            Rae and Jordan both say “half and half.” Rae means equal ownership after Jordan moves to full-time.
            Jordan means equal ownership today while keeping another job. Their alignment memo exposes four
            separate decisions: timing, minimum work, compensation before distributions, and what happens if the
            move never occurs.
          </p>
          <p>
            The memo does not solve those decisions. It prevents a lawyer from receiving one cheerful sentence
            and two incompatible expectations.
          </p>
        </section>

        <BellowsVisualPause variant="tools" />

        <section id="sources" className="bellows-sources" aria-labelledby="bellowsSourcesTitle">
          <div className="bellows-library__section-heading">
            <p className="eyebrow">Start with primary sources</p>
            <h2 id="bellowsSourcesTitle">The floor beneath this first lesson.</h2>
          </div>
          <ul>
            {bellowsPrimarySources.map((source) => (
              <li key={source.href}>
                <a href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
                <p>{source.note}</p>
              </li>
            ))}
          </ul>
          <p className="bellows-sources__reviewed">Sources reviewed {bellowsSourceReviewDate}. Check the linked source for current requirements.</p>
        </section>

        <footer className="bellows-library__next">
          <div>
            <p className="eyebrow">Next room</p>
            <h2>Use the questions before you use the paperwork.</h2>
          </div>
          <div className="actions">
            <Link className="button button-dark" href="/bellows/intake">Tell Werkles what I need</Link>
            <Link className="button button-outline" href="/proof">Inspect Werkles proof</Link>
          </div>
        </footer>
      </main>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
