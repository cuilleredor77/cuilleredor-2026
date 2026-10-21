// Document « Devis + Contrat » Cuillère d'Or (rendu HTML imprimable en PDF), en français ou en anglais.
import { Fragment } from "react";
import {
  computeTotals,
  formatDateShort,
  isTravelPending,
  isIncluded,
  isLodgingPending,
  lineTotal,
  parseQuote,
  type RequestRow,
  clientRemarks,
  round2,
  parisDateTimeFR,
  parseSignature,
  type Payment,
  type Quote,
  type Signature,
  type Totals,
} from "../../lib/quote";
import { autoEn, dateText, dateTimeText, eventTypeText, guestsLine, lineDetail, lineLabel, money, textIn, unitText, type Lang } from "../../lib/devis-en";

const COMPLEMENTARY: Record<Lang, Array<{ title: string; rows: Array<[string, string]> }>> = {
  fr: [
    { title: "Restauration", rows: [["Menu enfants (5 à 12 ans)", "25 €/pers."], ["Menu prestataires", "30 €/pers."], ["Viande ou poisson en plus", "5 €/pers."], ["Entrée ou dessert en plus (service à l’assiette)", "5 €/pers."]] },
    { title: "Boissons", rows: [["Forfait soft et eau (Coca-Cola, Fanta, Oasis, eau plate et gazeuse)", "5 €/pers."], ["Cocktails signature (1 litre pour environ 4 convives)", "10 €/litre"], ["Service des boissons toute la soirée", "160 €/serveur"]] },
    { title: "Événementiel", rows: [["Présentation, découpe et service du gâteau", "150 € forfait"], ["Wedding cake (partenaire Love Lo Cake)", "dès 6,50 €/part"], ["Assiette de fromages avant le dessert", "9 €/pers."]] },
    { title: "Vaisselle & linge", rows: [["Kit vaisselle Essentiel — 2 assiettes, verre à eau, verre à vin, couverts", "7 €/kit"], ["Kit vaisselle Complet — 3 assiettes, verres eau, vin et champagne, couverts", "10 €/kit"], ["Kit vaisselle Prestige — Kit Complet + sous-plat perlé", "13 €/kit"], ["Serviettes en tissu", "2 €/pers."], ["Sous-plat perlé", "3 €/unité"]] },
    { title: "Mobilier & matériel", rows: [["Mange-debout (avec housse et nappe)", "15 €/unité"], ["Réchaud de buffet (chafing dish)", "25 €/unité"], ["Étuve professionnelle", "150 € forfait"], ["Camion frigorifique", "location + km"]] },
    { title: "Services", rows: [["Installation complète (mise en place du lieu et du matériel)", "150 € forfait"], ["Dressage des tables (compris si vaisselle louée avec la cheffe)", "250 € forfait"], ["Maître d’hôtel", "160 € forfait"], ["Gestion des déchets alimentaires", "50 € forfait"]] },
    { title: "Prestataires partenaires", rows: [["Photographe · Vidéaste · DJ · Décorateur · Wedding planner", "sur devis"]] },
    { title: "Avant l’événement", rows: [["Dégustation au restaurant Chez Lina (sur rendez-vous, non déductible du devis)", "70 €/pers."]] },
  ],
  en: [
    { title: "Catering", rows: [["Children’s menu (ages 5–12)", "€25/guest"], ["Vendor meals", "€30/guest"], ["Additional meat or fish", "€5/guest"], ["Additional starter or dessert (plated service)", "€5/guest"]] },
    { title: "Drinks", rows: [["Soft drinks and water package (Coca-Cola, Fanta, Oasis, still and sparkling water)", "€5/guest"], ["Signature cocktails (1 litre for about 4 guests)", "€10/litre"], ["Beverage service throughout the evening", "€160/server"]] },
    { title: "Event services", rows: [["Presentation, cutting and serving of the cake", "€150 flat fee"], ["Wedding cake (partner Love Lo Cake)", "from €6.50/slice"], ["Cheese plate before dessert", "€9/guest"]] },
    { title: "Tableware & linen", rows: [["Essential tableware kit — 2 plates, water glass, wine glass, cutlery", "€7/kit"], ["Complete tableware kit — 3 plates, water, wine and champagne glasses, cutlery", "€10/kit"], ["Prestige tableware kit — Complete kit + beaded charger plate", "€13/kit"], ["Cloth napkins", "€2/guest"], ["Beaded charger plate", "€3/unit"]] },
    { title: "Furniture & equipment", rows: [["Cocktail table (with cover and cloth)", "€15/unit"], ["Chafing dish", "€25/unit"], ["Professional food warmer", "€150 flat fee"], ["Refrigerated truck", "rental + km"]] },
    { title: "Services", rows: [["Full set-up (venue and equipment)", "€150 flat fee"], ["Table setting (included when tableware is rented from the chef)", "€250 flat fee"], ["Maître d’hôtel", "€160 flat fee"], ["Food waste management", "€50 flat fee"]] },
    { title: "Partner vendors", rows: [["Photographer · Videographer · DJ · Decorator · Wedding planner", "on request"]] },
    { title: "Before the event", rows: [["Tasting at Chez Lina restaurant (by appointment, not deductible from the quote)", "€70/guest"]] },
  ],
};

const fmtQty = (n: number, lang: Lang = "fr") => (lang === "fr" ? String(n).replace(".", ",") : String(n));

// Regroupe le détail d'une ligne (« Titre : · 1. a · 2. b · Autre titre : · … ») en blocs titre + liste.
function groupDetail(parts: string[]) {
  const groups: Array<{ title: string; items: string[]; numbered: boolean }> = [];
  for (const part of parts) {
    if (/ ?:$/.test(part)) { groups.push({ title: part, items: [], numbered: false }); continue; }
    if (!groups.length) groups.push({ title: "", items: [], numbered: false });
    const g = groups[groups.length - 1];
    const m = /^\d+\.\s*(.*)$/.exec(part);
    if (m) g.numbered = true;
    g.items.push(m ? m[1] : part);
  }
  return groups.filter((g) => g.title || g.items.length);
}

export type ScheduleRow = { label: string; amount: number; due: string; match: RegExp };

/** Échéancier : chaque paiement avec son échéance et son statut (reçu / confirmé), puis la caution à part. */
export function PaymentSchedule({ rows, payments = [], caution, cautionDue, lang = "fr" }: { rows: ScheduleRow[]; payments?: Payment[]; caution: number; cautionDue: string; lang?: Lang }) {
  const en = lang === "en";
  const used = new Set<string>();
  const find = (re: RegExp) => { const p = payments.find((x) => !used.has(x.id) && re.test(x.label)); if (p) used.add(p.id); return p; };
  const status = (p?: Payment) => p
    ? <span className="dv-paid">✓ {en ? "Received on" : "Reçu le"} {p.receivedOn ? dateText(p.receivedOn, lang) : "—"}{p.confirmedOn ? <><br />{en ? "confirmed on" : "confirmé le"} {dateText(p.confirmedOn, lang)}</> : null}</span>
    : <span className="dv-due">{en ? "To be paid" : "À régler"}</span>;
  const lines = rows.map((r) => ({ ...r, paid: find(r.match) }));
  const cautionPaid = find(/caution/i);
  const extra = payments.filter((p) => !used.has(p.id));
  const total = round2(lines.reduce((sum, l) => sum + l.amount, 0));
  const received = round2(lines.reduce((sum, l) => sum + (l.paid ? l.paid.amount : 0), 0) + extra.reduce((sum, p) => sum + p.amount, 0));
  return (
    <>
      <table className="dv-lines dv-sched">
        <thead><tr><th>{en ? "Instalment" : "Échéance"}</th><th className="r">{en ? "Amount" : "Montant"}</th><th>{en ? "Due" : "À régler"}</th><th>{en ? "Status" : "Statut"}</th></tr></thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.label}><td className="b">{l.label}</td><td className="r b">{money(l.amount, lang)}</td><td>{l.due}</td><td>{status(l.paid)}</td></tr>
          ))}
          {extra.map((p) => (
            <tr key={p.id}><td className="b">{p.label || (en ? "Payment" : "Paiement")}</td><td className="r b">{money(p.amount, lang)}</td><td>—</td><td>{status(p)}</td></tr>
          ))}
          {received ? <tr className="dv-sched-sum"><td>{en ? "Balance outstanding" : "Reste à régler"}</td><td className="r">{money(Math.max(0, total - received), lang)}</td><td colSpan={2}>{en ? "of" : "sur"} {money(total, lang)} · {en ? "already received:" : "déjà reçu :"} {money(received, lang)}</td></tr> : null}
        </tbody>
      </table>
      {caution ? <table className="dv-lines dv-sched dv-caution">
        <tbody>
          <tr><td className="b">{en ? "Security deposit" : "Caution"}<br /><small>{en ? "not part of the price, refunded if no delay occurs" : "hors prix, restituée si aucun retard"}</small></td><td className="r b">{money(caution, lang)}</td><td>{cautionDue}</td><td>{cautionPaid ? status(cautionPaid) : <span className="dv-due">{en ? "To be paid" : "À verser"}</span>}</td></tr>
        </tbody>
      </table> : null}
    </>
  );
}

/** Échéances d’un devis pas encore réglé : un encadré par paiement, la caution à part (hors prix). */
export function ScheduleCards({ rows, caution, cautionDue, lang = "fr" }: { rows: ScheduleRow[]; caution: number; cautionDue: string; lang?: Lang }) {
  const en = lang === "en";
  return (
    <div className="dv-paycards">
      {rows.map((r) => (
        <div key={r.label} className="dv-paycard">
          <small>{r.label}</small>
          <b>{money(r.amount, lang)}</b>
          <span>{r.due}</span>
        </div>
      ))}
      {caution ? <div className="dv-paycard dv-paycard-caution">
        <small>{en ? "Security deposit · separate" : "Caution · hors prix"}</small>
        <b>{money(caution, lang)}</b>
        <span>{cautionDue} · {en ? "refundable" : "restituée si aucun retard"}</span>
      </div> : null}
    </div>
  );
}

type Sched = { total: number; deposit: number; balance: number; balanceDue: string; fullAtSignature: boolean };

/** Lignes de l’échéancier d’un devis : acompte + solde, ou règlement intégral à moins de 2 mois. */
export function scheduleRows(totals: Sched, lang: Lang = "fr"): ScheduleRow[] {
  const en = lang === "en";
  return totals.fullAtSignature
    ? [{ label: en ? "Full payment" : "Règlement intégral", amount: totals.total, due: en ? "Upon signature" : "À la signature", match: /acompte|r[èe]glement|solde/i }]
    : [
        { label: en ? "Deposit (30%)" : "Acompte (30 %)", amount: totals.deposit, due: en ? "Upon signature" : "À la signature", match: /acompte/i },
        { label: en ? "Balance (70%)" : "Solde (70 %)", amount: totals.balance, due: totals.balanceDue ? (en ? `No later than ${dateText(totals.balanceDue, lang)}` : `Au plus tard le ${dateText(totals.balanceDue, lang)}`) : (en ? "2 months before the event" : "2 mois avant l’événement"), match: /solde/i },
      ];
}

export const cautionDue = (totals: { fullAtSignature: boolean; balanceDue: string }, lang: Lang = "fr") =>
  lang === "en"
    ? totals.fullAtSignature ? "Upon signature" : totals.balanceDue ? `With the balance (${dateText(totals.balanceDue, lang)})` : "With the balance"
    : totals.fullAtSignature ? "À la signature" : totals.balanceDue ? `Avec le solde (${dateText(totals.balanceDue, lang)})` : "Avec le solde";

const FOOTER: Record<Lang, string> = {
  fr: "Cuillère d’Or — 8 Allée des Bois, 77240 Vert-Saint-Denis — SIRET 889 933 800 00019 — contact@cuilleredor.fr — 07 83 74 89 71 — TVA non applicable (art. 293 B du CGI)",
  en: "Cuillère d’Or — 8 Allée des Bois, 77240 Vert-Saint-Denis, France — SIRET 889 933 800 00019 — contact@cuilleredor.fr — +33 7 83 74 89 71 — VAT not applicable (art. 293 B CGI)",
};

/** Bloc de signature du client (vide, ou signé en ligne). */
function ClientSignature({ row, signed, lang }: { row: RequestRow; signed: Signature | null; lang: Lang }) {
  const en = lang === "en";
  return signed ? <>
    <p>{en ? "Signed on:" : "Signé le :"} {dateTimeText(signed.at, lang, parisDateTimeFR)}</p>
    <p>{en ? "Client signature(s):" : "Signature client(s) :"} {row.client_name}</p>
    <div className="dv-box dv-box-signed">{en ? "Electronically signed by" : "Signé électroniquement par"} <b>{signed.name}</b><br /><small>{en ? "Simple electronic signature · fingerprint" : "Signature électronique simple · empreinte"} {signed.hash.slice(0, 16)}…</small></div>
  </> : <>
    <p>{en ? "Signed on:" : "Signé le :"} ______________</p>
    <p>{en ? "Client signature(s):" : "Signature client(s) :"} {row.client_name}</p>
    <div className="dv-box" />
  </>;
}

export default function QuoteDocument({ row, quoteOnly = false, lang = "fr" }: { row: RequestRow; quoteOnly?: boolean; lang?: Lang }) {
  const en = lang === "en";
  const quote = parseQuote(row);
  // Les anciens devis gardent la formule et le contact dans les remarques : on les filtre aussi à l’affichage.
  const remarksFr = quote.remarks.trim() === "—" ? "" : clientRemarks(quote.remarks);
  const remarks = remarksFr ? textIn(remarksFr, quote.remarksEn, lang) : "";
  const summary = textIn(quote.summary, quote.summaryEn, lang);
  const note = quote.note ? textIn(quote.note, quote.noteEn, lang) : "";
  const totals = computeTotals(quote, row.event_date, row.service_mode);
  const days = (quote.days || []).map((d) => d.trim()).filter(Boolean);
  // Signature en ligne, affichée seulement sur la version du devis qui a été signée.
  const sig = parseSignature(row);
  const signed = sig && sig.version === row.quote_version ? sig : null;
  const eventLong = row.event_date ? dateText(row.event_date, lang, true) : "";
  const issued = dateText(quote.issuedOn, lang);
  const guests = guestsLine(row, lang);
  const eventType = eventTypeText(row.event_type, lang);
  const m = (n: number) => money(n, lang);

  return (
    <div className="dv-doc" lang={lang}>
      <style>{`@media print { @page { @top-left { content: "Cuillère d’Or — ${row.client_name.replace(/["\\]/g, "")}${row.event_date ? " — " + formatDateShort(row.event_date) : ""}"; font: 9px Arial, sans-serif; color: #6b6b6b; } @bottom-right { content: "Page " counter(page) " / " counter(pages); font: 9px Arial, sans-serif; color: #6b6b6b; } } }`}</style>
      {/* ================= DEVIS ================= */}
      <section className="dv-page">
        <header className="dv-head">
          <div className="dv-brand">
            <img src="/logo-cuillere-dor-800.png" alt="Cuillère d’Or" width={220} />
            <p>8 Allée des Bois, 77240 Vert-Saint-Denis{en ? ", France" : ""}<br />{en ? "Tel: +33 7 83 74 89 71" : "Tél : 07 83 74 89 71"}<br />contact@cuilleredor.fr<br />SIRET{en ? ": " : " : "}889 933 800 00019</p>
          </div>
          <table className="dv-client">
            <thead><tr><th colSpan={2}>{en ? "QUOTE FOR" : "DEVIS POUR"}</th></tr></thead>
            <tbody>
              <tr><th>{en ? "Client name:" : "Nom du client :"}</th><td>{row.client_name}</td></tr>
              <tr><th>{en ? "Phone:" : "Téléphone :"}</th><td>{row.client_phone}</td></tr>
              <tr><th>{en ? "Email:" : "Email :"}</th><td>{row.client_email}</td></tr>
              {row.billing_address ? <tr><th>{en ? "Billing:" : "Facturation :"}</th><td>{row.billing_address}</td></tr> : null}
              <tr><th>{en ? "Event date:" : "Date de l’événement :"}</th><td>{row.event_date ? formatDateShort(row.event_date) : ""}</td></tr>
              <tr><th>{en ? "Venue:" : "Lieu :"}</th><td>{row.event_place}</td></tr>
              <tr><th>{en ? "Type:" : "Type :"}</th><td>{eventType}</td></tr>
              <tr><th>{en ? "Guests:" : "Invités :"}</th><td>{guests}</td></tr>
            </tbody>
          </table>
        </header>
        <p className="dv-sum"><b>{en ? "Requested service:" : "Prestation souhaitée :"}</b> {summary}</p>
        {remarks ? <p className="dv-sum dv-remarks"><b>{en ? "Options / notes:" : "Options / remarques :"}</b> {remarks}</p> : null}

        <table className="dv-lines">
          <thead>
            <tr><th>{en ? "Quantity" : "Quantité"}</th><th className="c dv-check" /><th>Description</th><th className="r dv-pu">{en ? "Unit price" : "Prix unitaire"}</th><th className="r">Total</th></tr>
          </thead>
          <tbody>
            {(days.length
              // Plusieurs jours : une section « incluses » (puis « options ») par jour, dans l’ordre des jours.
              ? days.flatMap((day) => {
                  const ofDay = quote.lines.filter((l) => (l.day && days.includes(l.day.trim()) ? l.day.trim() : days[0]) === day);
                  const dayTitle = en ? autoEn(day) : day;
                  return [
                    { title: `${en ? "INCLUDED SERVICES" : "PRESTATIONS INCLUSES"} — ${dayTitle}`, lines: ofDay.filter(isIncluded) },
                    { title: `OPTIONS — ${dayTitle}`, lines: ofDay.filter((l) => !isIncluded(l)) },
                  ];
                })
              : [
                  { title: en ? "INCLUDED SERVICES" : "PRESTATIONS INCLUSES", lines: quote.lines.filter(isIncluded) },
                  { title: "OPTIONS", lines: quote.lines.filter((l) => !isIncluded(l)) },
                ]
            ).filter((sec) => sec.lines.length).map((sec) => (
              <Fragment key={sec.title}>
                <tr className="dv-band"><td colSpan={5}>{sec.title}</td></tr>
                {sec.lines.map((line) => {
                  const detail = lineDetail(line, lang);
                  const parts = detail ? detail.split(" · ") : [];
                  return (
                    <Fragment key={line.id}>
                      <tr className={parts.length ? "dv-has-detail" : undefined}>
                        <td className="c">{isTravelPending(line) || (isLodgingPending(line) && !(line.qty > 0)) ? "—" : `${fmtQty(line.qty, lang)} ${unitText(line.unit, lang)}`}</td>
                        <td className="c dv-check">☑</td>
                        <td>{lineLabel(line, lang)}</td>
                        <td className="r dv-pu">{isLodgingPending(line) ? "—" : `${m(line.price)}${isTravelPending(line) ? "/km" : ""}`}</td>
                        <td className="r b">{isTravelPending(line) || isLodgingPending(line) ? (en ? "to be quoted" : "à chiffrer") : m(lineTotal(line))}</td>
                      </tr>
                      {groupDetail(parts).map((g, i, all) => (
                        <tr key={i} className={`dv-sub dv-sub-group${i === all.length - 1 ? " dv-sub-last" : ""}`}>
                          <td /><td className="dv-check" />
                          <td colSpan={3}>
                            {g.title ? <div className="dv-group-title">{g.title}</div> : null}
                            {g.numbered
                              ? <ol className={`dv-cols${g.items.length > 2 ? " dv-cols-2" : ""}`}>{g.items.map((it, k) => <li key={k}>{it}</li>)}</ol>
                              : <ul className={`dv-cols${g.items.length > 2 ? " dv-cols-2" : ""}`}>{g.items.map((it, k) => <li key={k}>{it}</li>)}</ul>}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
        <div className="dv-totalbar"><span>{en ? "TOTAL" : "TOTAL PRESTATIONS"}</span><span>{m(totals.total)}</span></div>

        <p className="dv-conditions"><b>{en ? "Payment terms" : "Conditions de règlement"}</b></p>
        {quote.payments?.length ? null : <ScheduleCards rows={scheduleRows(totals, lang)} caution={totals.caution} cautionDue={cautionDue(totals, lang)} lang={lang} />}
        {quote.payments?.length ? <PaymentSchedule rows={scheduleRows(totals, lang)} payments={quote.payments} caution={totals.caution} cautionDue={cautionDue(totals, lang)} lang={lang} /> : null}
        {en ? (
          <p className="dv-fineprint">
            <b>Validity:</b> 30 days (until {dateText(totals.validUntil, lang)}); prices and date guaranteed upon signature and {totals.fullAtSignature ? "payment" : "deposit"}.
            {" "}<b>Catalogue:</b> <a href="https://catalogue.cuilleredor.fr/" target="_blank" rel="noopener noreferrer">catalogue.cuilleredor.fr</a>.
            {note ? <><br /><b>Note:</b> {note}</> : null}
          </p>
        ) : (
          <p className="dv-fineprint">
            <b>Validité :</b> 30 jours, jusqu’au {dateText(totals.validUntil, lang)} — tarifs et date garantis après signature et {totals.fullAtSignature ? "règlement" : "acompte"}.
            {" "}<b>Catalogue :</b> formules, menus et services sur <a href="https://catalogue.cuilleredor.fr/" target="_blank" rel="noopener noreferrer">catalogue.cuilleredor.fr</a>.
            {note ? <><br /><b>Remarque :</b> {note}</> : null}
          </p>
        )}

        <div className="dv-sign">
          <div>
            <p>{en ? "Quote issued on" : "Devis émis le"} {issued}</p>
            <p>{en ? "Cuillère d’Or signature:" : "Signature Cuillère d’Or :"}</p>
            <img className="dv-stamp" src="/logo-cuillere-dor-800.png" alt="Cuillère d’Or" width={150} />
            <p className="dv-signname">Huguette MVUNDA KILOLA</p>
          </div>
          <div>
            <ClientSignature row={row} signed={signed} lang={lang} />
          </div>
        </div>
        <footer className="dv-foot">{FOOTER[lang]}</footer>
      </section>

      {/* ================= SERVICES COMPLÉMENTAIRES ================= */}
      {quote.includeComplementary ? (
        <section className="dv-page">
          <h2 className="dv-h2">{en ? "ADDITIONAL SERVICES" : "SERVICES COMPLÉMENTAIRES"}</h2>
          <p>{en ? "These options can be added to your booking. Contact us for any tailored quote." : "Ces options peuvent être ajoutées à votre prestation. Contactez-nous pour tout devis personnalisé."}</p>
          <table className="dv-comp">
            <tbody>
              {COMPLEMENTARY[lang].map((group) => (
                <Fragment key={group.title}>
                  <tr className="dv-band"><td colSpan={2}>{group.title}</td></tr>
                  {group.rows.map(([label, price]) => (
                    <tr key={group.title + label}><td>☐ {label}</td><td className="r">{price}</td></tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
          <p>{en ? "For any question or customisation request: +33 7 83 74 89 71 • contact@cuilleredor.fr" : "Pour toute question ou demande de personnalisation : 07 83 74 89 71 • contact@cuilleredor.fr"}</p>
        </section>
      ) : null}

      {quoteOnly ? null : (
        <section className="dv-page dv-contract">
          {en
            ? <ContractEN row={row} quote={quote} totals={totals} signed={signed} guests={guests} eventLong={eventLong} eventType={eventType} issued={issued} note={note} />
            : <ContractFR row={row} quote={quote} totals={totals} signed={signed} guests={guests} eventLong={eventLong} issued={issued} note={note} />}
          <footer className="dv-foot">{FOOTER[lang]}</footer>
        </section>
      )}
    </div>
  );
}

type ContractProps = { row: RequestRow; quote: Quote; totals: Totals; signed: Signature | null; guests: string; eventLong: string; issued: string; note: string };

/** Coordonnées bancaires (Qonto), communes aux deux langues. */
function BankDetails({ row, lang }: { row: RequestRow; lang: Lang }) {
  const en = lang === "en";
  return (
    <div className="dv-rib">
      <div><span>{en ? "Account holder" : "Titulaire"}</span><b>EI-MVUNDA-KILOLA HUGUETTE / CUILLERE D OR</b></div>
      <div><span>{en ? "Address" : "Adresse"}</span><b>8 allée des Bois, 77240 Vert-Saint-Denis{en ? ", France" : ""}</b></div>
      <div><span>IBAN</span><b>FR76 1695 8000 0103 6634 1336 613</b></div>
      <div><span>BIC</span><b>QNTOFRP1XXX</b></div>
      <div><span>{en ? "Bank" : "Banque"}</span><b>Qonto (Olinda SAS), 18 rue de Navarin, 75009 Paris{en ? ", France" : ""}</b></div>
      <div><span>{en ? "Reference" : "Référence"}</span><b>{`CDO ${row.client_name} ${row.event_date ? formatDateShort(row.event_date) : ""}`.trim()}</b></div>
    </div>
  );
}

function ContractFR({ row, quote, totals, signed, guests, eventLong, issued, note }: ContractProps) {
  const lang: Lang = "fr";
  const m = (n: number) => money(n, lang);
  return (
    <>
      <h2 className="dv-h2 dv-center">CONTRAT DE PRESTATION TRAITEUR</h2>
      <p className="dv-center dv-sub-title"><i>{row.event_type} — {eventLong}</i></p>
      <p className="dv-center dv-sub-place"><i>{row.event_place}</i></p>
      <div className="dv-parties">
        <div className="dv-party dv-party-dark">
          <div className="dv-party-label">PRESTATAIRE</div>
          Cuillère d’Or<br />8 allée des Bois, 77240 Vert-Saint-Denis<br />SIREN : 889 933 800<br />Représentée par : Mme Huguette MVUNDA KILOLA
        </div>
        <div className="dv-party">
          <div className="dv-party-label">CLIENT(S)</div>
          {row.client_name}<br />{row.client_phone}<br />{row.client_email}
        </div>
      </div>

      <h3>ARTICLE 1 — OBJET DE LA PRESTATION</h3>
      <p>Le Prestataire s’engage à réaliser la prestation traiteur suivante :</p>
      <ul>
        <li>Événement : {row.event_type} — {eventLong}</li>
        <li>Lieu : {row.event_place}</li>
        <li>Convives : {guests}</li>
      </ul>
      <p>Prestations incluses :</p>
      <ul>
        {quote.lines.map((line) => (
          <Fragment key={line.id}>
            <li>
              {line.label} — {isLodgingPending(line) ? "à chiffrer" : isTravelPending(line) ? `${m(line.price)} par km aller-retour, à chiffrer selon l’adresse du lieu` : `${fmtQty(line.qty)} ${line.unit} × ${m(line.price)} = ${m(lineTotal(line))}`}
            </li>
            {/* Détail de la formule (repas, vin d’honneur…) repris ligne à ligne, comme au devis. */}
            {line.id === "main" && line.detail ? line.detail.split(" · ").filter(Boolean).map((part, k) => <li key={k}>{part}</li>) : null}
          </Fragment>
        ))}
      </ul>
      {/* Remarque du devis (vaisselle, boissons, déchets à la charge du client…) reprise dans le contrat. */}
      {note ? <p><b>Précisions :</b> {note}</p> : null}
      <p>Toute modification importante (date, lieu, nombre de convives, menus, horaires) doit faire l’objet d’un avenant écrit et signé. À défaut, les conditions du présent contrat s’appliquent dans leur version originale.</p>

      <h3>ARTICLE 2 — CONDITIONS FINANCIÈRES</h3>
      <ul>
        <li>Montant total : {m(totals.total)} TTC</li>
        {totals.fullAtSignature ? (
          <li>Règlement : {m(totals.total)} — intégralité à verser à la signature (événement dans moins de 2 mois)</li>
        ) : (
          <>
            <li>Acompte (30 %) : {m(totals.deposit)} — à verser à la signature</li>
            <li>Solde (70 %) : {m(totals.balance)} — à régler au plus tard le {dateText(totals.balanceDue, lang)}</li>
          </>
        )}
        {totals.caution ? <li>Caution (hors prix des prestations) : {m(totals.caution)}, {cautionDue(totals, lang).toLowerCase()} — restituée si aucun retard constaté</li> : null}
      </ul>
      {quote.payments?.length ? <PaymentSchedule rows={scheduleRows(totals, lang)} payments={quote.payments} caution={totals.caution} cautionDue={cautionDue(totals, lang)} lang={lang} /> : null}
      <p>Le Prestataire se réserve le droit de suspendre la prestation en cas de non-paiement du solde, sans obligation de remboursement des sommes déjà versées.</p>
      <p>Aucun service ne sera exécuté sans règlement complet du montant dû.</p>
      <p>Après règlement du solde, aucun ajustement à la baisse ne sera accepté. Toute hausse reste possible sous réserve de faisabilité.</p>
      <p><b>Modes de paiement acceptés</b></p>
      <ul>
        <li>Virement bancaire sur le compte Qonto de Cuillère d’Or :
          <BankDetails row={row} lang={lang} />
        </li>
        <li>Espèces</li>
      </ul>

      <h3>ARTICLE 3 — ORGANISATION DE LA PRESTATION</h3>
      <h4>3.1 – Horaires</h4>
      <p>Les horaires d’intervention sont confirmés au plus tard quatorze (14) jours avant l’événement. Tout retard supérieur à trente (30) minutes prolongeant la présence des équipes donnera lieu à une facturation complémentaire de 80 € TTC par heure entamée et par serveur.</p>
      <h4>3.2 – Accès et installation</h4>
      <p>Les équipes doivent accéder au lieu suffisamment tôt. Tout retard d’installation imputable au Client, au lieu ou à un tiers ne pourra être reproché au Prestataire.</p>
      <h4>3.3 – Coordination et wedding planner</h4>
      <p>Cuillère d’Or intervient exclusivement dans son périmètre traiteur. Les décisions prises par le wedding planner mandaté engagent le Client.</p>
      <h4>3.4 – Prestataires extérieurs</h4>
      <p>Cuillère d’Or ne pourra être tenue responsable des retards ou dysfonctionnements imputables aux autres prestataires : DJ, photographe, décorateur ou tout autre tiers.</p>
      <h4>3.5 – Instructions aux équipes</h4>
      <p>Seule la Cheffe traiteur ou son représentant est habilitée à diriger les équipes. Les demandes des invités ou autres intervenants n’ont aucun effet contractuel.</p>
      <h4>3.6 – Service des boissons</h4>
      <p>Lorsque le service des boissons est assuré par Cuillère d’Or, il est réalisé selon les modalités prévues au devis. Les boissons fournies par le Client demeurent sous sa responsabilité.</p>
      <h4>3.7 – Maintien au chaud</h4>
      <p>Lorsque le lieu ne dispose pas d’équipement de maintien au chaud, Cuillère d’Or peut fournir une étuve professionnelle, facturée 150 € TTC.</p>
      <p>En l’absence d’équipement adapté, Cuillère d’Or ne pourra être tenue responsable d’une altération de la qualité des mets.</p>
      <h4>3.8 – Qualité et adaptation de la prestation</h4>
      <p>En cas d’indisponibilité exceptionnelle d’un produit, le Prestataire pourra le remplacer par un produit de qualité équivalente ou supérieure, sans modification du prix.</p>
      <h4>3.9 – Produits fournis par le Client ou un tiers</h4>
      <p>Cuillère d’Or ne pourra être tenue responsable des produits extérieurs : wedding cake, champagne, alcools, desserts ou tout autre aliment fourni par le Client ou un tiers.</p>
      <h4>3.10 – Denrées non consommées</h4>
      <p>À la demande du Client, les denrées non consommées pourront lui être remises. Dès cette remise, leur conservation et consommation relèvent de sa responsabilité.</p>
      <p>Cuillère d’Or décline toute responsabilité en cas de rupture de la chaîne du froid postérieure à cette remise.</p>
      <h4>3.11 – Hygiène alimentaire</h4>
      <p>Les préparations sont réalisées dans le respect de la réglementation sanitaire. Une fois servis, Cuillère d’Or ne peut garantir la qualité sanitaire des mets en cas de rupture de chaîne du froid.</p>
      <h4>3.12 – Gestion des déchets alimentaires</h4>
      <p>La gestion des déchets alimentaires est incluse dans un forfait de 50 € TTC, à l’exclusion du verre et des déchets généraux de l’événement.</p>
      <h4>3.13 – Conditions de travail des équipes</h4>
      <p>Le Client s’engage à garantir des conditions de travail respectueuses. Tout comportement injurieux ou violent pourra conduire à une interruption immédiate de la prestation, sans remboursement.</p>
      <h4>3.14 – Conditions météorologiques</h4>
      <p>Pour les prestations en extérieur, Cuillère d’Or ne pourra être tenue responsable des conditions météorologiques défavorables. Il appartient au Client de prévoir un espace couvert.</p>

      <h3>ARTICLE 4 — OBLIGATIONS DU CLIENT</h3>
      <h4>4.1 – Conditions techniques</h4>
      <p>Le Client s’engage à mettre à disposition avant l’arrivée des équipes :</p>
      <ul>
        <li>Un accès adapté aux véhicules professionnels</li>
        <li>Un espace de préparation ou office</li>
        <li>Un point d’eau courante et une alimentation électrique (220V minimum)</li>
        <li>Un emplacement adapté si une étuve est prévue</li>
      </ul>
      <h4>4.2 – Vérification du lieu de réception</h4>
      <p>Il appartient au Client de vérifier les équipements disponibles et d’en informer Cuillère d’Or au plus tard six (6) semaines avant l’événement.</p>
      <h4>4.3 – Menus et allergies</h4>
      <p>Le Client communique les choix de menus définitifs et la liste complète des allergies au plus tard quatorze (14) jours avant l’événement.</p>
      <p>Passé ce délai, Cuillère d’Or ne pourra être tenue responsable d’un incident lié à une information non transmise.</p>
      <h4>4.4 – Nombre de convives</h4>
      <p>Le nombre définitif de convives est confirmé au plus tard trente (30) jours avant l’événement. Après règlement du solde, aucune diminution ne pourra donner lieu à remboursement.</p>
      <p>Le Client s’engage à communiquer de bonne foi le nombre exact de convives présents lors de l’événement ; ce nombre déclaré engage sa responsabilité. Si Cuillère d’Or constate le jour de la prestation un nombre de couverts supérieur à celui communiqué, le Prestataire décline toute réclamation relative à l’insuffisance des quantités ou à la qualité du service, l’organisation des équipes et les quantités préparées étant strictement conditionnées par les informations transmises par le Client.</p>
      <h4>4.5 – Wedding cake fourni par le Client</h4>
      <p>Le Client et son fournisseur demeurent responsables de la fabrication, du transport et de la conservation du wedding cake jusqu’à sa remise aux équipes CDO.</p>
      <h4>4.6 – Matériel et vaisselle</h4>
      <p>Le Client est responsable de toute perte, casse ou détérioration du matériel mis à disposition. Les frais de remplacement seront {totals.caution ? "retenus sur la caution ou refacturés" : "refacturés"}.</p>
      <h4>4.7 – Comportement des invités</h4>
      <p>Le Client demeure seul responsable du comportement de ses invités. Cuillère d’Or ne pourra être tenue responsable des incidents liés à une consommation excessive d’alcool.</p>

      <h3>ARTICLE 5 — RESPONSABILITÉ</h3>
      <p>La responsabilité totale du Prestataire est limitée aux sommes effectivement encaissées. Aucun dommage indirect ne pourra donner lieu à indemnisation.</p>
      <p>En cas de force majeure au sens de l’article 1218 du Code civil, le Prestataire sera déchargé de ses obligations sans qu’aucune indemnité ne puisse être réclamée.</p>

      <h3>ARTICLE 6 — ANNULATION</h3>
      <h4>6.1 – Annulation par le Client</h4>
      <ul>
        <li>Plus de 90 jours avant l’événement : sommes versées acquises par le Prestataire</li>
        <li>Entre 90 et 30 jours : 50 % du montant total est dû</li>
        <li>Moins de 30 jours : 100 % du montant total est dû</li>
      </ul>
      <h4>6.2 – Force majeure</h4>
      <p>En cas de force majeure au sens de l’article 1218 du Code civil rendant la prestation impossible, le Prestataire remboursera intégralement les sommes versées. En cas d’exécution partielle, un prorata sera appliqué.</p>
      <h4>6.3 – Annulation par le Prestataire</h4>
      <p>En cas d’annulation à l’initiative du Prestataire hors force majeure, l’intégralité des sommes versées sera restituée.</p>

      <h3>ARTICLE 7 — RÉCLAMATIONS</h3>
      <p>Toute réclamation doit être formulée par écrit au plus tard deux (2) jours ouvrés suivant la prestation. Passé ce délai, aucun remboursement ne pourra être accordé.</p>
      <p>Toute réclamation verbale sans confirmation écrite dans ce délai sera réputée abandonnée.</p>

      <h3>ARTICLE 8 — DROIT APPLICABLE ET MÉDIATION</h3>
      <p>Le présent contrat est soumis au droit français. En cas de litige, les parties s’engagent à rechercher une solution amiable avant tout recours judiciaire.</p>

      <h3>ARTICLE 9 — DROIT À L’IMAGE</h3>
      <p>Les photographies et vidéos des réalisations culinaires de Cuillère d’Or et des séquences de l’événement pourront être utilisées à des fins de communication, sans limitation de durée.</p>
      <p className="dv-choices">Le Client autorise ou refuse ce droit : <span className="dv-tick" aria-hidden="true">{signed?.image === "accepte" ? "✓" : ""}</span> <b>J’accepte</b> <span className="dv-tick" aria-hidden="true">{signed?.image === "refuse" ? "✓" : ""}</span> <b>Je refuse</b></p>

      <p className="dv-fait">Fait à Vert-Saint-Denis, le {issued}</p>
      <div className="dv-sign">
        <div>
          <p>Signature Cuillère d’Or :</p>
          <p className="dv-signname">CUILLÈRE D’OR — Huguette MVUNDA KILOLA</p>
        </div>
        <div>
          <ClientSignature row={row} signed={signed} lang={lang} />
        </div>
      </div>
    </>
  );
}

function ContractEN({ row, quote, totals, signed, guests, eventLong, eventType, issued, note }: ContractProps & { eventType: string }) {
  const lang: Lang = "en";
  const m = (n: number) => money(n, lang);
  return (
    <>
      <h2 className="dv-h2 dv-center">CATERING SERVICE AGREEMENT</h2>
      <p className="dv-center dv-sub-title"><i>{eventType} — {eventLong}</i></p>
      <p className="dv-center dv-sub-place"><i>{row.event_place}</i></p>
      <div className="dv-parties">
        <div className="dv-party dv-party-dark">
          <div className="dv-party-label">SERVICE PROVIDER</div>
          Cuillère d’Or<br />8 allée des Bois, 77240 Vert-Saint-Denis, France<br />SIREN: 889 933 800<br />Represented by: Ms Huguette MVUNDA KILOLA
        </div>
        <div className="dv-party">
          <div className="dv-party-label">CLIENT(S)</div>
          {row.client_name}<br />{row.client_phone}<br />{row.client_email}
        </div>
      </div>

      <h3>ARTICLE 1 — PURPOSE OF THE SERVICE</h3>
      <p>The Service Provider undertakes to provide the following catering service:</p>
      <ul>
        <li>Event: {eventType} — {eventLong}</li>
        <li>Venue: {row.event_place}</li>
        <li>Guests: {guests}</li>
      </ul>
      <p>Included services:</p>
      <ul>
        {quote.lines.map((line) => (
          <Fragment key={line.id}>
            <li>
              {lineLabel(line, lang)} — {isLodgingPending(line) ? "to be quoted" : isTravelPending(line) ? `${m(line.price)} per round-trip km, to be quoted according to the venue address` : `${fmtQty(line.qty, lang)} ${unitText(line.unit, lang)} × ${m(line.price)} = ${m(lineTotal(line))}`}
            </li>
            {line.id === "main" && lineDetail(line, lang) ? lineDetail(line, lang).split(" · ").filter(Boolean).map((part, k) => <li key={k}>{part}</li>) : null}
          </Fragment>
        ))}
      </ul>
      {note ? <p><b>Specific terms:</b> {note}</p> : null}
      <p>Any significant change (date, venue, number of guests, menus, schedule) must be the subject of a written and signed amendment. Failing this, the terms of this agreement apply in their original version.</p>

      <h3>ARTICLE 2 — FINANCIAL TERMS</h3>
      <ul>
        <li>Total amount: {m(totals.total)} (all taxes included)</li>
        {totals.fullAtSignature ? (
          <li>Payment: {m(totals.total)} — full amount payable upon signature (event in less than 2 months)</li>
        ) : (
          <>
            <li>Deposit (30%): {m(totals.deposit)} — payable upon signature</li>
            <li>Balance (70%): {m(totals.balance)} — payable no later than {dateText(totals.balanceDue, lang)}</li>
          </>
        )}
        {totals.caution ? <li>Security deposit (not part of the price): {m(totals.caution)}, {cautionDue(totals, lang).toLowerCase()} — refunded if no delay occurs</li> : null}
      </ul>
      {quote.payments?.length ? <PaymentSchedule rows={scheduleRows(totals, lang)} payments={quote.payments} caution={totals.caution} cautionDue={cautionDue(totals, lang)} lang={lang} /> : null}
      <p>The Service Provider reserves the right to suspend the service if the balance is not paid, with no obligation to refund sums already paid.</p>
      <p>No service will be performed until the amount due has been paid in full.</p>
      <p>Once the balance has been paid, no downward adjustment will be accepted. Any increase remains possible, subject to feasibility.</p>
      <p><b>Accepted payment methods</b></p>
      <ul>
        <li>Bank transfer to Cuillère d’Or’s Qonto account:
          <BankDetails row={row} lang={lang} />
        </li>
        <li>Cash</li>
      </ul>

      <h3>ARTICLE 3 — ORGANISATION OF THE SERVICE</h3>
      <h4>3.1 – Schedule</h4>
      <p>Service times are confirmed no later than fourteen (14) days before the event. Any delay of more than thirty (30) minutes extending the teams’ presence will be invoiced additionally at €80 (all taxes included) per hour or part thereof and per server.</p>
      <h4>3.2 – Access and set-up</h4>
      <p>The teams must be able to access the venue sufficiently early. Any set-up delay attributable to the Client, the venue or a third party cannot be held against the Service Provider.</p>
      <h4>3.3 – Coordination and wedding planner</h4>
      <p>Cuillère d’Or acts exclusively within the scope of its catering service. Decisions made by the appointed wedding planner are binding on the Client.</p>
      <h4>3.4 – Other vendors</h4>
      <p>Cuillère d’Or cannot be held liable for delays or malfunctions attributable to other vendors: DJ, photographer, decorator or any other third party.</p>
      <h4>3.5 – Instructions to the teams</h4>
      <p>Only the Chef or her representative is authorised to direct the teams. Requests from guests or other parties have no contractual effect.</p>
      <h4>3.6 – Beverage service</h4>
      <p>When the beverage service is provided by Cuillère d’Or, it is carried out as set out in the quote. Drinks supplied by the Client remain under the Client’s responsibility.</p>
      <h4>3.7 – Keeping food warm</h4>
      <p>When the venue has no food-warming equipment, Cuillère d’Or can supply a professional food warmer, invoiced at €150 (all taxes included).</p>
      <p>In the absence of suitable equipment, Cuillère d’Or cannot be held liable for any deterioration in the quality of the food.</p>
      <h4>3.8 – Quality and adaptation of the service</h4>
      <p>In the exceptional event that a product is unavailable, the Service Provider may replace it with a product of equivalent or higher quality, at no change in price.</p>
      <h4>3.9 – Products supplied by the Client or a third party</h4>
      <p>Cuillère d’Or cannot be held liable for outside products: wedding cake, champagne, alcohol, desserts or any other food supplied by the Client or a third party.</p>
      <h4>3.10 – Leftover food</h4>
      <p>At the Client’s request, leftover food may be handed over to the Client. From that moment, its storage and consumption are the Client’s responsibility.</p>
      <p>Cuillère d’Or accepts no liability for any break in the cold chain after this handover.</p>
      <h4>3.11 – Food hygiene</h4>
      <p>All dishes are prepared in compliance with food safety regulations. Once served, Cuillère d’Or cannot guarantee the safety of the food in the event of a break in the cold chain.</p>
      <h4>3.12 – Food waste management</h4>
      <p>Food waste management is included in a €50 flat fee (all taxes included), excluding glass and general event waste.</p>
      <h4>3.13 – Working conditions of the teams</h4>
      <p>The Client undertakes to ensure respectful working conditions. Any abusive or violent behaviour may lead to the immediate interruption of the service, without refund.</p>
      <h4>3.14 – Weather conditions</h4>
      <p>For outdoor services, Cuillère d’Or cannot be held liable for adverse weather conditions. It is the Client’s responsibility to provide a covered area.</p>

      <h3>ARTICLE 4 — CLIENT’S OBLIGATIONS</h3>
      <h4>4.1 – Technical requirements</h4>
      <p>The Client undertakes to provide, before the teams arrive:</p>
      <ul>
        <li>Access suitable for commercial vehicles</li>
        <li>A preparation area or catering kitchen</li>
        <li>A running water supply and an electrical supply (220V minimum)</li>
        <li>A suitable location if a food warmer is planned</li>
      </ul>
      <h4>4.2 – Checking the venue</h4>
      <p>It is the Client’s responsibility to check the equipment available and to inform Cuillère d’Or no later than six (6) weeks before the event.</p>
      <h4>4.3 – Menus and allergies</h4>
      <p>The Client provides the final menu choices and the complete list of allergies no later than fourteen (14) days before the event.</p>
      <p>After this deadline, Cuillère d’Or cannot be held liable for any incident related to information that was not provided.</p>
      <h4>4.4 – Number of guests</h4>
      <p>The final number of guests is confirmed no later than thirty (30) days before the event. Once the balance has been paid, no reduction will give rise to a refund.</p>
      <p>The Client undertakes to communicate in good faith the exact number of guests attending the event; this declared number is the Client’s responsibility. If, on the day of the service, Cuillère d’Or observes a number of covers higher than the number communicated, the Service Provider declines any claim relating to insufficient quantities or to the quality of service, as the organisation of the teams and the quantities prepared depend strictly on the information provided by the Client.</p>
      <h4>4.5 – Wedding cake supplied by the Client</h4>
      <p>The Client and their supplier remain responsible for making, transporting and storing the wedding cake until it is handed over to the CDO teams.</p>
      <h4>4.6 – Equipment and tableware</h4>
      <p>The Client is responsible for any loss, breakage or damage to the equipment provided. Replacement costs will be {totals.caution ? "deducted from the security deposit or invoiced" : "invoiced"}.</p>
      <h4>4.7 – Guests’ behaviour</h4>
      <p>The Client remains solely responsible for the behaviour of their guests. Cuillère d’Or cannot be held liable for incidents related to excessive alcohol consumption.</p>

      <h3>ARTICLE 5 — LIABILITY</h3>
      <p>The Service Provider’s total liability is limited to the sums actually received. No indirect damage may give rise to compensation.</p>
      <p>In the event of force majeure within the meaning of article 1218 of the French Civil Code, the Service Provider will be released from its obligations without any compensation being claimable.</p>

      <h3>ARTICLE 6 — CANCELLATION</h3>
      <h4>6.1 – Cancellation by the Client</h4>
      <ul>
        <li>More than 90 days before the event: sums paid are retained by the Service Provider</li>
        <li>Between 90 and 30 days: 50% of the total amount is due</li>
        <li>Less than 30 days: 100% of the total amount is due</li>
      </ul>
      <h4>6.2 – Force majeure</h4>
      <p>In the event of force majeure within the meaning of article 1218 of the French Civil Code making the service impossible, the Service Provider will refund all sums paid in full. In the event of partial performance, a pro rata will apply.</p>
      <h4>6.3 – Cancellation by the Service Provider</h4>
      <p>If the Service Provider cancels for reasons other than force majeure, all sums paid will be refunded.</p>

      <h3>ARTICLE 7 — CLAIMS</h3>
      <p>Any claim must be made in writing no later than two (2) working days after the service. After this deadline, no refund can be granted.</p>
      <p>Any verbal claim not confirmed in writing within this period will be deemed withdrawn.</p>

      <h3>ARTICLE 8 — GOVERNING LAW AND MEDIATION</h3>
      <p>This agreement is governed by French law. In the event of a dispute, the parties undertake to seek an amicable solution before any legal action.</p>

      <h3>ARTICLE 9 — IMAGE RIGHTS</h3>
      <p>Photographs and videos of Cuillère d’Or’s culinary creations and of moments of the event may be used for communication purposes, without time limit.</p>
      <p className="dv-choices">The Client grants or refuses this right: <span className="dv-tick" aria-hidden="true">{signed?.image === "accepte" ? "✓" : ""}</span> <b>I accept</b> <span className="dv-tick" aria-hidden="true">{signed?.image === "refuse" ? "✓" : ""}</span> <b>I refuse</b></p>

      <p className="dv-fait">Done at Vert-Saint-Denis on {issued}</p>
      <div className="dv-sign">
        <div>
          <p>Cuillère d’Or signature:</p>
          <p className="dv-signname">CUILLÈRE D’OR — Huguette MVUNDA KILOLA</p>
        </div>
        <div>
          <ClientSignature row={row} signed={signed} lang={lang} />
        </div>
      </div>
      <p className="dv-langnote">This English version is provided for convenience. In case of discrepancy, the French version of this agreement prevails.</p>
    </>
  );
}
