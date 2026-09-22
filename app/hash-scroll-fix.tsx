"use client";

import { useEffect } from "react";

export default function HashScrollFix() {
  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    const scrollToCurrentHash = () => {
      if (cancelled || !window.location.hash) return;
      const id = decodeURIComponent(window.location.hash.slice(1));
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    };

    const schedule = () => {
      cancelled = false;
      requestAnimationFrame(scrollToCurrentHash);
      [150, 600, 1400].forEach((delay) => timers.push(window.setTimeout(scrollToCurrentHash, delay)));
    };

    const stopAutomaticScroll = () => { cancelled = true; };
    schedule();
    window.addEventListener("load", schedule);
    window.addEventListener("hashchange", schedule);
    window.addEventListener("wheel", stopAutomaticScroll, { passive: true });
    window.addEventListener("touchstart", stopAutomaticScroll, { passive: true });
    window.addEventListener("pointerdown", stopAutomaticScroll, { passive: true });
    window.addEventListener("keydown", stopAutomaticScroll);

    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("load", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("wheel", stopAutomaticScroll);
      window.removeEventListener("touchstart", stopAutomaticScroll);
      window.removeEventListener("pointerdown", stopAutomaticScroll);
      window.removeEventListener("keydown", stopAutomaticScroll);
    };
  }, []);

  return null;
}
