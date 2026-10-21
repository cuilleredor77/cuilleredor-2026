import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { checkApprovalKey, getRequestByToken } from "../../../lib/server";
import { computeTotals, formatDateFR, formatDateShort, formatEUR, parseQuote, quoteAlerts } from "../../../lib/quote";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Envoyer le devis — Cuillère d’Or",
  robots: { index: false, follow: false },
};

const box = { maxWidth: 560, margin: "40px auto", padding: "28px 24px", fontFamily: "Arial, sans-serif", lineHeight: 1.5, color: "#1a1a1a", background: "#fff", border: "1px solid #d1c5b4", borderRadius: 10 } as const;
const gold = { display: "inline-block", minHeight: 48, padding: "12px 24px", border: 0, borderRadius: 6, background: "#d4ae2a", color: "#0a0a0a", font: "inherit", fontWeight: 700, cursor: "pointer" } as const;

export default async function SendPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ k?: string; etat?: string }>;
}) {
  const { token } = await params;
  const { k = "", etat = "" } = await searchParams;
  if (!/^[a-f0-9]{36}$/.test(token) || !(await checkApprovalKey(token, k))) notFound();
  const row = await getRequestByToken(token);
  if (!row || !row.quote_json) notFound();
  const quote = parseQuote(row);
  const totals = computeTotals(quote, row.event_date, row.service_mode);
  const alerts = quoteAlerts(row, quote, totals);

  return (
    <main style={{ background: "#f6f1e7", minHeight: "100vh", padding: "1px 16px" }}>
      <div style={box}>
        <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "1.5rem", margin: "0 0 12px" }}>
          Devis de {row.client_name}
        </h1>
        <p style={{ margin: "0 0 4px" }}>
          {row.event_type} le {row.event_date ? formatDateFR(row.event_date, true) : "?"}
          {row.event_place ? ` à ${row.event_place}` : ""}
        </p>
        <p style={{ margin: "0 0 4px" }}>{quote.summary}</p>
        <p style={{ margin: "0 0 16px" }}><b>Total : {formatEUR(totals.total)}</b> · envoi à {row.client_email}</p>

        {row.sent_at || etat === "envoye" || etat === "deja" ? (
          <p style={{ padding: 14, background: "#eef7ee", border: "1px solid #9cc79c", borderRadius: 6 }}>
            ✅ Devis envoyé au client{row.sent_at ? ` le ${formatDateShort(row.sent_at)}` : ""}. Une copie est dans ta boîte mail.
          </p>
        ) : (
          <>
            {etat === "erreur" && (
              <p style={{ padding: 14, background: "#fbeeee", border: "1px solid #e3b4b4", borderRadius: 6 }}>
                L’envoi a échoué. Réessaie dans un instant, ou ouvre l’éditeur pour l’envoyer par Gmail.
              </p>
            )}
            {alerts.length > 0 && (
              <div style={{ padding: 14, background: "#fff7e0", border: "1px solid #e9c83e", borderRadius: 6, marginBottom: 16 }}>
                <b>À vérifier avant d’envoyer</b>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {alerts.map((a) => <li key={a}>{a}</li>)}
                </ul>
              </div>
            )}
            <form method="post" action="/api/envoyer">
              <input type="hidden" name="t" value={token} />
              <input type="hidden" name="k" value={k} />
              <button type="submit" style={gold}>Envoyer le devis au client</button>
            </form>
          </>
        )}
        <p style={{ marginTop: 18 }}>
          <a href={`/devis/${token}`} target="_blank" rel="noreferrer">Voir le devis</a> ·{" "}
          <a href={`/admin/${row.id}`}>Modifier dans l’espace privé</a>
        </p>
      </div>
    </main>
  );
}
