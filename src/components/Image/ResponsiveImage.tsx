interface ResponsiveImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

export default function ResponsiveImage({
  src,
  alt,
  caption,
  className = '',
}: ResponsiveImageProps) {
  return (
    <figure className={`my-6 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="image-default w-full"
      />
      {caption && (
        <figcaption className="image-caption">{caption}</figcaption>
      )}
    </figure>
  );
}
