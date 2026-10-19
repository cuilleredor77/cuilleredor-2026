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
    // Menu mobile : se referme après un choix, ou en touchant ailleurs sur la page
    const closeMobileMenu = (event: Event) => {
      const menu = document.querySelector<HTMLDetailsElement>(".mobile-menu");
      if (!menu?.open) return;
      const target = event.target as Element | null;
      if (target?.closest(".mobile-menu nav a") || !target?.closest(".mobile-menu")) menu.open = false;
    };
    document.addEventListener("click", closeMobileMenu);
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
      document.removeEventListener("click", closeMobileMenu);
    };
  }, []);

  return null;
}
