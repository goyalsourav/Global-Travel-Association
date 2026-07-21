import { useState } from "react";

// Clamp so a very wide panorama or a very tall portrait doesn't break the
// surrounding grid layout, while still matching the photo's real shape.
const MIN_RATIO = 0.62; // tall portrait limit
const MAX_RATIO = 1.6; // wide landscape limit

function clampRatio(ratio: number) {
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
}

// Sizes its box to the image's own aspect ratio (portrait or landscape,
// detected from the loaded image's natural dimensions) instead of forcing a
// fixed ratio, so object-cover never crops content out of the photo.
export function AdaptiveImage({
  src,
  alt,
  className = "",
  fallbackClassName = "aspect-[4/5]",
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [ratio, setRatio] = useState<number | null>(null);

  const applyRatio = (img: HTMLImageElement) => {
    if (img.naturalWidth && img.naturalHeight) {
      setRatio(clampRatio(img.naturalWidth / img.naturalHeight));
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      ref={(img) => {
        if (img && img.complete) applyRatio(img);
      }}
      onLoad={(e) => applyRatio(e.currentTarget)}
      style={ratio ? { aspectRatio: ratio } : undefined}
      className={`w-full object-cover ${ratio ? "" : fallbackClassName} ${className}`}
    />
  );
}
