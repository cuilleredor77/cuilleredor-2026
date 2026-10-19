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

export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{36}$/.test(token)) notFound();
  const row = await getRequestByToken(token);
  if (!row || !row.quote_json) notFound();
  return (
    <main className="dv-wrap">
      <div className="dv-toolbar">
        <span>Devis et contrat — {row.client_name}</span>
        <PrintButton fileName={quoteFileName(row)} />
      </div>
      <QuoteDocument row={row} />
    </main>
  );
}
