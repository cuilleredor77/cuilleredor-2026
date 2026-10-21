// Facture / avoir Cuillère d'Or : mentions obligatoires d'une entreprise individuelle en franchise de TVA.
import { formatDateFR, formatDateShort, formatEUR, type RequestRow } from "../../lib/quote";
import { invoiceTotals, parseInvoice, type Invoice } from "../../lib/invoice";
import { BankDetails } from "./document";

export default function InvoiceDocument({ row, invoice }: { row: RequestRow; invoice: Invoice }) {
  const data = parseInvoice(invoice);
  const t = invoiceTotals(data);
  const avoir = invoice.kind === "avoir";
  const doc = avoir ? "Avoir" : "Facture";
  return (
    <div className="dv-doc">
      <style>{`@media print { @page { @top-left { content: "Cuillère d’Or — ${doc} ${invoice.number}"; font: 9px Arial, sans-serif; color: #6b6b6b; } @bottom-right { content: "Page " counter(page) " / " counter(pages); font: 9px Arial, sans-serif; color: #6b6b6b; } } }`}</style>
      <section className="dv-page">
        <header className="dv-head">
          <div className="dv-brand">
            <img src="/logo-cuillere-dor-800.png" alt="Cuillère d’Or" width={220} />
            <p>Huguette MVUNDA-KILOLA EI — Cuillère d’Or<br />8 Allée des Bois, 77240 Vert-Saint-Denis<br />Tél : 07 83 74 89 71 · contact@cuilleredor.fr<br />SIREN 889 933 800 · SIRET 889 933 800 00019 · APE 5621Z</p>
          </div>
          <table className="dv-client">
            <thead><tr><th colSpan={2}>{doc.toUpperCase()} N° {invoice.number}</th></tr></thead>
            <tbody>
              <tr><th>Date d’émission :</th><td>{formatDateShort(invoice.issued_on)}</td></tr>
              {invoice.ref_number ? <tr><th>Facture d’origine :</th><td>{invoice.ref_number}</td></tr> : null}
              <tr><th>Client :</th><td>{data.client.name}</td></tr>
              {data.client.address ? <tr><th>Adresse :</th><td style={{ whiteSpace: "pre-line" }}>{data.client.address}</td></tr> : null}
              {data.client.extra ? <tr><th>Identification :</th><td>{data.client.extra}</td></tr> : null}
              {data.client.email ? <tr><th>Email :</th><td>{data.client.email}</td></tr> : null}
              {data.client.phone ? <tr><th>Téléphone :</th><td>{data.client.phone}</td></tr> : null}
            </tbody>
          </table>
        </header>

        <h2 className="dv-h2 dv-center">{data.title}</h2>
        {data.event.date || data.event.place ? (
          <p className="dv-sum">
            <b>Prestation :</b> {data.event.type}{data.event.date ? ` du ${formatDateFR(data.event.date, true)}` : ""}{data.event.place ? ` — ${data.event.place}` : ""}
          </p>
        ) : null}

        <table className="dv-lines dv-inv">
          <colgroup><col /><col style={{ width: "15%" }} /><col style={{ width: "14%" }} /><col style={{ width: "15%" }} /></colgroup>
          <thead><tr><th>Désignation</th><th className="r">Qté</th><th className="r">Prix unitaire</th><th className="r">Total</th></tr></thead>
          <tbody>
            {data.lines.map((l, i) => (
              <tr key={i}>
                <td><b>{l.label}</b>{l.detail ? <div className="dv-inv-detail">{l.detail}</div> : null}</td>
                <td className="r">{l.qty.toLocaleString("fr-FR")} {l.unit}</td>
                <td className="r">{formatEUR(l.price)}</td>
                <td className="r b">{formatEUR(l.qty * l.price)}</td>
              </tr>
            ))}
            {data.deductions.length ? (
              <>
                <tr className="dv-total"><td colSpan={3}>Total des prestations</td><td className="r">{formatEUR(t.gross)}</td></tr>
                {data.deductions.map((d, i) => (
                  <tr key={`d${i}`}><td colSpan={3}>{d.label}</td><td className="r">− {formatEUR(d.amount)}</td></tr>
                ))}
              </>
            ) : null}
          </tbody>
        </table>
        <div className="dv-totalbar"><span>{avoir ? "MONTANT DE L’AVOIR" : data.deductions.length ? "NET À PAYER" : "TOTAL À PAYER"}</span><span>{formatEUR(t.net)}</span></div>
        <p className="dv-sum" style={{ textAlign: "right", fontSize: 12 }}>Montant net — TVA non applicable, art. 293 B du CGI</p>

        {invoice.paid_on ? <p className="dv-sum"><b>✓ {avoir ? "Remboursé" : "Payée"} le {formatDateFR(invoice.paid_on)}.</b></p> : null}
        {data.note ? <p className="dv-sum" style={{ whiteSpace: "pre-line" }}>{data.note}</p> : null}

        {!avoir && !invoice.paid_on ? (
          <>
            <p className="dv-conditions"><b>Règlement</b> — {data.dueOn ? `à régler au plus tard le ${formatDateFR(data.dueOn)}` : "à réception de la facture"}, par virement (coordonnées ci-dessous), chèque ou espèces dans la limite légale.</p>
            <BankDetails row={row} lang="fr" />
          </>
        ) : null}
        <p className="dv-conditions" style={{ fontSize: 10.5, color: "#555" }}>
          Pas d’escompte pour paiement anticipé. En cas de retard de paiement, des pénalités sont exigibles au taux de trois fois le taux d’intérêt légal
          {data.client.extra ? ", ainsi qu’une indemnité forfaitaire de 40 € pour frais de recouvrement (clients professionnels)" : ""}.
        </p>
        <footer className="dv-foot">Cuillère d’Or — Huguette MVUNDA-KILOLA EI — 8 Allée des Bois, 77240 Vert-Saint-Denis — SIRET 889 933 800 00019 — contact@cuilleredor.fr — 07 83 74 89 71 — TVA non applicable (art. 293 B du CGI)</footer>
      </section>
    </div>
  );
}
