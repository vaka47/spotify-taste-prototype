"use client";

import { useEffect, useState } from "react";

export function AvatarImage({
  src,
  fallbackSrc,
  alt,
  className = "avatarImage",
}: {
  src: string;
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

  if (failed || !activeSrc) {
    return <span className="avatarFallback" aria-label={`${alt} unavailable`} />;
  }

  return (
    <img
      className={className}
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
  );
}
