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
import { PaymentsTable } from "./document";

const KIND: Record<string, string> = { info: "Information", ajout: "Ajout", retrait: "Retrait", modif: "Modification" };

export default function AmendmentDocument({ row, amendment }: { row: RequestRow; amendment: Amendment }) {
  const before = parseSnapshot(amendment.before_json)!;
  const after = parseSnapshot(amendment.after_json)!;
  const signed = parseSnapshot(row.signed_snapshot) || before;
  const changes = amendmentChanges(before, after);
  const previous = computeTotals(before.quote, before.event_date).total;
  // Le règlement suit le contrat signé : même acompte, solde recalculé sur le nouveau total.
  const contract = computeTotals(signed.quote, signed.event_date);
  const next = computeTotals({ ...after.quote, issuedOn: signed.quote.issuedOn }, after.event_date);
  const diff = next.total - previous;
  // Paiements : ceux de la fiche telle qu’elle est aujourd’hui (dates de réception et de confirmation).
  const current = parseQuote(row);
  const deposit = (current.payments || []).find((p) => /acompte/i.test(p.label));
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

        <table className="dv-lines dv-amend">
          <thead><tr><th>Type</th><th>Prestation</th><th>Avant</th><th>Après</th><th className="r">Écart financier</th></tr></thead>
          <tbody>
            {changes.map((c, i) => (
              <tr key={i}>
                <td className="dv-kind">{KIND[c.kind]}</td>
                <td>{c.label}</td>
                <td>{c.before}</td>
                <td>{c.after}</td>
                <td className="r b">{c.kind === "info" ? "" : `${c.delta > 0 ? "+" : ""}${formatEUR(c.delta)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="dv-terms">
          <li><b>Total avant avenant</b><span>{formatEUR(previous)}</span></li>
          <li><b>Écart financier</b><span>{diff > 0 ? "+" : ""}{formatEUR(diff)}</span></li>
        </ul>
        <div className="dv-totalbar"><span>NOUVEAU TOTAL</span><span>{formatEUR(next.total)}</span></div>

        <p className="dv-conditions"><b>Règlement</b></p>
        <ul className="dv-terms">
          {contract.fullAtSignature
            ? <li><b>Complément</b><span>{diff >= 0
                ? `${formatEUR(diff)} à régler à la signature du présent avenant.`
                : `${formatEUR(-diff)} vous seront remboursés ou déduits d’une prochaine facture.`}</span></li>
            : <>
                <li><b>Acompte</b><span>{formatEUR(contract.deposit)}, inchangé{deposit?.receivedOn ? ` (reçu le ${formatDateFR(deposit.receivedOn)}${deposit.confirmedOn ? `, réception confirmée le ${formatDateFR(deposit.confirmedOn)}` : ""})` : " (versé à la signature du contrat)"}</span></li>
                <li><b>Nouveau solde</b><span>{formatEUR(Math.max(0, next.total - contract.deposit))}{next.balanceDue ? ` au plus tard le ${formatDateFR(next.balanceDue)}` : ""}, accompagné de la caution de {formatEUR(contract.caution)} (restituée si aucun retard constaté)</span></li>
              </>}
          <li><b>Autres clauses</b><span>Toutes les autres clauses du contrat initial restent inchangées et continuent de s’appliquer.</span></li>
        </ul>

        <PaymentsTable quote={current} total={next.total} />

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
