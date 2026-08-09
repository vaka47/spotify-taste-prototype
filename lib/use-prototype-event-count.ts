"use client";

import { useEffect, useState } from "react";
import { PROTOTYPE_EVENTS_UPDATED, readPrototypeEvents } from "@/lib/prototype-events";

export function usePrototypeEventCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(readPrototypeEvents().length);
    update();
    window.addEventListener(PROTOTYPE_EVENTS_UPDATED, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(PROTOTYPE_EVENTS_UPDATED, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return count;
}
