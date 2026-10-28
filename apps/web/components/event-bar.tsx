"use client";

import { type ReactNode, useEffect, useState } from "react";

/** The phone's register bar: hidden while the page's own register button is on screen, so there is one call to action at a time. */
export function EventBar({ watch, children }: { watch: string; children: ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const target = document.querySelector(watch);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setShown(!entry?.isIntersecting && (entry?.boundingClientRect.top ?? 0) < 0));
    observer.observe(target);
    return () => observer.disconnect();
  }, [watch]);
  return (
    <div className="event-bar" data-shown={shown}>
      {children}
    </div>
  );
}
