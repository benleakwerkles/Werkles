import Image from "next/image";

const workScenes = [
  {
    src: "/assets/draft/homepage-narrative-v2/werkles-homepage-narrative-space-d05-van-dawn.png",
    alt: "Work van loaded with tools before the day begins",
    label: "A route ready to run"
  },
  {
    src: "/assets/draft/homepage-narrative-v2/werkles-homepage-narrative-space-d03-tool-at-rest.png",
    alt: "A well-used tool resting on a workbench",
    label: "The tool already in hand"
  },
  {
    src: "/assets/draft/homepage-narrative-v2/werkles-homepage-narrative-space-d07-workshop-pegboard.png",
    alt: "Organized workshop pegboard with tools waiting for their next use",
    label: "A place for the work"
  }
] as const;

export function HomeObjectInterlude() {
  return (
    <section className="home-object-interlude" aria-labelledby="homeObjectInterludeTitle">
      <div className="home-object-interlude__heading">
        <p className="eyebrow">Real work leaves clues</p>
        <h2 id="homeObjectInterludeTitle">Sometimes the next move is a person. Sometimes it is a tool, a place, or a clearer plan.</h2>
      </div>
      <div className="home-object-interlude__scenes">
        {workScenes.map((scene) => (
          <figure key={scene.src}>
            <Image src={scene.src} alt={scene.alt} width={960} height={640} sizes="(max-width: 760px) 100vw, 33vw" />
            <figcaption>{scene.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
