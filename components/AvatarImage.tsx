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
  const initials = alt
    .replace(/\s+(avatar|unavailable)$/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("");
  const [activeSrc, setActiveSrc] = useState(src || fallbackSrc || "");
  const [failed, setFailed] = useState(!(src || fallbackSrc));

  useEffect(() => {
    setActiveSrc(src || fallbackSrc || "");
    setFailed(!(src || fallbackSrc));
  }, [src, fallbackSrc]);

  if (failed || !activeSrc) {
    return <span className="avatarFallback" aria-label={`${alt} unavailable`}>{initials}</span>;
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
