"use client";

import { useEffect, useState } from "react";

const KEY = "spotify_taste.following";

export function useFollowingTaste(tastemakerId: string) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, boolean>;
      setFollowing(Boolean(stored[tastemakerId]));
    } catch {
      setFollowing(false);
    }
  }, [tastemakerId]);

  function toggle() {
    setFollowing(current => {
      const next = !current;
      try {
        const stored = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, boolean>;
        localStorage.setItem(KEY, JSON.stringify({ ...stored, [tastemakerId]: next }));
      } catch {
        localStorage.setItem(KEY, JSON.stringify({ [tastemakerId]: next }));
      }
      return next;
    });
  }

  return { following, toggle };
}
