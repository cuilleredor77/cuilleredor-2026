import { ArrowLeft, Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";

const TEXT = {
  fr: { home: "/", homeAria: "Retour à l’accueil Cuillère d’Or", back: "Retour au site", updated: "Dernière mise à jour", question: "Une question sur ces informations ?", phone: "07 83 74 89 71", legal: ["/mentions-legales", "Mentions légales"], privacy: ["/politique-confidentialite", "Confidentialité"] },
  en: { home: "/en", homeAria: "Back to the Cuillère d’Or home page", back: "Back to website", updated: "Last updated", question: "Questions about this information?", phone: "+33 7 83 74 89 71", legal: ["/en/legal-notice", "Legal notice"], privacy: ["/en/privacy-policy", "Privacy policy"] },
};

export default function LegalShell({ eyebrow, title, updated, children, lang = "fr" }: { eyebrow: string; title: string; updated: string; children: ReactNode; lang?: "fr" | "en" }) {
  const t = TEXT[lang];
  return <main className="legal-page" lang={lang}>
    <header className="legal-header">
      <a href={t.home} aria-label={t.homeAria}><img src="/logo-cuillere-dor.png?v=2" width="711" height="209" alt="Cuillère d’Or" /></a>
      <a className="legal-back" href={t.home}><ArrowLeft size={16} /> {t.back}</a>
    </header>
    <div className="legal-hero"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{t.updated}{lang === "fr" ? " : " : ": "}{updated}</p></div>
    <article className="legal-content">{children}</article>
    <aside className="legal-contact"><strong>{t.question}</strong><a href="mailto:contact@cuilleredor.fr"><Mail size={17} /> contact@cuilleredor.fr</a><a href="tel:+33783748971"><Phone size={17} /> {t.phone}</a></aside>
    <footer className="legal-footer"><span>© 2026 Cuillère d’Or</span><nav><a href={t.legal[0]}>{t.legal[1]}</a><a href={t.privacy[0]}>{t.privacy[1]}</a></nav></footer>
  </main>;
}
