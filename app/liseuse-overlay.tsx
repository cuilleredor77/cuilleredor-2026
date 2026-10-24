"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Liseuse du catalogue en plein écran par-dessus le site : tout lien [data-liseuse="N"] l'ouvre à la page N.
// Sans JavaScript, ces liens mènent à /liseuse/ (page autonome).
export default function LiseuseOverlay({ lang = "fr" }: { lang?: "fr" | "en" }) {
  const en = lang === "en";
  const [page, setPage] = useState<number | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLElement>("[data-liseuse]");
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      setPage(Math.max(1, Number(link.dataset.liseuse) || 1));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (page === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPage(null);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [page]);

  if (page === null) return null;
  return (
    <div className="liseuse-overlay" role="dialog" aria-modal="true" aria-label={en ? "Cuillère d’Or catalogue to browse" : "Catalogue Cuillère d’Or à feuilleter"}>
      <button type="button" className="liseuse-overlay-close" onClick={() => setPage(null)} aria-label={en ? "Close the catalogue" : "Fermer le catalogue"}>
        <X size={22} /> <span>{en ? "Close" : "Fermer"}</span>
      </button>
      <iframe
        key={page}
        src={`/liseuse/?embed${en ? "&lang=en" : ""}${page > 1 ? `#p=${page}` : ""}`}
        title={en ? "Cuillère d’Or 2027-2028 catalogue to browse" : "Catalogue Cuillère d’Or 2027-2028 à feuilleter"}
        allow="fullscreen"
        allowFullScreen
      />
    </div>
  );
}
