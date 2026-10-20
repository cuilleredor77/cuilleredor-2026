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
        <span>{quoteOnly ? "Devis" : "Devis et contrat"} — {row.client_name}</span>
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
