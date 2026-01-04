interface FullWidthImageProps {
  src: string;
  alt: string;
  caption?: string;
}

export default function FullWidthImage({
  src,
  alt,
  caption,
}: FullWidthImageProps) {
  return (
    <figure className="my-8">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="image-full-width"
      />
      {caption && (
        <figcaption className="image-caption">{caption}</figcaption>
      )}
    </figure>
  );
}
