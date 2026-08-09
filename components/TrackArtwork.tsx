"use client";

import { useEffect, useState } from "react";

export function TrackArtwork({
  src,
  fallbackSrc,
  alt,
  className = "",
}: {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
}) {
  const [activeSrc, setActiveSrc] = useState(src || fallbackSrc || "");
  const [failed, setFailed] = useState(!(src || fallbackSrc));

  useEffect(() => {
    setActiveSrc(src || fallbackSrc || "");
    setFailed(!(src || fallbackSrc));
  }, [src, fallbackSrc]);

  return (
    <div className={className}>
      {failed || !activeSrc ? (
        <div className="coverFallback" aria-label={`${alt} cover unavailable`}>
          No image
        </div>
      ) : (
        <img
          className="coverImage"
          src={activeSrc}
          alt={alt}
          onError={() => {
            if (fallbackSrc && activeSrc !== fallbackSrc) {
              setActiveSrc(fallbackSrc);
              return;
            }
            setFailed(true);
          }}
        />
      )}
    </div>
  );
}
