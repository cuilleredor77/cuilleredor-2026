import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getRequestByToken, isAdmin } from "../../../lib/server";
import { quoteFileName } from "../../../lib/quote";
import QuoteDocument from "../document";
import PrintButton from "../print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Votre devis — Cuillère d’Or",
  robots: { index: false, follow: false },
};

export default async function QuotePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ doc?: string }> }) {
  const { token } = await params;
  const quoteOnly = (await searchParams).doc === "devis";
  if (!/^[a-f0-9]{36}$/.test(token)) notFound();
  const row = await getRequestByToken(token);
  if (!row || !row.quote_json) notFound();
  // Le bouton « Préparer le mail » n’apparaît que pour l’administratrice connectée.
  const admin = await isAdmin(new Request("https://cuilleredor.fr/", { headers: { cookie: (await headers()).get("cookie") || "" } }));
  return (
    <main className="dv-wrap">
      <div className="dv-toolbar">
        <span>
          {quoteOnly ? "Devis" : "Devis et contrat"} — {row.client_name}
          {admin ? <em className="dv-admin-meta"> · {STATUS_LABEL[row.status] || row.status} · modifié le {parisDateTime(row.updated_at)}</em> : null}
        </span>
        <div className="dv-toolbar-actions">
          <PrintButton fileName={quoteFileName(row)} quoteOnly={quoteOnly} />
          {admin ? (
            <a className="dv-print dv-mail" href={`/admin/${row.id}?mail=1${quoteOnly ? "&doc=devis" : ""}`} target="_blank" rel="noopener noreferrer">✉ Préparer le mail</a>
          ) : null}
        </div>
      </div>
      <QuoteDocument row={row} quoteOnly={quoteOnly} />
    </main>
  );
}

const STATUS_LABEL: Record<string, string> = {
  nouvelle: "Nouvelle", en_cours: "En cours", devis_pret: "Devis prêt", envoye: "Envoyé",
  signe: "Signé", acompte: "Acompte reçu", archivee: "Archivée",
};

function parisDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value || "";
  return `${g("day")}/${g("month")}/${g("year")} à ${g("hour")}h${g("minute")}`;
}
