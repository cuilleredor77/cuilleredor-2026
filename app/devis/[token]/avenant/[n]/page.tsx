import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db, getRequestByToken } from "../../../../../lib/server";
import { amendmentFileName, type Amendment } from "../../../../../lib/quote";
import AmendmentDocument from "../../../amendment";
import { AmendmentPrintButton } from "../../../print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Avenant — Cuillère d’Or",
  robots: { index: false, follow: false },
};

export default async function AmendmentPage({ params }: { params: Promise<{ token: string; n: string }> }) {
  const { token, n } = await params;
  if (!/^[a-f0-9]{36}$/.test(token) || !/^\d+$/.test(n)) notFound();
  const row = await getRequestByToken(token);
  if (!row) notFound();
  const amendment = await db().prepare("SELECT * FROM amendments WHERE request_id = ? AND number = ?").bind(row.id, Number(n)).first<Amendment>();
  if (!amendment) notFound();
  return (
    <main className="dv-wrap">
      <div className="dv-toolbar">
        <span>Avenant n°{amendment.number} — {row.client_name}</span>
        <div className="dv-toolbar-actions">
          <AmendmentPrintButton fileName={amendmentFileName(row, amendment.number)} />
        </div>
      </div>
      <AmendmentDocument row={row} amendment={amendment} />
    </main>
  );
}
