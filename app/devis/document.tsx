// Document « Devis + Contrat » Cuillère d'Or (rendu HTML imprimable en PDF), repris du modèle actuel.
import { Fragment } from "react";
import {
  computeTotals,
  formatDateFR,
  formatDateShort,
  formatEUR,
  lineTotal,
  parseQuote,
  type RequestRow,
} from "../../lib/quote";

const COMPLEMENTARY: Array<{ title: string; rows: Array<[string, string]> }> = [
  { title: "Restauration", rows: [["Menu enfants (5 à 12 ans)", "25 €/pers."], ["Menu prestataires", "30 €/pers."], ["Viande ou poisson en plus", "5 €/pers."], ["Entrée ou dessert en plus (service à l’assiette)", "5 €/pers."]] },
  { title: "Boissons", rows: [["Forfait soft et eau (Coca-Cola, Fanta, Oasis, eau plate et gazeuse)", "5 €/pers."], ["Cocktails signature (1 litre pour environ 4 convives)", "10 €/litre"], ["Service des boissons toute la soirée", "160 €/serveur"]] },
  { title: "Événementiel", rows: [["Présentation, découpe et service du gâteau", "150 € forfait"], ["Wedding cake (partenaire Love Lo Cake)", "dès 6,50 €/part"], ["Assiette de fromages avant le dessert", "9 €/pers."]] },
  { title: "Vaisselle & linge", rows: [["Kit vaisselle Essentiel — 2 assiettes, verre à eau, verre à vin, couverts", "7 €/kit"], ["Kit vaisselle Complet — 3 assiettes, verres eau, vin et champagne, couverts", "10 €/kit"], ["Kit vaisselle Prestige — Kit Complet + sous-plat perlé", "13 €/kit"], ["Serviettes en tissu", "2 €/pers."], ["Sous-plat perlé", "3 €/unité"]] },
  { title: "Mobilier & matériel", rows: [["Mange-debout (avec housse et nappe)", "15 €/unité"], ["Réchaud de buffet (chafing dish)", "25 €/unité"], ["Étuve professionnelle", "150 € forfait"], ["Camion frigorifique", "location + km"]] },
  { title: "Services", rows: [["Installation complète (mise en place du lieu et du matériel)", "150 € forfait"], ["Dressage des tables (compris si vaisselle louée avec la cheffe)", "250 € forfait"], ["Maître d’hôtel", "160 € forfait"], ["Gestion des déchets alimentaires", "50 € forfait"]] },
  { title: "Prestataires partenaires", rows: [["Photographe · Vidéaste · DJ · Décorateur · Wedding planner", "sur devis"]] },
  { title: "Avant l’événement", rows: [["Dégustation au restaurant Chez Lina (sur rendez-vous, non déductible du devis)", "70 €/pers."]] },
];

const fmtQty = (n: number) => String(n).replace(".", ",");

// Lignes rangées sous « Prestations incluses » ; les autres vont sous « Options ».
const INCLUDED_IDS = new Set(["main", "vin-honneur", "enfants", "prestataires"]);

// Regroupe le détail d'une ligne (« Titre : · 1. a · 2. b · Autre titre : · … ») en blocs titre + liste.
function groupDetail(parts: string[]) {
  const groups: Array<{ title: string; items: string[]; numbered: boolean }> = [];
  for (const part of parts) {
    if (/ :$/.test(part)) { groups.push({ title: part, items: [], numbered: false }); continue; }
    if (!groups.length) groups.push({ title: "", items: [], numbered: false });
    const g = groups[groups.length - 1];
    const m = /^\d+\.\s*(.*)$/.exec(part);
    if (m) g.numbered = true;
    g.items.push(m ? m[1] : part);
  }
  return groups.filter((g) => g.title || g.items.length);
}


export default function QuoteDocument({ row, quoteOnly = false }: { row: RequestRow; quoteOnly?: boolean }) {
  const quote = parseQuote(row);
  const totals = computeTotals(quote, row.event_date);
  const eventLong = row.event_date ? formatDateFR(row.event_date, true) : "";
  const issued = formatDateFR(quote.issuedOn);
  const guests =
    row.formula === "chef"
      ? `${row.adults} couverts`
      : `${row.adults} adultes${row.children ? ` + ${row.children} enfants` : ""}${row.providers ? ` + ${row.providers} prestataires` : ""}`;

  return (
    <div className="dv-doc">
      <style>{`@media print { @page { @top-left { content: "Cuillère d’Or — ${row.client_name.replace(/["\\]/g, "")}${row.event_date ? " — " + formatDateShort(row.event_date) : ""}"; font: 9px Arial, sans-serif; color: #6b6b6b; } @bottom-right { content: "Page " counter(page) " / " counter(pages); font: 9px Arial, sans-serif; color: #6b6b6b; } } }`}</style>
      {/* ================= DEVIS ================= */}
      <section className="dv-page">
        <header className="dv-head">
          <div className="dv-brand">
            <img src="/logo-cuillere-dor-800.png" alt="Cuillère d’Or" width={220} />
            <p>8 Allée des Bois, 77240 Vert-Saint-Denis<br />Tél : 07 83 74 89 71<br />contact@cuilleredor.fr<br />SIRET : 889 933 800 00019</p>
          </div>
          <table className="dv-client">
            <thead><tr><th colSpan={2}>DEVIS POUR</th></tr></thead>
            <tbody>
              <tr><th>Nom du client :</th><td>{row.client_name}</td></tr>
              <tr><th>Téléphone :</th><td>{row.client_phone}</td></tr>
              <tr><th>Email :</th><td>{row.client_email}</td></tr>
              {row.billing_address ? <tr><th>Facturation :</th><td>{row.billing_address}</td></tr> : null}
              <tr><th>Date de l’événement :</th><td>{row.event_date ? formatDateShort(row.event_date) : ""}</td></tr>
              <tr><th>Lieu :</th><td>{row.event_place}</td></tr>
              <tr><th>Type :</th><td>{row.event_type}</td></tr>
              <tr><th>Invités :</th><td>{guests}</td></tr>
            </tbody>
          </table>
        </header>
        <p className="dv-sum"><b>Prestation souhaitée :</b> {quote.summary}</p>
        {quote.remarks && quote.remarks.trim() !== "—" ? <p className="dv-sum"><b>Options / remarques :</b> {quote.remarks}</p> : null}

        <table className="dv-lines">
          <thead>
            <tr><th>Quantité</th><th className="c dv-check" /><th>Description</th><th className="r dv-pu">Prix unitaire</th><th className="r">Total</th></tr>
          </thead>
          <tbody>
            {[
              { title: "PRESTATIONS INCLUSES", lines: quote.lines.filter((l) => INCLUDED_IDS.has(l.id) || l.id.startsWith("inc-")) },
              { title: "OPTIONS", lines: quote.lines.filter((l) => !INCLUDED_IDS.has(l.id) && !l.id.startsWith("inc-")) },
            ].filter((sec) => sec.lines.length).map((sec) => (
              <Fragment key={sec.title}>
                <tr className="dv-band"><td colSpan={5}>{sec.title}</td></tr>
                {sec.lines.map((line) => {
                  const parts = line.detail ? line.detail.split(" · ") : [];
                  return (
                    <Fragment key={line.id}>
                      <tr className={parts.length ? "dv-has-detail" : undefined}>
                        <td className="c">{fmtQty(line.qty)} {line.unit}</td>
                        <td className="c dv-check">☑</td>
                        <td>{line.label}</td>
                        <td className="r dv-pu">{formatEUR(line.price)}</td>
                        <td className="r b">{formatEUR(lineTotal(line))}</td>
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
        <div className="dv-totalbar"><span>TOTAL PRESTATIONS</span><span>{formatEUR(totals.total)}</span></div>

        <p className="dv-conditions"><b>Conditions</b></p>
        <ul className="dv-terms">
          <li><b>Total des prestations</b><span>{formatEUR(totals.total)}</span></li>
          {totals.fullAtSignature
            ? <li><b>Règlement</b><span>L’événement ayant lieu dans moins de 2 mois, la totalité ({formatEUR(totals.total)}) est à régler à la signature.</span></li>
            : <>
                <li><b>Acompte (30 %)</b><span>{formatEUR(totals.deposit)} à la signature</span></li>
                <li><b>Solde</b><span>{formatEUR(totals.balance)} au plus tard le {formatDateFR(totals.balanceDue)}</span></li>
              </>}
          <li><b>Validité</b><span>30 jours à compter du {issued}. Tarifs et disponibilités garantis après signature et versement {totals.fullAtSignature ? "du règlement" : "de l’acompte"}.</span></li>
          <li><b>Catalogue</b><span>Formules, menus et services complémentaires : <a href="https://cuilleredor.fr/liseuse/" target="_blank" rel="noopener noreferrer">cuilleredor.fr/liseuse/</a></span></li>
          {quote.note && !quote.note.includes("liseuse") ? <li><b>Remarque</b><span>{quote.note}</span></li> : null}
        </ul>

        <div className="dv-sign">
          <div>
            <p>Devis émis le {issued}</p>
            <p>Signature Cuillère d’Or :</p>
            <img className="dv-stamp" src="/logo-cuillere-dor-800.png" alt="Cuillère d’Or" width={150} />
            <p className="dv-signname">Huguette MVUNDA KILOLA</p>
          </div>
          <div>
            <p>Signé le : ______________</p>
            <p>Signature client(s) : {row.client_name}</p>
            <div className="dv-box" />
          </div>
        </div>
        <footer className="dv-foot">Cuillère d’Or — 8 Allée des Bois, 77240 Vert-Saint-Denis — SIRET 889 933 800 00019 — contact@cuilleredor.fr — 07 83 74 89 71 — TVA non applicable (art. 293 B du CGI)</footer>
      </section>

      {/* ================= SERVICES COMPLÉMENTAIRES ================= */}
      {quote.includeComplementary ? (
        <section className="dv-page">
          <h2 className="dv-h2">SERVICES COMPLÉMENTAIRES</h2>
          <p>Ces options peuvent être ajoutées à votre prestation. Contactez-nous pour tout devis personnalisé.</p>
          <table className="dv-comp">
            <tbody>
              {COMPLEMENTARY.map((group) => (
                <Fragment key={group.title}>
                  <tr className="dv-band"><td colSpan={2}>{group.title}</td></tr>
                  {group.rows.map(([label, price]) => (
                    <tr key={group.title + label}><td>☐ {label}</td><td className="r">{price}</td></tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
          <p>Pour toute question ou demande de personnalisation : 07 83 74 89 71 • contact@cuilleredor.fr</p>
        </section>
      ) : null}

      {quoteOnly ? null : (<>
      {/* ================= CONTRAT ================= */}
      <section className="dv-page dv-contract">
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
            <li key={line.id}>
              {line.label} — {fmtQty(line.qty)} {line.unit} × {formatEUR(line.price)} = {formatEUR(lineTotal(line))}
            </li>
          ))}
        </ul>
        <p>Toute modification importante (date, lieu, nombre de convives, menus, horaires) doit faire l’objet d’un avenant écrit et signé. À défaut, les conditions du présent contrat s’appliquent dans leur version originale.</p>

        <h3>ARTICLE 2 — CONDITIONS FINANCIÈRES</h3>
        <ul>
          <li>Montant total : {formatEUR(totals.total)} TTC</li>
          {totals.fullAtSignature ? (
            <li>Règlement : {formatEUR(totals.total)} — intégralité à verser à la signature (événement dans moins de 2 mois)</li>
          ) : (
            <>
              <li>Acompte (30 %) : {formatEUR(totals.deposit)} — à verser à la signature</li>
              <li>Solde (70 %) : {formatEUR(totals.balance)} — à régler au plus tard le {formatDateFR(totals.balanceDue)}</li>
            </>
          )}
          <li>Caution : {formatEUR(totals.caution)}, versée avec le solde — restituée si aucun retard constaté</li>
        </ul>
        <p>Le Prestataire se réserve le droit de suspendre la prestation en cas de non-paiement du solde, sans obligation de remboursement des sommes déjà versées.</p>
        <p>Aucun service ne sera exécuté sans règlement complet du montant dû.</p>
        <p>Après règlement du solde, aucun ajustement à la baisse ne sera accepté. Toute hausse reste possible sous réserve de faisabilité.</p>
        <p><b>Modes de paiement acceptés</b></p>
        <ul>
          <li>Virement bancaire — coordonnées communiquées séparément à la signature</li>
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
        <p>La gestion des déchets alimentaires est incluse dans un forfait de 50 € TTC, à l’exclusion du verre et des déchets généraux de l’événement, sauf si non retenue au devis.</p>
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
        <p>La vaisselle et le linge de table ne sont pas inclus dans la prestation de base et doivent être prévus en location auprès du Prestataire ou d’un tiers. Le Client est responsable de toute perte, casse ou détérioration du matériel mis à disposition. Les frais de remplacement seront retenus sur la caution ou refacturés.</p>
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
        <p>Le Client autorise ou refuse ce droit : □ J’accepte □ Je refuse</p>

        <p className="dv-fait">Fait à Vert-Saint-Denis, le {issued}</p>
        <div className="dv-sign">
          <div>
            <p>Signature Cuillère d’Or :</p>
            <p className="dv-signname">CUILLÈRE D’OR — Huguette MVUNDA KILOLA</p>
          </div>
          <div>
            <p>Signé le : ______________</p>
            <p>Signature client(s) : {row.client_name}</p>
            <div className="dv-box" />
          </div>
        </div>
        <footer className="dv-foot">Cuillère d’Or — 8 Allée des Bois, 77240 Vert-Saint-Denis — SIRET 889 933 800 00019 — contact@cuilleredor.fr — 07 83 74 89 71 — TVA non applicable (art. 293 B du CGI)</footer>
      </section>
      </>)}
    </div>
  );
}
