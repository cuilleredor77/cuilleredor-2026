// Facture / avoir Cuillère d'Or, sur le modèle FAC-2026-020 : bandeau sombre, émetteur / facturé à, objet, totaux,
// encadré de statut (acompte, à régler, soldée) et modalités de paiement. Micro-entreprise : TVA non applicable (art. 293 B du CGI).
import { formatDateFR, formatEUR } from "../../lib/quote";
import { invoiceTotals, parseInvoice, type Invoice } from "../../lib/invoice";

const fmtQty = (n: number) => String(n).replace(".", ",");

export default function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const data = parseInvoice(invoice);
  const t = invoiceTotals(data);
  const avoir = invoice.kind === "avoir";
  const acompte = invoice.kind === "acompte";
  const paid = Boolean(invoice.paid_on);
  const doc = avoir ? "AVOIR" : "FACTURE";
  const subject = data.subject || [/prestation/i.test(data.event.type) ? data.event.type : `Prestation traiteur — ${data.event.type}`, data.event.date ? formatDateFR(data.event.date, true) : "", data.event.place].filter(Boolean).join(" — ");
  const addressLines = (data.client.address || "").split(/\n|,\s*(?=\d{5})/).map((l) => l.trim()).filter(Boolean);

  // Encadré de statut : avoir, soldée (date de paiement renseignée), acompte à régler, ou facture à régler.
  const status = avoir
    ? { badge: "AVOIR", tone: "avoir", text: <>{`Avoir${invoice.ref_number ? ` sur la facture ${invoice.ref_number}` : ""} : ${formatEUR(Math.abs(t.net))} ${paid ? `remboursés le ${formatDateFR(invoice.paid_on)}` : "à rembourser ou à déduire d’une prochaine facture"}.`}</> }
    : paid
      ? { badge: "SOLDÉE", tone: "paid", text: <>Facture réglée le <b>{formatDateFR(invoice.paid_on)}</b>{acompte ? <> (acompte de {formatEUR(t.net)}){data.remaining ? <>. Reste à régler ultérieurement : {formatEUR(data.remaining)}{data.dueOn ? <> (facture de solde à venir, au plus tard le {formatDateFR(data.dueOn)})</> : null}</> : null}</> : null}. Merci pour votre confiance.</> }
      : acompte
        ? { badge: "ACOMPTE", tone: "due", text: <>{data.portion?.label.replace(/^Acompte facturé/, "Acompte") || "Acompte"} à régler à la signature du contrat{data.event.date ? `, afin de bloquer la date du ${formatDateFR(data.event.date)}` : ""}.{data.remaining ? <> Reste à régler ultérieurement : {formatEUR(data.remaining)} (facture de solde à venir{data.dueOn ? `, au plus tard le ${formatDateFR(data.dueOn)}` : ""}).</> : null}</> }
        : { badge: "À RÉGLER", tone: "due", text: <>Montant de {formatEUR(t.net)} à régler {data.dueOn ? <>au plus tard le <b>{formatDateFR(data.dueOn)}</b></> : "à réception de la facture"}.</> };

  return (
    <div className="inv-doc">
      <style>{`@media print { @page { size: A4; margin: 0; } }`}</style>
      <section className="inv-page">
        <header className="inv-head">
          <img src="/logo-cuillere-dor-800.png" alt="Cuillère d’Or" />
          <div className="inv-head-r">
            <small>{doc}</small>
            <strong>{invoice.number}</strong>
            <span>Émise le {formatDateFR(invoice.issued_on)}</span>
          </div>
        </header>

        <div className="inv-body">
          <div className="inv-parties">
            <div className="inv-box">
              <small>ÉMETTEUR</small>
              <b>Cuillère d’Or</b>
              <span>Huguette MVUNDA-KILOLA EI</span>
              <span>8 Allée des Bois</span>
              <span>77240 Vert-Saint-Denis</span>
              <span>SIRET 889 933 800 00019</span>
              <span>contact@cuilleredor.fr — 07 83 74 89 71</span>
            </div>
            <div className="inv-box inv-box-dark">
              <small>FACTURÉ À</small>
              <b>{data.client.name}</b>
              {addressLines.map((l, i) => <span key={i}>{l}</span>)}
              {data.client.extra ? <span>{data.client.extra}</span> : null}
              {data.client.attention ? <span>À l’attention de {data.client.attention}</span> : null}
              {!addressLines.length && data.client.email ? <span>{data.client.email}</span> : null}
              {!addressLines.length && data.client.phone ? <span>{data.client.phone}</span> : null}
            </div>
          </div>

          <p className="inv-subject"><b>Objet :</b> {subject}</p>

          <table className="inv-lines">
            <thead><tr><th>DESCRIPTION</th><th className="r">QTÉ / PU</th><th className="r">MONTANT</th></tr></thead>
            <tbody>
              {data.lines.map((l, i) => (
                <tr key={i}>
                  <td>{l.label}{l.detail ? <small>{l.detail}</small> : null}</td>
                  <td className="r">{l.qty === 1 && /forfait/i.test(l.unit) ? "forfait" : `${fmtQty(l.qty)} ${l.unit} × ${formatEUR(l.price)}`}</td>
                  <td className="r">{formatEUR(l.qty * l.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="inv-totals">
            <tbody>
              <tr><td>Montant total TTC</td><td className="r">{formatEUR(t.gross)}</td></tr>
              <tr><td>TVA</td><td className="r">0,00 €</td></tr>
              <tr className="inv-ttc"><td>Total TTC</td><td className="r">{formatEUR(t.gross)}</td></tr>
              {data.deductions.map((d, i) => <tr key={i}><td>{d.label}</td><td className="r">− {formatEUR(d.amount)}</td></tr>)}
              {data.portion ? <tr><td>{data.portion.label}</td><td className="r">{formatEUR(data.portion.amount)}</td></tr> : null}
              <tr className="inv-due"><td>{avoir ? "Montant de l’avoir" : "Montant de cette facture"}</td><td className="r">{formatEUR(t.net)}</td></tr>
            </tbody>
          </table>

          <div className={`inv-status inv-${status.tone}`}>
            <span className="inv-badge">{status.badge}</span>
            <p>{status.text}</p>
          </div>
          {data.note ? <p className="inv-note">{data.note}</p> : null}

          {!paid && !avoir ? (
            <>
              <p className="inv-label">MODALITÉS DE PAIEMENT</p>
              <div className="inv-box inv-pay">
                <span><b>Virement bancaire</b> — IBAN : FR76 1695 8000 0103 6634 1336 613 · BIC QNTOFRP1XXX</span>
                <span><b>Espèces</b> — sur rendez-vous, 8 Allée des Bois, 77240 Vert-Saint-Denis</span>
              </div>
            </>
          ) : null}
          {data.client.extra && !avoir ? (
            <p className="inv-fine">Pas d’escompte pour paiement anticipé. En cas de retard de paiement : pénalités au taux de trois fois le taux d’intérêt légal et indemnité forfaitaire de 40 € pour frais de recouvrement.</p>
          ) : null}
        </div>

        <footer className="inv-foot">
          <span><b>Cuillère d’Or</b> — 8 Allée des Bois, 77240 Vert-Saint-Denis — SIRET 889 933 800 00019</span>
          <span>contact@cuilleredor.fr — 07 83 74 89 71 — Entreprise individuelle – micro-entreprise</span>
          <span>TVA non applicable – article 293B du CGI</span>
        </footer>
      </section>
    </div>
  );
}
