import type React from "react";

type IconName =
  | "home"
  | "feed"
  | "taste"
  | "player"
  | "hub"
  | "privacy"
  | "user"
  | "play"
  | "pause"
  | "save"
  | "more"
  | "external"
  | "check"
  | "info"
  | "hide"
  | "clock"
  | "spark"
  | "search"
  | "library"
  | "bell"
  | "comment"
  | "chevronLeft"
  | "chevronRight";

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  const paths: Record<IconName, React.ReactNode> = {
    home: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
    feed: <path d="M5 7h14M5 12h10M5 17h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />,
    taste: <path d="M12 3v18M5 8c4 0 7 3 7 7M19 8c-4 0-7 3-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
    player: <path d="M8 5v14l11-7L8 5Z" fill="currentColor" />,
    hub: <path d="M4 18V7M10 18V4M16 18v-8M22 18H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
    privacy: <path d="M12 3 5 6v5c0 4.4 2.8 8 7 10 4.2-2 7-5.6 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
    play: <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />,
    pause: <path d="M8 5h3v14H8V5Zm5 0h3v14h-3V5Z" fill="currentColor" />,
    save: <path d="M6 4h12v17l-6-3.5L6 21V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
    more: <path d="M6 12h.01M12 12h.01M18 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
    external: <path d="M14 4h6v6M20 4l-9 9M20 14v5H5V4h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
    check: <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    info: <path d="M12 17v-6M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
    hide: <path d="m4 4 16 16M10.5 10.7a2 2 0 0 0 2.8 2.8M8.2 6.8C5.8 8 4 10 3 12c1.8 3.5 5 5.5 9 5.5 1.3 0 2.5-.2 3.6-.7M12 6.5c4 0 7.2 2 9 5.5-.5 1.1-1.3 2.1-2.2 2.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
    clock: <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
    spark: <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
    search: <path d="m20 20-4.6-4.6M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
    library: <path d="M4 4v16M9 4v16M14 6l5-1v15l-5 1V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
    bell: <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 6 2.5 8H3.5C3.5 15 6 15 6 9Zm4 11h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
    comment: <path d="M4 5h16v11H9l-5 4V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
    chevronLeft: <path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    chevronRight: <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}
