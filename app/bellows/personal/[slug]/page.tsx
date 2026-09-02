import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountAwarePersonalLessonFocus } from "@/components/bellows/account-aware-personal-lesson-focus";
import { BellowsLessonContent } from "@/components/bellows/bellows-lesson-content";
import { PersonalLessonProgress } from "@/components/bellows/personal-lesson-progress";
import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";
import { bellowsLessonBySlug, bellowsLessons } from "@/lib/bellows/operator-library";
import { copy } from "@/lib/copy";
import { loadPublicBellowsRecommendationPageData } from "@/lib/squibb/public-recommendation-session-server";

import "../../library/bellows-library.css";

type PersonalBellowsLessonPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return bellowsLessons.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({ params }: PersonalBellowsLessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = bellowsLessonBySlug(slug);
  return lesson
    ? { title: `${lesson.title} | My Bellows`, description: `Your current Werkles focus for ${lesson.title}` }
    : { title: "Personal Bellows lesson not found" };
}

export default async function PersonalBellowsLessonPage({ params }: PersonalBellowsLessonPageProps) {
  const { slug } = await params;
  const lesson = bellowsLessonBySlug(slug);
  if (!lesson) notFound();
  const { session } = await loadPublicBellowsRecommendationPageData();
  const publicLessonHref = `/bellows/library/${lesson.slug}` as const;

  return (
    <>
      <LocalAwareSiteHeader />
      <main className="bellows-library bellows-lesson-page bellows-personal-lesson-page route-room route-room--personal-bellows workshop-route--personal-bellows">
        <nav className="bellows-library__nav" aria-label="Personal Bellows lesson navigation">
          <Link href="/bellows/personal">← My Bellows</Link>
          <Link href={publicLessonHref}>Open Public Version</Link>
        </nav>
        <AccountAwarePersonalLessonFocus initialSession={session} publicLessonHref={publicLessonHref} />
        <BellowsLessonContent
          lesson={lesson}
          lessonNumber={bellowsLessons.findIndex((item) => item.slug === lesson.slug) + 1}
          returnHref="/bellows/personal"
          returnLabel="Back to My Bellows"
        />
        <PersonalLessonProgress lessonSlug={lesson.slug} lessonTitle={lesson.title} />
      </main>
      <footer className="site-footer"><p>{copy.disclaimer}</p></footer>
    </>
  );
}
