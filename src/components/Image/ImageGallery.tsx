interface ImageItem {
  src: string;
  alt: string;
  caption?: string;
}

interface ImageGalleryProps {
  images: ImageItem[];
  columns?: 2 | 3;
}

export default function ImageGallery({
  images,
  columns = 2,
}: ImageGalleryProps) {
  const columnClass = columns === 3 ? 'image-gallery-3' : 'image-gallery-2';

  return (
    <div className={`image-gallery ${columnClass}`}>
      {images.map((image, index) => (
        <figure key={index} className="m-0">
          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
            className="w-full h-auto rounded-lg object-cover aspect-video"
          />
          {image.caption && (
            <figcaption className="image-caption mt-2">
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
