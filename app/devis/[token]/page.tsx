import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getRequestByToken, isAdmin } from "../../../lib/server";
import { computeTotals, offPeriod, parisDateTimeFR, parseQuote, parseSignature, quoteFileName } from "../../../lib/quote";
import QuoteDocument from "../document";
import PrintButton from "../print-button";
import SignBox from "../sign-box";
import { dateTimeText, money, type Lang } from "../../../lib/devis-en";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Votre devis — Cuillère d’Or",
  robots: { index: false, follow: false },
};

export default async function QuotePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ doc?: string; lang?: string }> }) {
  const { token } = await params;
  const search = await searchParams;
  const quoteOnly = search.doc === "devis";
  const lang: Lang = search.lang === "en" ? "en" : "fr";
  const en = lang === "en";
  // Lien vers la même page dans l’autre langue (même document : devis seul ou devis + contrat).
  const langHref = (l: Lang) => `?${new URLSearchParams({ ...(quoteOnly ? { doc: "devis" } : {}), ...(l === "en" ? { lang: "en" } : {}) }).toString()}`;
  if (!/^[a-f0-9]{36}$/.test(token)) notFound();
  const row = await getRequestByToken(token);
  if (!row || !row.quote_json) notFound();
  // Le bouton « Préparer le mail » n’apparaît que pour l’administratrice connectée.
  const signature = parseSignature(row);
  const admin = await isAdmin(new Request("https://cuilleredor.fr/", { headers: { cookie: (await headers()).get("cookie") || "" } }));
  return (
    <main className="dv-wrap">
      <div className="dv-toolbar">
        <span>
          {en ? (quoteOnly ? "Quote" : "Quote and agreement") : (quoteOnly ? "Devis" : "Devis et contrat")} — {row.client_name}
          {admin ? <em className="dv-admin-meta"> · {STATUS_LABEL[row.status] || row.status} · modifié le {parisDateTime(row.updated_at)}</em> : null}
        </span>
        <div className="dv-toolbar-actions">
          <span className="dv-lang" role="group" aria-label="Langue / Language">
            <a href={langHref("fr")} className={en ? "" : "on"} hrefLang="fr">Français</a>
            <a href={langHref("en")} className={en ? "on" : ""} hrefLang="en">English</a>
          </span>
          <PrintButton fileName={en ? `${quoteFileName(row)}_EN` : quoteFileName(row)} quoteOnly={quoteOnly} lang={lang} />
          {admin ? (
            <a className="dv-print dv-mail" href={`/admin/${row.id}?mail=1${quoteOnly ? "&doc=devis" : ""}`} target="_blank" rel="noopener noreferrer">✉ Préparer le mail</a>
          ) : null}
        </div>
      </div>
      {signature ? (
        <p className="dv-signed-banner">{en ? `✍️ Electronically signed on ${dateTimeText(signature.at, lang, parisDateTimeFR)} by ${signature.name}.` : `✍️ Signé électroniquement le ${parisDateTimeFR(signature.at)} par ${signature.name}.`}</p>
      ) : null}
      <QuoteDocument row={row} quoteOnly={quoteOnly} lang={lang} />
      {!signature && ["nouvelle", "en_cours", "devis_pret", "envoye"].includes(row.status) && !offPeriod(row.event_date) ? (
        admin
          ? <p className="dv-signbox dv-signbox-admin">Aperçu administratrice : le client verra ici le bloc « Signer en ligne ».</p>
          : <SignBox token={token} quoteOnly={quoteOnly} clientName={row.client_name} total={money(computeTotals(parseQuote(row), row.event_date, row.service_mode).total, lang)} lang={lang} />
      ) : null}
    </main>
  );
}

const STATUS_LABEL: Record<string, string> = {
  nouvelle: "Nouvelle", en_cours: "En cours", devis_pret: "Devis prêt", envoye: "Envoyé",
  signe: "Signé", acompte: "Acompte reçu", archivee: "Archivée", abandonnee: "Abandonnée",
};

function parisDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value || "";
  return `${g("day")}/${g("month")}/${g("year")} à ${g("hour")}h${g("minute")}`;
}
