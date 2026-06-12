import Image from "next/image";

type GalleryItem = {
  id: string;
  title: string;
  caption: string;
  path: string;
};

type Props = {
  title: string;
  items: GalleryItem[];
};

export function NarrativePhotoGallery({ title, items }: Props) {
  return (
    <section className="narrative-photo-gallery" aria-labelledby={`gallery-${title.replace(/\s+/g, "-")}`}>
      <h2 id={`gallery-${title.replace(/\s+/g, "-")}`} className="narrative-photo-gallery__title">
        {title}
      </h2>
      <div className="narrative-photo-gallery__grid">
        {items.map((item) => (
          <figure key={item.id} className="narrative-photo-gallery__tile">
            <Image
              src={item.path}
              alt={item.title}
              width={640}
              height={360}
              className="narrative-photo-gallery__photo"
            />
            <figcaption>
              <strong>{item.title}</strong>
              <span>{item.caption}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
