// Avenant au contrat Cuillère d'Or : modifications depuis la version signée, nouveau total, règlement, signatures.
import {
  amendmentChanges,
  computeTotals,
  formatDateFR,
  formatDateShort,
  formatEUR,
  parseQuote,
  parseSnapshot,
  type Amendment,
  type RequestRow,
} from "../../lib/quote";
import { PaymentSchedule } from "./document";

const KIND: Record<string, string> = { info: "Information", ajout: "Ajout", retrait: "Retrait", modif: "Modification" };

export default function AmendmentDocument({ row, amendment }: { row: RequestRow; amendment: Amendment }) {
  const before = parseSnapshot(amendment.before_json)!;
  const after = parseSnapshot(amendment.after_json)!;
  const signed = parseSnapshot(row.signed_snapshot) || before;
  const changes = amendmentChanges(before, after);
  const previous = computeTotals(before.quote, before.event_date).total;
  // Le règlement suit le contrat signé : même acompte, solde recalculé sur le nouveau total.
  const contract = computeTotals(signed.quote, signed.event_date, row.service_mode);
  const next = computeTotals({ ...after.quote, issuedOn: signed.quote.issuedOn }, after.event_date, row.service_mode);
  const diff = next.total - previous;
  // Paiements : ceux de la fiche telle qu’elle est aujourd’hui (dates de réception et de confirmation).
  const current = parseQuote(row);
  const signedOn = formatDateFR(signed.at.slice(0, 10));
  const issued = formatDateFR(amendment.created_at.slice(0, 10));
  const eventDate = after.event_date ? formatDateShort(after.event_date) : "";

  return (
    <div className="dv-doc">
      <style>{`@media print { @page { @top-left { content: "Cuillère d’Or — ${row.client_name.replace(/["\\]/g, "")} — Avenant n°${amendment.number}"; font: 9px Arial, sans-serif; color: #6b6b6b; } @bottom-right { content: "Page " counter(page) " / " counter(pages); font: 9px Arial, sans-serif; color: #6b6b6b; } } }`}</style>
      <section className="dv-page">
        <header className="dv-head">
          <div className="dv-brand">
            <img src="/logo-cuillere-dor-800.png" alt="Cuillère d’Or" width={220} />
            <p>8 Allée des Bois, 77240 Vert-Saint-Denis<br />Tél : 07 83 74 89 71<br />contact@cuilleredor.fr<br />SIRET : 889 933 800 00019</p>
          </div>
          <table className="dv-client">
            <thead><tr><th colSpan={2}>AVENANT POUR</th></tr></thead>
            <tbody>
              <tr><th>Nom du client :</th><td>{row.client_name}</td></tr>
              <tr><th>Téléphone :</th><td>{row.client_phone}</td></tr>
              <tr><th>Email :</th><td>{row.client_email}</td></tr>
              <tr><th>Date de l’événement :</th><td>{eventDate}</td></tr>
              <tr><th>Lieu :</th><td>{after.event_place}</td></tr>
              <tr><th>Type :</th><td>{after.event_type}</td></tr>
            </tbody>
          </table>
        </header>

        <h2 className="dv-h2 dv-center">AVENANT N°{amendment.number} AU CONTRAT DE PRESTATION TRAITEUR</h2>
        <p className="dv-sum">
          Le présent avenant modifie le devis et contrat de prestation traiteur conclu entre Cuillère d’Or et {row.client_name}
          {signed.at ? <> (version signée enregistrée le {signedOn})</> : null}
          {amendment.number > 1 ? <>, tel que modifié par {amendment.number === 2 ? "l’avenant n°1" : `les avenants n°1 à ${amendment.number - 1}`}</> : null}.
        </p>
        {amendment.reason ? <p className="dv-sum"><b>Objet :</b> {amendment.reason}</p> : null}

        <p className="dv-conditions"><b>Modifications</b></p>
        <table className="dv-lines dv-amend">
          <thead><tr><th>Élément modifié</th><th>Avant</th><th>Après</th><th className="r">Écart financier</th></tr></thead>
          <tbody>
            {changes.map((c, i) => (
              <tr key={i}>
                <td className="b">{c.label}{c.kind === "ajout" || c.kind === "retrait" ? <span className={`dv-tag dv-tag-${c.kind}`}>{KIND[c.kind]}</span> : null}</td>
                <td className="dv-old">{c.before}</td>
                <td className="dv-new">{c.after}</td>
                <td className="r b">{c.kind === "info" ? <span className="dv-muted">—</span> : `${c.delta > 0 ? "+" : ""}${formatEUR(c.delta)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="dv-amend-sum">
          <tbody>
            <tr>
              <td><small>Total avant avenant</small><b>{formatEUR(previous)}</b></td>
              <td><small>Écart financier</small><b>{diff > 0 ? "+" : ""}{formatEUR(diff)}</b></td>
              <td className="dv-amend-new"><small>Nouveau total</small><b>{formatEUR(next.total)}</b></td>
            </tr>
          </tbody>
        </table>

        <p className="dv-conditions"><b>Échéancier de paiement</b></p>
        <PaymentSchedule
          rows={contract.fullAtSignature
            ? [
                { label: "Règlement à la signature du contrat", amount: contract.total, due: "À la signature du contrat", match: /acompte|r[èe]glement|solde/i },
                ...(diff > 0 ? [{ label: `Complément (avenant n°${amendment.number})`, amount: diff, due: "À la signature de l’avenant", match: /compl[ée]ment/i }] : []),
              ]
            : [
                { label: "Acompte (30 %)", amount: contract.deposit, due: "À la signature du contrat", match: /acompte/i },
                { label: "Nouveau solde", amount: Math.max(0, next.total - contract.deposit), due: next.balanceDue ? `Au plus tard le ${formatDateFR(next.balanceDue)}` : "2 mois avant l’événement", match: /solde/i },
              ]}
          payments={current.payments}
          caution={contract.caution}
          cautionDue={contract.fullAtSignature ? "Avec le règlement" : next.balanceDue ? `Avec le solde (${formatDateFR(next.balanceDue)})` : "Avec le solde"}
        />
        {contract.fullAtSignature && diff < 0 ? <p className="dv-sum">{formatEUR(-diff)} vous seront remboursés ou déduits d’une prochaine facture.</p> : null}
        <p className="dv-sum">Toutes les autres clauses du contrat initial restent inchangées et continuent de s’appliquer.</p>

        <div className="dv-sign">
          <div>
            <p>Avenant émis le {issued}</p>
            <p>Signature Cuillère d’Or :</p>
            <img className="dv-stamp" src="/logo-cuillere-dor-800.png" alt="Cuillère d’Or" width={150} />
            <p className="dv-signname">Huguette MVUNDA KILOLA</p>
          </div>
          <div>
            <p>Signé le : ______________</p>
            <p>Signature client(s), précédée de « Bon pour accord » : {row.client_name}</p>
            <div className="dv-box" />
          </div>
        </div>
        <footer className="dv-foot">Cuillère d’Or — 8 Allée des Bois, 77240 Vert-Saint-Denis — SIRET 889 933 800 00019 — contact@cuilleredor.fr — 07 83 74 89 71 — TVA non applicable (art. 293 B du CGI)</footer>
      </section>
    </div>
  );
}
