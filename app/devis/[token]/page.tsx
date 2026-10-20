import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRequestByToken } from "../../../lib/server";
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
  return (
    <main className="dv-wrap">
      <div className="dv-toolbar">
        <span>{quoteOnly ? "Devis" : "Devis et contrat"} — {row.client_name}</span>
        <PrintButton fileName={quoteFileName(row)} quoteOnly={quoteOnly} />
      </div>
      <QuoteDocument row={row} quoteOnly={quoteOnly} />
    </main>
  );
}
