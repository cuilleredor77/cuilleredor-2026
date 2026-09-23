import { ArrowLeft, Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";

export default function LegalShell({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return <main className="legal-page">
    <header className="legal-header">
      <a href="/" aria-label="Retour à l’accueil Cuillère d’Or"><img src="/logo-cuillere-dor.png" width="1781" height="406" alt="Cuillère d’Or" /></a>
      <a className="legal-back" href="/"><ArrowLeft size={16} /> Retour au catalogue</a>
    </header>
    <div className="legal-hero"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>Dernière mise à jour : {updated}</p></div>
    <article className="legal-content">{children}</article>
    <aside className="legal-contact"><strong>Une question sur ces informations ?</strong><a href="mailto:cuilleredor4@gmail.com"><Mail size={17} /> cuilleredor4@gmail.com</a><a href="tel:+33783748971"><Phone size={17} /> 07 83 74 89 71</a></aside>
    <footer className="legal-footer"><span>© 2026 Cuillère d’Or</span><nav><a href="/mentions-legales">Mentions légales</a><a href="/politique-confidentialite">Confidentialité</a></nav></footer>
  </main>;
}
