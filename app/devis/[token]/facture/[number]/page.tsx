import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db, getRequestByToken } from "../../../../../lib/server";
import { invoiceFileName, type Invoice } from "../../../../../lib/invoice";
import InvoiceDocument from "../../../invoice";
import { InvoicePrintButton } from "../../../print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Facture — Cuillère d’Or",
  robots: { index: false, follow: false },
};

export default async function InvoicePage({ params }: { params: Promise<{ token: string; number: string }> }) {
  const { token, number } = await params;
  if (!/^[a-f0-9]{36}$/.test(token) || !/^FAC-\d{4}-\d{3,4}$/.test(number)) notFound();
  const row = await getRequestByToken(token);
  if (!row) notFound();
  const invoice = await db().prepare("SELECT * FROM invoices WHERE request_id = ? AND number = ?").bind(row.id, number).first<Invoice>();
  if (!invoice) notFound();
  return (
    <main className="dv-wrap inv-wrap">
      <div className="dv-toolbar">
        <span>{invoice.kind === "avoir" ? "Avoir" : "Facture"} {invoice.number} — {row.client_name}{invoice.status === "brouillon" ? " · brouillon" : ""}</span>
        <div className="dv-toolbar-actions">
          <InvoicePrintButton fileName={invoiceFileName(row, invoice)} label={invoice.kind === "avoir" ? "Télécharger l’avoir en PDF" : "Télécharger la facture en PDF"} />
        </div>
      </div>
      <InvoiceDocument invoice={invoice} />
    </main>
  );
}
