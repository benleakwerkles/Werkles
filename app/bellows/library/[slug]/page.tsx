import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BellowsLessonContent } from "@/components/bellows/bellows-lesson-content";
import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";
import { bellowsLessonBySlug, bellowsLessons } from "@/lib/bellows/operator-library";
import { copy } from "@/lib/copy";

import "../bellows-library.css";

type BellowsLessonPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return bellowsLessons.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({ params }: BellowsLessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = bellowsLessonBySlug(slug);
  return lesson
    ? { title: `${lesson.title} | Bellows`, description: lesson.promise }
    : { title: "Bellows lesson not found" };
}

export default async function BellowsLessonPage({ params }: BellowsLessonPageProps) {
  const { slug } = await params;
  const lesson = bellowsLessonBySlug(slug);
  if (!lesson) notFound();

  return (
    <>
      <LocalAwareSiteHeader />
      <main className="bellows-library bellows-lesson-page">
        <nav className="bellows-library__nav" aria-label="Bellows lesson navigation">
          <Link href="/bellows/library">← All Bellows Lessons</Link>
          <Link href="/bellows/recommendations">My Recommendations</Link>
        </nav>
        <BellowsLessonContent
          lesson={lesson}
          lessonNumber={bellowsLessons.findIndex((item) => item.slug === lesson.slug) + 1}
          returnHref="/bellows/recommendations"
          returnLabel="Back to My Recommendations"
        />
      </main>
      <footer className="site-footer"><p>{copy.disclaimer}</p></footer>
    </>
  );
}
