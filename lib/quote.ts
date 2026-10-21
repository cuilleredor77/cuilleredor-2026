// Moteur de devis Cuillère d'Or : tarifs du catalogue 2027-2028, lignes de devis, échéances.
// Les montants sont en euros TTC (TVA non applicable). Tout est arrondi au centime.

export type FormulaKey =
  | "buffet"
  | "plateau"
  | "assiette"
  | "aperitifs"
  | "brunch"
  | "barbecue"
  | "chef";

export const FORMULA_KEYS: FormulaKey[] = [
  "buffet",
  "plateau",
  "assiette",
  "aperitifs",
  "brunch",
  "barbecue",
  "chef",
];

type FormulaMeta = {
  label: string;
  title: string;
  detail: string;
  min: number;
  tiers?: [number, number, number];
  flat?: number;
  honorWine: boolean;
};

export const FORMULAS: Record<FormulaKey, FormulaMeta> = {
  buffet: {
    label: "Buffet",
    title: "Repas — service buffet avec service compris",
    detail: "2 viandes | 2 poissons | 4 accompagnements | 1 légume (au choix)",
    min: 30,
    tiers: [45, 40, 35],
    honorWine: true,
  },
  plateau: {
    label: "Plateau",
    title: "Repas — service plateau avec service compris",
    detail: "2 viandes | 2 poissons | 4 accompagnements | 1 légume (au choix)",
    min: 30,
    tiers: [50, 45, 40],
    honorWine: true,
  },
  assiette: {
    label: "Service à l’assiette",
    title: "Repas — service à l’assiette avec service compris",
    detail:
      "Entrée : 1 choix | Plat : 1 viande ou 1 poisson avec féculent ou légumes | Dessert : 1 choix",
    min: 30,
    tiers: [70, 65, 60],
    honorWine: true,
  },
  aperitifs: {
    label: "Cocktail dînatoire & vin d’honneur",
    title: "Cocktail dînatoire / vin d’honneur avec service compris",
    detail: "10 pièces salées ou sucrées au choix",
    min: 50,
    flat: 25,
    honorWine: false,
  },
  brunch: {
    label: "Brunch Signature",
    title: "Brunch Signature avec service compris",
    detail: "Base commune (viennoiseries, pancakes, œufs, boissons) + 10 pièces au choix",
    min: 50,
    flat: 35,
    honorWine: false,
  },
  barbecue: {
    label: "Barbecue Party",
    title: "Barbecue Party avec service compris",
    detail: "Grillades cuites en direct, salades, accompagnements, 5 pièces à grignoter",
    min: 30,
    flat: 60,
    honorWine: false,
  },
  chef: {
    label: "Chef à domicile",
    title: "Chef à domicile — prestation clé en main",
    detail:
      "Amuse-bouche, entrée, plat et dessert à l’assiette, vaisselle, nappage et service inclus",
    min: 12,
    flat: 95,
    honorWine: false,
  },
};

export const PRICES = {
  child: 25,
  provider: 30,
  honorWine: 5,
  waste: 50,
  km: 1.9,
  depositRate: 0.3,
  caution: 250,
  fullPaymentUnderDays: 60,
  validDays: 30,
} as const;

export function isFormulaKey(value: string): value is FormulaKey {
  return (FORMULA_KEYS as string[]).includes(value);
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type QuoteLine = {
  id: string;
  qty: number;
  unit: string; // « pers. », « forfait », « km AR », « unité »…
  label: string;
  detail?: string;
  price: number; // prix unitaire
};

export type Quote = {
  lines: QuoteLine[];
  issuedOn: string; // AAAA-MM-JJ
  summary: string; // « Prestation souhaitée »
  remarks: string; // « Options / remarques »
  note: string; // mention libre ajoutée sous les conditions
  includeComplementary: boolean; // page « Services complémentaires »
  balanceDue?: string; // AAAA-MM-JJ : échéance du solde fixée à la main (sinon 2 mois avant l’événement)
  payments?: Payment[]; // règlements reçus (acompte, solde, caution…)
  noCaution?: boolean; // caution retirée à la main pour ce devis
};

/** Règlement reçu : date de réception et date à laquelle la réception a été confirmée au client. */
export type Payment = { id: string; label: string; amount: number; receivedOn: string; confirmedOn: string };

/** Total reçu hors caution (la caution est restituée, elle ne paie pas la prestation). */
export const paidTotal = (q: Quote) =>
  round2((q.payments || []).filter((p) => !/caution/i.test(p.label)).reduce((sum, p) => sum + (p.amount || 0), 0));

export type RequestRow = {
  id: number;
  token: string;
  created_at: string;
  updated_at: string;
  status: string;
  source: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  billing_address: string;
  event_type: string;
  event_date: string;
  event_place: string;
  formula: string;
  adults: number;
  children: number;
  providers: number;
  honor_wine: number;
  km: number | null;
  budget: string;
  estimate_json: string;
  selection_text: string;
  message: string;
  quote_json: string;
  quote_version: number;
  sent_at: string | null;
  internal_notes: string;
  service_mode: string; // service | livraison | emporter
  wedding_planner: string; // oui | non | recherche | ""
  vendors_found: string;
  signed_snapshot?: string; // JSON Snapshot : devis tel que signé (référence du premier avenant)
};

export type EstimateOption = { id: string; label: string; amount: number };

export const lineTotal = (line: QuoteLine) => round2(line.qty * line.price);

/** Déplacement dont la distance n’est pas encore connue : affiché « à chiffrer ». */
export const isTravelPending = (line: QuoteLine) => /d[ée]placement/i.test(line.label) && !(line.qty > 0);
/** Frais de logement de l’équipe : ligne « à chiffrer » tant que le prix n’est pas saisi. */
export const isLodgingPending = (line: QuoteLine) => /logement/i.test(line.label) && !(line.price > 0);
export const LODGING_FROM_KM = 350;
export const LODGING_LINE: QuoteLine = {
  id: "logement",
  qty: 1,
  unit: "forfait",
  label: "Frais de logement de l’équipe",
  detail: "Lieu à plus de 350 km aller-retour : hébergement de l’équipe sur place",
  price: 0,
};

export function tierPrice(formula: FormulaKey, totalGuests: number): number {
  const meta = FORMULAS[formula];
  if (meta.flat !== undefined) return meta.flat;
  const range = totalGuests < 200 ? 0 : totalGuests < 350 ? 1 : 2;
  return meta.tiers![range];
}

export function todayISO(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

// Catalogue des options (p.17 du catalogue), ajoutables en un clic dans l'éditeur.
export type OptionPreset = {
  id: string;
  label: string;
  unit: string;
  price: number;
  basis: "guests" | "adults" | "table" | "one" | "servers";
  detail?: string;
};

export const OPTION_PRESETS: OptionPreset[] = [
  { id: "soft", label: "Forfait soft et eau (Coca-Cola, Fanta, Oasis, eau plate et gazeuse)", unit: "pers.", price: 5, basis: "guests" },
  { id: "vh-cocktails", label: "Suppl. vin d’honneur — 4 cocktails au choix", unit: "pers.", price: PRICES.honorWine, basis: "adults", detail: "4 cocktails par personne, au choix parmi nos cocktails" },
  { id: "cocktails", label: "Cocktails supplémentaires (au-delà des 4 cocktails)", unit: "litre", price: 10, basis: "one", detail: "1 litre pour environ 4 convives" },
  { id: "serveurs", label: "Service des boissons toute la soirée", unit: "serveur", price: 160, basis: "servers", detail: "1 serveur conseillé pour 50 convives" },
  { id: "fromages", label: "Assiette de fromages avant le dessert", unit: "pers.", price: 9, basis: "adults" },
  { id: "gateau", label: "Présentation, découpe et service du gâteau", unit: "forfait", price: 150, basis: "one" },
  { id: "plus-viande", label: "Viande ou poisson en plus", unit: "pers.", price: 5, basis: "adults" },
  { id: "plus-entree", label: "Entrée ou dessert en plus (service à l’assiette)", unit: "pers.", price: 5, basis: "adults" },
  { id: "avocat", label: "Avocat surprise sur glace carbonique (supplément entrée)", unit: "pers.", price: 3, basis: "adults" },
  { id: "dechets", label: "Gestion des déchets alimentaires (hors verre)", unit: "forfait", price: 50, basis: "one" },
  { id: "installation", label: "Installation complète (mise en place du lieu et du matériel)", unit: "forfait", price: 150, basis: "one" },
  { id: "dressage", label: "Dressage des tables (nappes, assiettes, verres et couverts)", unit: "forfait", price: 250, basis: "one", detail: "Compris si la vaisselle est louée avec la cheffe" },
  { id: "maitre-hotel", label: "Maître d’hôtel (coordonne l’équipe et le lieu jusqu’à la fin de soirée)", unit: "forfait", price: 160, basis: "one" },
  { id: "kit-essentiel", label: "Kit vaisselle Essentiel (2 assiettes, verre à eau, verre à vin, couverts)", unit: "kit", price: 7, basis: "table" },
  { id: "kit-complet", label: "Kit vaisselle Complet (3 assiettes, verres eau, vin et champagne, couverts)", unit: "kit", price: 10, basis: "table" },
  { id: "kit-prestige", label: "Kit vaisselle Prestige (Kit Complet + sous-plat perlé)", unit: "kit", price: 13, basis: "table" },
  { id: "serviette", label: "Serviette en tissu", unit: "pers.", price: 2, basis: "table" },
  { id: "sous-plat", label: "Sous-plat perlé", unit: "unité", price: 3, basis: "table" },
  { id: "mange-debout", label: "Mange-debout (housse et nappe incluses)", unit: "unité", price: 15, basis: "one" },
  { id: "chafing", label: "Réchaud de buffet (chafing dish)", unit: "unité", price: 25, basis: "one" },
  { id: "logement", label: "Frais de logement de l’équipe", unit: "forfait", price: 0, basis: "one", detail: "Hébergement de l’équipe sur place (lieu éloigné)" },
  { id: "etuve", label: "Étuve professionnelle", unit: "forfait", price: 150, basis: "one" },
  { id: "degustation", label: "Dégustation au restaurant Chez Lina (non déductible du devis)", unit: "pers.", price: 70, basis: "one" },
];

/** tableGuests = adultes + enfants : base des kits vaisselle, serviettes et sous-plats (les prestataires n’en ont pas). */
export function presetToLine(preset: OptionPreset, adults: number, totalGuests: number, tableGuests = totalGuests): QuoteLine {
  const qty =
    preset.basis === "guests"
      ? totalGuests
      : preset.basis === "table"
        ? tableGuests
      : preset.basis === "adults"
        ? adults
        : preset.basis === "servers"
          ? Math.max(1, Math.ceil(totalGuests / 50))
          : 1;
  return {
    id: `${preset.id}-${Math.random().toString(36).slice(2, 7)}`,
    qty,
    unit: preset.unit,
    label: preset.label,
    detail: preset.detail,
    price: preset.price,
  };
}

export function parseEstimate(json: string): {
  options: EstimateOption[];
  total: number | null;
} | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return {
      options: Array.isArray(parsed.options) ? parsed.options : [],
      total: typeof parsed.total === "number" ? parsed.total : null,
    };
  } catch {
    return null;
  }
}

function summaryFor(req: Pick<RequestRow, "formula" | "honor_wine">): string {
  const key = isFormulaKey(req.formula) ? req.formula : "buffet";
  const meta = FORMULAS[key];
  const vh = meta.honorWine && req.honor_wine ? "Vin d’honneur + " : "";
  return `${vh}${meta.title}`;
}

/** Construit le devis proposé à partir de la demande (à vérifier et ajuster par Huguette). */
export function buildDefaultQuote(req: RequestRow): Quote {
  const key: FormulaKey = isFormulaKey(req.formula) ? req.formula : "buffet";
  const meta = FORMULAS[key];
  const isChef = key === "chef";
  const adults = Math.max(0, req.adults || 0);
  const children = isChef ? 0 : Math.max(0, req.children || 0);
  const providers = isChef ? 0 : Math.max(0, req.providers || 0);
  const totalGuests = adults + children + providers;
  const lines: QuoteLine[] = [];

  lines.push({
    id: "main",
    qty: adults,
    unit: "pers.",
    label: meta.title,
    detail: meta.detail,
    price: tierPrice(key, totalGuests),
  });

  if (meta.honorWine && req.honor_wine) lines.push(...honorWineLines(adults));
  if (children > 0) {
    lines.push({
      id: "enfants",
      qty: children,
      unit: "enf.",
      label: "Menu enfant (5 à 12 ans)",
      price: PRICES.child,
    });
  }
  if (providers > 0) {
    lines.push({
      id: "prestataires",
      qty: providers,
      unit: "pers.",
      label: "Menu prestataires (DJ, photographe, vidéaste…)",
      price: PRICES.provider,
    });
  }

  const estimate = parseEstimate(req.estimate_json);
  const handled = new Set(["honorWine", "children", "providers", "waste", "dishKit"]);
  let wasteWanted = true;
  if (estimate) {
    wasteWanted = estimate.options.some((o) => o.id === "waste");
    for (const option of estimate.options) {
      if (handled.has(option.id) || !(option.amount > 0)) continue;
      // Les lignes du simulateur arrivent avec un libellé du type « Étuve (150 € le forfait) »
      const label = option.label.replace(/\s*\([^)]*\)\s*$/, "").trim() || option.label;
      lines.push({
        id: `opt-${option.id}`,
        qty: 1,
        unit: "forfait",
        label,
        price: round2(option.amount),
      });
    }
    const kit = estimate.options.find((o) => o.id === "dishKit");
    if (kit && kit.amount > 0) {
      lines.push({
        id: "opt-dishKit",
        qty: 1,
        unit: "forfait",
        label: kit.label,
        price: round2(kit.amount),
      });
    }
  }

  // Options cochées dans le Google Form (« Options : … ») : chacune devient une ligne chiffrée du catalogue.
  const form = estimate || isChef ? { lines: [], message: req.message } : formOptions(req.message, adults, totalGuests, adults + children);
  lines.push(...form.lines);
  const brunch = isChef || key === "brunch" ? null : brunchNextDay(req.message, adults);
  if (brunch) lines.push(brunch);

  if (!isChef && wasteWanted) {
    lines.push({
      id: "dechets",
      qty: 1,
      unit: "forfait",
      label: "Gestion des déchets alimentaires (hors verre)",
      price: PRICES.waste,
    });
  }

  // Au-delà de 350 km aller-retour : logement de l’équipe, à chiffrer au cas par cas.
  if (!isChef && req.km && req.km > LODGING_FROM_KM) lines.push({ ...LODGING_LINE });

  if (req.km && req.km > 0) {
    lines.push({
      id: "deplacement",
      qty: round2(req.km),
      unit: "km AR",
      label: "Frais de déplacement aller-retour",
      detail: "Depuis 8 Allée des Bois, 77240 Vert-Saint-Denis",
      price: PRICES.km,
    });
  } else {
    // Lieu inconnu : la ligne reste visible avec le prix au km, montant « à chiffrer ».
    lines.push({
      id: "deplacement",
      qty: 0,
      unit: "km AR",
      label: "Frais de déplacement aller-retour",
      detail: "À chiffrer selon l’adresse exacte du lieu de réception (depuis 8 Allée des Bois, 77240 Vert-Saint-Denis)",
      price: PRICES.km,
    });
  }

  const guestsText = isChef
    ? `${adults} couverts`
    : `${adults} adultes${children ? ` + ${children} enfants` : ""}${providers ? ` + ${providers} prestataires` : ""}`;

  return {
    lines,
    issuedOn: todayISO(),
    summary: `${summaryFor(req)} — ${guestsText}`,
    remarks: clientRemarks(form.message).slice(0, 280) || "—",
    note: "",
    includeComplementary: true,
  };
}

export function parseQuote(row: RequestRow): Quote {
  if (row.quote_json) {
    try {
      const q = JSON.parse(row.quote_json) as Quote;
      // Ancienne mention « catalogue en ligne sur cuilleredor.fr/liseuse » : remplacée par la ligne Catalogue des conditions.
      if (q.note && q.note.includes("liseuse")) q.note = "";
      // Anciens devis : formule, contact et distance retirés des remarques (déjà ailleurs).
      if (q.remarks && q.remarks.trim() !== "—") q.remarks = clientRemarks(q.remarks) || "—";
      if (Array.isArray(q.lines)) return { ...q, lines: groupOrder(q.lines) };
    } catch {
      /* on retombe sur le devis par défaut */
    }
  }
  return buildDefaultQuote(row);
}

// ---------- Dates ----------

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function parseISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function formatDateFR(iso: string, withWeekday = false): string {
  const d = parseISO(iso);
  if (!d) return iso || "";
  const base = `${d.getUTCDate() === 1 ? "1er" : d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return withWeekday ? `${JOURS[d.getUTCDay()]} ${base}` : base;
}

export function formatDateShort(iso: string): string {
  const d = parseISO(iso);
  if (!d) return iso || "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

export function addMonths(iso: string, months: number): string {
  const d = parseISO(iso);
  if (!d) return "";
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  if (!d) return "";
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Une échéance tombant un samedi ou un dimanche est reportée au lundi. */
export function nextWorkingDay(iso: string): string {
  const d = parseISO(iso);
  if (!d) return iso;
  const dow = d.getUTCDay();
  if (dow === 6) return addDays(iso, 2);
  if (dow === 0) return addDays(iso, 1);
  return iso;
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseISO(fromISO);
  const b = parseISO(toISO);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function formatEUR(n: number): string {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[  ]/g, " ")} €`;
}

// ---------- Totaux et échéances ----------

export type Totals = {
  total: number;
  deposit: number;
  balance: number;
  balanceDue: string; // AAAA-MM-JJ ou ""
  fullAtSignature: boolean;
  validUntil: string;
  caution: number;
};

/** Livraison ou vente à emporter : pas de caution (pas d’équipe sur place). */
export function computeTotals(quote: Quote, eventDate: string, serviceMode = "service"): Totals {
  const total = round2(quote.lines.reduce((sum, l) => sum + lineTotal(l), 0));
  const days = eventDate ? daysBetween(quote.issuedOn, eventDate) : 999;
  const fullAtSignature = days < PRICES.fullPaymentUnderDays;
  const deposit = fullAtSignature ? total : round2(total * PRICES.depositRate);
  const balance = round2(total - deposit);
  return {
    total,
    deposit,
    balance,
    balanceDue: fullAtSignature || !eventDate ? "" : quote.balanceDue || nextWorkingDay(addMonths(eventDate, -2)),
    fullAtSignature,
    validUntil: addDays(quote.issuedOn, PRICES.validDays),
    caution: quote.noCaution || serviceMode === "livraison" || serviceMode === "emporter" ? 0 : PRICES.caution,
  };
}

/** Nom de fichier conventionnel : CDO_AAAAMMJJ_Type_NOM_Prénom_Devis_Contrat */
export function quoteFileName(req: RequestRow): string {
  const date = (req.event_date || "").replaceAll("-", "");
  const clean = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  const parts = req.client_name.trim().split(/\s+/);
  const last = clean(parts.slice(-1)[0] || "Client");
  const first = clean(parts.slice(0, -1).join("_"));
  return ["CDO", date || "date", clean(req.event_type || "Evenement"), last.toUpperCase(), first, "Devis_Contrat"]
    .filter(Boolean)
    .join("_");
}

// ---------- E-mail au client et points à vérifier (partagés par l'éditeur et l'envoi automatique) ----------

export function firstName(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts.find((p) => /[a-zà-ÿ]/.test(p)) || parts[0] || "";
}

export function clientEmail(req: RequestRow, quote: Quote, totals: Totals, link: string): { subject: string; body: string } {
  const dateShort = req.event_date ? formatDateShort(req.event_date) : "";
  const subject = `Votre devis Cuillère d’Or — ${req.event_type} du ${dateShort} — ${req.client_name}`;
  const body = [
    `Bonjour ${firstName(req.client_name)},`,
    "",
    `Merci pour votre demande pour votre ${req.event_type.toLowerCase()} du ${req.event_date ? formatDateFR(req.event_date, true) : ""}${req.event_place ? ` à ${req.event_place}` : ""}. Nous sommes disponibles à cette date.`,
    "",
    "Vous trouverez votre devis et votre contrat à cette adresse (bouton « Télécharger en PDF » pour les enregistrer) :",
    link,
    "",
    `• ${quote.summary}`,
    `• Total : ${formatEUR(totals.total)}`,
    totals.fullAtSignature
      ? `• Règlement intégral à la signature : ${formatEUR(totals.total)}`
      : `• Acompte de 30 % à la signature : ${formatEUR(totals.deposit)} — solde de ${formatEUR(totals.balance)} au plus tard le ${formatDateFR(totals.balanceDue)}`,
    `• Devis valable jusqu’au ${formatDateFR(totals.validUntil)}`,
    "",
    "Pour réserver votre date, il vous suffit de nous retourner le contrat signé : nous vous communiquerons alors nos coordonnées bancaires pour l’acompte.",
    "",
    "Bien cordialement,",
    "Cheffe Huguette — 07 83 74 89 71 | contact@cuilleredor.fr",
  ].join("\n");
  return { subject, body };
}

/** Points à vérifier avant d'envoyer le devis au client. */
export function quoteAlerts(req: RequestRow, quote: Quote, totals: Totals): string[] {
  const out: string[] = [];
  const off = offPeriod(req.event_date);
  if ((req.km || 0) > LODGING_FROM_KM && !quote.lines.some((l) => /logement/i.test(l.label))) out.push(`Lieu à ${req.km} km aller-retour (plus de ${LODGING_FROM_KM} km) : pense aux frais de logement de l’équipe.`);
  if (quote.lines.some(isLodgingPending)) out.push("Frais de logement à chiffrer : saisis le montant dans la ligne « Frais de logement ».");
  if (off) out.push(`⛔ Huguette est OFF ce jour-là (${off.label}) : répondre avec « Indisponible » ou « Indispo + devis ».`);
  const key: FormulaKey = isFormulaKey(req.formula) ? req.formula : "buffet";
  if (!req.client_email) out.push("E-mail du client manquant.");
  if (!req.event_date) out.push("Date de l’événement manquante : le mail demande la date et ne confirme pas la disponibilité.");
  else if (daysBetween(todayISO(), req.event_date) < 0) out.push("La date de l’événement est dépassée.");
  else if (totals.fullAtSignature) out.push("Événement dans moins de 2 mois : règlement intégral à la signature.");
  if (req.adults < FORMULAS[key].min) out.push(`Moins que le minimum de la formule (${FORMULAS[key].min} convives) : à valider avant d’envoyer.`);
  if (!req.event_place) out.push("Lieu de l’événement manquant.");
  else if (!req.km && quote.note.includes("à chiffrer")) out.push("Seul le département est indiqué : déplacement à chiffrer.");
  else if (!req.km) out.push("Frais de déplacement non calculés (adresse introuvable) : à compléter dans l’éditeur.");
  else if (quote.lines.some((l) => l.id === "deplacement" && (l.detail || "").startsWith("Estimation depuis la commune")))
    out.push("Déplacement estimé depuis la ville seule : à confirmer avec l’adresse exacte.");
  if (key === "chef") out.push("Chef à domicile : tarif à confirmer.");
  // Garde-fou : distance surprenante (au-delà de 200 km aller-retour) → vérifier la commune retenue
  if (req.km && req.km > 200) {
    const place = (req.internal_notes || "").split("\n").find((l) => l.startsWith("Lieu retenu pour les km : "));
    out.push(
      `Distance élevée (${req.km} km aller-retour) : vérifier la commune retenue${place ? ` (${place.replace("Lieu retenu pour les km : ", "").split(",").slice(0, 3).join(",")})` : ""}.`,
    );
  }
  if (req.service_mode && req.service_mode !== "service") out.push(`${serviceModeLabel(req.service_mode)} : le tarif de la formule inclut le service, à adapter.`);
  if (quote.lines.some((l) => !isLodgingPending(l) && !isTravelPending(l) && (!(l.price > 0) || !(l.qty > 0)))) out.push("Une ligne a une quantité ou un prix à zéro.");
  return out;
}

export function serviceModeLabel(mode: string): string {
  return mode === "livraison" ? "Livraison sans service" : mode === "emporter" ? "À emporter" : "Avec service sur place";
}

export function weddingPlannerLabel(value: string): string {
  return value === "oui" ? "déjà trouvé" : value === "recherche" ? "en recherche" : value === "non" ? "pas prévu" : "non précisé";
}

/** Petite signature des e-mails clients (logo, nom, coordonnées). */
export const EMAIL_SIGNATURE = `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;margin-top:4px"><tr>`
  + `<td style="padding:0 14px 0 0;border-right:2px solid #c9a227;vertical-align:middle"><img src="https://cuilleredor.fr/logo-cuillere-dor.png" alt="Cuillère d’Or" width="96" style="display:block;width:96px;height:auto"></td>`
  + `<td style="padding:0 0 0 14px;vertical-align:middle;font-size:13px;line-height:1.5;color:#1a1a1a"><strong>Cheffe Huguette MVUNDA</strong><br><span style="color:#6b5420">Cuillère d’Or — traiteur</span><br>`
  + `<a href="tel:+33783748971" style="color:#1a1a1a;text-decoration:none">07 83 74 89 71</a> · <a href="mailto:contact@cuilleredor.fr" style="color:#1a1a1a">contact@cuilleredor.fr</a><br>`
  + `<a href="https://cuilleredor.fr" target="_blank" rel="noopener noreferrer" style="color:#8b6914">cuilleredor.fr</a></td></tr></table>`;

/** Réponse négative : la cheffe n’est pas disponible à la date demandée (période OFF ou agenda complet). */
export function unavailableEmail(req: RequestRow): { subject: string; html: string; text: string } {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const first = firstName(req.client_name);
  const type = (req.event_type || "événement").toLowerCase();
  const when = req.event_date ? ` du ${formatDateFR(req.event_date)}` : "";
  const subject = `Votre demande Cuillère d’Or — ${req.event_type}${req.event_date ? ` du ${formatDateShort(req.event_date)}` : ""} — ${req.client_name}`;
  const paras = [
    `Merci pour votre demande et pour l’intérêt que vous portez à Cuillère d’Or.`,
    `Malheureusement, nous ne sommes pas disponibles pour votre ${type}${when} et ne pourrons donc pas assurer cette prestation.`,
    `Si votre date peut évoluer, n’hésitez pas à nous proposer une autre date : nous serons ravis de vous établir un devis.`,
    `Nous vous souhaitons une très belle réception.`,
  ];
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:680px">`
    + `<p>Bonjour ${esc(first)},</p>${paras.map((t) => `<p>${esc(t)}</p>`).join("")}`
    + `<p style="margin:18px 0 0">Bien cordialement,</p><p style="margin:2px 0 22px"><strong>Cuillère d’Or</strong></p>${EMAIL_SIGNATURE}</div>`;
  const text = [`Bonjour ${first},`, "", ...paras.flatMap((t) => [t, ""]), "Bien cordialement,", "Cuillère d’Or", "",
    "Cheffe Huguette MVUNDA — Cuillère d’Or, traiteur", "07 83 74 89 71 · contact@cuilleredor.fr · cuilleredor.fr"].join("\n");
  return { subject, html, text };
}

/** Invitation à découvrir le site et le catalogue en ligne (mails de devis). */
const DISCOVER_TEXT = "Découvrez aussi notre univers et toutes nos formules sur notre site, et feuilletez notre catalogue en ligne pour composer votre menu :";

/** E-mail client au modèle Cuillère d’Or : intro, tableau récapitulatif, informations complémentaires, signature. */
export function charterEmail(req: RequestRow, quote: Quote, totals: Totals, link: string, withContract: boolean, unavailable = false): { subject: string; html: string; text: string } {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const first = firstName(req.client_name);
  const dateLong = req.event_date ? formatDateFR(req.event_date) : "";
  const type = (req.event_type || "événement").toLowerCase();
  const docs = withContract ? "votre devis ainsi que le contrat de prestation" : "votre devis";
  // Sans date valable (vide ou déjà passée), on ne peut pas confirmer la disponibilité : on la demande.
  const knownDate = Boolean(req.event_date) && req.event_date >= quote.issuedOn;
  const subject = `${withContract ? "Votre devis et contrat" : "Votre devis"} Cuillère d’Or — ${req.event_type}${knownDate ? ` du ${formatDateShort(req.event_date)}` : ""} — ${req.client_name}`;
  const intro1 = unavailable
    // Pas disponibles à cette date, mais le devis est envoyé au cas où le projet évolue.
    ? `Merci pour votre demande pour votre ${type}${knownDate ? ` du ${dateLong}` : ""}${req.event_place ? ` (${req.event_place})` : ""}. Malheureusement, nous ne sommes pas disponibles à cette date. Nous vous adressons tout de même votre devis, au cas où votre projet évoluerait (autre date, autre format) : n’hésitez pas à revenir vers nous.`
    : knownDate
    ? `Merci pour votre demande. Nous vous confirmons notre disponibilité pour votre ${type} du ${dateLong}${req.event_place ? ` (${req.event_place})` : ""}.`
    : `Merci pour votre demande pour votre ${type}${req.event_place ? ` (${req.event_place})` : ""}. La date de l’événement ne nous est pas parvenue : pourriez-vous nous l’indiquer ? Tant que nous ne la connaissons pas, nous ne pouvons pas vous confirmer notre disponibilité.`;
  // Sans lien : le devis (et le contrat) part en pièce jointe PDF.
  const intro2 = link
    ? `Vous trouverez ${docs} en ligne, téléchargeable${withContract ? "s" : ""} en PDF :`
    : `Vous trouverez ci-joint ${docs} en PDF.`;
  const rows = quote.lines.map((l) => {
    const pending = isTravelPending(l) || isLodgingPending(l);
    const qty = isTravelPending(l) ? `${formatEUR(l.price)}/km AR` : isLodgingPending(l) ? "—" : `${String(l.qty).replace(".", ",")} ${l.unit} × ${formatEUR(l.price)}`;
    return { label: l.label, qty, total: pending ? "à chiffrer" : formatEUR(lineTotal(l)) };
  });
  const infos = [
    `Validité du devis : 30 jours (jusqu’au ${formatDateFR(totals.validUntil)}).`,
    totals.fullAtSignature && knownDate
      ? `Confirmation : l’événement ayant lieu dans moins de deux mois, la réservation sera effective après signature${withContract ? " du contrat" : ""} et règlement de la totalité, soit ${formatEUR(totals.total)}.`
      : `Confirmation : la réservation sera effective après signature${withContract ? " du contrat" : " du devis"} et versement d’un acompte de 30 %, soit ${formatEUR(knownDate ? totals.deposit : round2(totals.total * PRICES.depositRate))}. Le solde restant de ${formatEUR(knownDate ? totals.balance : round2(totals.total - round2(totals.total * PRICES.depositRate)))} sera à régler ${totals.balanceDue && knownDate ? `au plus tard le ${formatDateFR(totals.balanceDue)}` : "au plus tard deux mois avant l’événement"}.`,
    // Caution toujours à part : elle ne fait pas partie du prix des prestations.
    !totals.caution ? "" : `Caution : ${formatEUR(totals.caution)}, à verser ${totals.fullAtSignature && knownDate ? "à la signature" : `avec le solde${totals.balanceDue && knownDate ? `, au plus tard le ${formatDateFR(totals.balanceDue)}` : ""}`}, en prévention de retard. Elle ne fait pas partie du prix des prestations et vous est restituée si aucun retard n’est constaté.`,
    withContract ? "Règlement par virement : les coordonnées bancaires figurent dans le contrat." : "",
  ].filter(Boolean);
  const reread = withContract
    ? "Nous vous invitons à bien relire et vérifier le devis et le contrat avant de les signer."
    : "Nous vous invitons à bien relire et vérifier le devis avant de le signer.";
  const td = "padding:11px 14px;border-bottom:1px solid #e6dccb;font-size:14px";
  const table = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:8px 0 18px;font-family:Arial,Helvetica,sans-serif">`
    + `<tr style="background:#0f1a14"><th style="padding:12px 14px;text-align:left;color:#c9a227;font-size:14px">Prestation</th><th style="padding:12px 14px;text-align:center;color:#c9a227;font-size:14px">Qté</th><th style="padding:12px 14px;text-align:right;color:#c9a227;font-size:14px">Total</th></tr>`
    + rows.map((r, i) => `<tr style="background:${i % 2 ? "#ffffff" : "#f6efe4"}"><td style="${td}">${esc(r.label)}</td><td style="${td};text-align:center;white-space:nowrap">${esc(r.qty)}</td><td style="${td};text-align:right;white-space:nowrap">${esc(r.total)}</td></tr>`).join("")
    + `<tr style="background:#0f1a14"><td colspan="2" style="padding:13px 14px;color:#ffffff;font-weight:bold;font-size:15px">TOTAL PRESTATIONS</td><td style="padding:13px 14px;text-align:right;color:#c9a227;font-weight:bold;font-size:15px;white-space:nowrap">${esc(formatEUR(totals.total))}</td></tr></table>`;
  const bold = (t: string) => esc(t).replace(/(\d[\d\s]*,\d\d\s?€)/g, "<strong>$1</strong>").replace(/(au plus tard le )([^,]+)/, "$1<strong>$2</strong>");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:680px">`
    + `<p>Bonjour ${esc(first)},</p><p>${esc(intro1)}</p>`
    + (link ? `<p>${esc(intro2)} <a href="${link}" target="_blank" rel="noopener noreferrer">${withContract ? "voir mon devis et mon contrat" : "voir mon devis"}</a></p>` : `<p>${esc(intro2)}</p>`)
    + `<p>Voici le récapitulatif de votre devis :</p>${table}`
    + `<p style="margin:0 0 6px"><strong>Informations complémentaires :</strong></p>`
    + `<ul style="margin:0 0 16px;padding-left:22px">${infos.map((t) => `<li style="margin-bottom:4px">${bold(t)}</li>`).join("")}</ul>`
    + `<p>${esc(reread)}</p>`
    + `<p>${esc(DISCOVER_TEXT)} <a href="https://cuilleredor.fr" target="_blank" rel="noopener noreferrer">cuilleredor.fr</a> · <a href="https://catalogue.cuilleredor.fr" target="_blank" rel="noopener noreferrer">catalogue en ligne</a></p>`
    + `<p>Je reste à votre entière disposition pour toute question ou ajustement.</p>`
    + `<p style="margin:18px 0 0">Bien cordialement,</p><p style="margin:2px 0 22px"><strong>Cuillère d’Or</strong></p>${EMAIL_SIGNATURE}</div>`;
  const text = [
    `Bonjour ${first},`, "", intro1, "", link ? `${intro2} ${link}` : intro2, "",
    "Voici le récapitulatif de votre devis :",
    ...rows.map((r) => `- ${r.label} : ${r.qty} = ${r.total}`),
    `TOTAL PRESTATIONS : ${formatEUR(totals.total)}`, "",
    "Informations complémentaires :", ...infos.map((t) => `- ${t}`), "",
    reread, "",
    `${DISCOVER_TEXT} https://cuilleredor.fr · catalogue en ligne : https://catalogue.cuilleredor.fr`, "",
    "Je reste à votre entière disposition pour toute question ou ajustement.", "",
    "Bien cordialement,", "Cuillère d’Or", "", "Cheffe Huguette MVUNDA — Cuillère d’Or, traiteur", "07 83 74 89 71 · contact@cuilleredor.fr · cuilleredor.fr",
  ].join("\n");
  return { subject, html, text };
}

// ---------- Origine et heure de réception d’une demande ----------

export const SOURCE_LABEL: Record<string, string> = {
  site: "Formulaire du site",
  google_sheet: "Google Form",
  manuel: "Saisie manuelle",
  wix: "Ancien site (Wix)",
  mariages_net: "Mariages.net",
};

// Date et heure de réception, à l’heure de Paris (ex. « 20/10/2026 à 12h30 »).
export function receivedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value || "";
  return `${g("day")}/${g("month")}/${g("year")} à ${g("hour")}h${g("minute")}`;
}

/**
 * « Options / remarques » du devis : on retire ce qui est déjà ailleurs ou interne
 * (formule demandée, contact souhaité, distance indiquée) et on garde les options et le message du client.
 */
/** Retire un message d’erreur technique resté dans d’anciennes demandes (« Unexpected token '<' … is not valid JSON »). */
export function withoutTechNoise(text: string): string {
  return (text || "").replace(/\s*\(Unexpected token[\s\S]*?(?:is not valid JSON\)|$)/g, "");
}

export function clientRemarks(text: string): string {
  return withoutTechNoise(text)
    // Certains anciens textes ont perdu leurs retours à la ligne : on recoupe avant chaque intitulé connu.
    .replace(/\s*(?=(Formule demandée|Options|Contact souhaité|Distance indiquée)\s*:)/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    // « Contact souhaité » : on ne garde que les demandes particulières (ajout, brunch, option, menu…).
    .map((l) => /^Contact souhaité\s*:/i.test(l)
      ? l.replace(/^Contact souhaité\s*:\s*/i, "").split(/,\s*(?=[A-ZÉ])/).filter((p) => /ajout|brunch|lendemain|option|menu|formule/i.test(p)).join(", ")
      : l)
    .filter((l) => l && !/^Distance indiquée\s*:/i.test(l))
    // « Formule demandée » : retirée si c'est le nom de la formule (déjà dans « Prestation souhaitée »),
    // gardée sans l'intitulé si le client y a écrit ses choix de plats.
    .filter((l) => !/^Formule demandée\s*:[\s\p{Extended_Pictographic}+\u200d\ufe0f]*(Formule\b|Vin d.honneur|Repas seul|Repas\s*\()/iu.test(l))
    .map((l) => l.replace(/^(Options|Formule demandée)\s*:\s*/i, ""))
    .join("\n");
}

/** Google Agenda ouvert sur le jour de l’événement (compte Cuillère d’Or), pour vérifier OFF et événements déjà prévus. */
export function agendaDayLink(date: string): string {
  const [y, m, d] = date.split("-");
  return `https://calendar.google.com/calendar/u/0/r/day/${y}/${Number(m)}/${Number(d)}?authuser=cuilleredor4%40gmail.com`;
}

// Options du Google Form → options du catalogue (libellés du formulaire, du plus précis au plus général).
const FORM_OPTION_RULES: Array<{ test: RegExp; preset: string; qty?: (text: string) => number | undefined }> = [
  { test: /kit vaisselle complet/i, preset: "kit-complet" },
  { test: /prestige/i, preset: "kit-prestige" },
  { test: /kit vaisselle essentiel|location de (la )?vaisselle/i, preset: "kit-essentiel" },
  { test: /serviette en tissu/i, preset: "serviette" },
  { test: /wedding.?cake|g[âa]teau/i, preset: "gateau" },
  { test: /service (des )?boissons/i, preset: "serveurs", qty: (t) => Number(t.match(/(\d+)\s*serveurs?/i)?.[1]) || undefined },
  { test: /mange.?debout/i, preset: "mange-debout", qty: (t) => Number(t.match(/(\d+)\s*mange|mange.?debouts?\s*x\s*(\d+)/i)?.slice(1).find(Boolean)) || undefined },
  { test: /fromage/i, preset: "fromages" },
  { test: /forfait soft/i, preset: "soft" },
];

/** Lignes du devis pour les options cochées dans le formulaire ; le message rendu ne garde que les options non reconnues. */
export function formOptions(message: string, adults: number, totalGuests: number, tableGuests = totalGuests): { lines: QuoteLine[]; message: string } {
  const lines: QuoteLine[] = [];
  const kept = (message || "").split("\n").map((line) => {
    const m = line.match(/^\s*Options\s*:\s*(.*)$/i);
    if (!m) return line;
    const rest: string[] = [];
    // Les choix sont séparés par des virgules suivies d’une majuscule (les détails contiennent aussi des virgules).
    for (const part of m[1].split(/,\s*(?=[A-ZÉÈÀÂ+])/).map((p) => p.trim()).filter(Boolean)) {
      if (/menu prestataire/i.test(part)) continue; // déjà compté avec les prestataires
      const rule = FORM_OPTION_RULES.find((r) => r.test.test(part));
      const preset = rule && OPTION_PRESETS.find((p) => p.id === rule.preset);
      if (!preset) { rest.push(part); continue; }
      if (lines.some((l) => l.id === `form-${preset.id}`)) continue;
      // Un seul kit vaisselle : le premier cité (le plus précis) l’emporte.
      if (preset.id.startsWith("kit-") && lines.some((l) => l.id.startsWith("form-kit-"))) continue;
      const line = presetToLine(preset, adults, totalGuests, tableGuests);
      const qty = rule!.qty?.(part);
      lines.push({ ...line, id: `form-${preset.id}`, qty: qty || line.qty });
      // Une précision écrite par le client (« 2 serveurs pour les boissons ») reste visible.
      const extra = part.includes(")") ? part.replace(/^.*\)\s*,?\s*/, "").trim() : "";
      if (extra) rest.push(extra);
    }
    return rest.length ? `Options : ${rest.join(", ")}` : "";
  });
  return { lines, message: kept.filter(Boolean).join("\n") };
}

/** Les frais de déplacement restent toujours la dernière ligne du devis. */
export function travelLast(lines: QuoteLine[]): QuoteLine[] {
  const travel = (l: QuoteLine) => l.id === "deplacement" || /d[ée]placement/i.test(l.label);
  return [...lines.filter((l) => !travel(l)), ...lines.filter(travel)];
}

/** « Ajouter le brunch le lendemain pour 100 personnes » écrit par le client → ligne Brunch Signature du lendemain. */
export function brunchNextDay(message: string, adults: number): QuoteLine | null {
  const text = (message || "").split("\n").filter((l) => !/^\s*Formule demandée\s*:/i.test(l)).join(" ");
  if (!/brunch/i.test(text) || !/lendemain|ajout/i.test(text)) return null;
  const qty = Number(text.match(/brunch[^.]*?(\d{2,4})\s*(personnes|pers|convives|invités)/i)?.[1]) || adults;
  return {
    id: "brunch-lendemain",
    qty,
    unit: "pers.",
    label: "Brunch Signature — le lendemain",
    detail: FORMULAS.brunch.detail,
    price: FORMULAS.brunch.flat!,
  };
}

// Périodes OFF d’Huguette (dates incluses). Les demandes à ces dates reçoivent une réponse négative.
export const OFF_PERIODS: Array<{ from: string; to: string; label: string }> = [
  { from: "2027-08-21", to: "2027-09-01", label: "OFF du 21/08 au 01/09/2027" },
];

export function offPeriod(date: string): { from: string; to: string; label: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return null;
  return OFF_PERIODS.find((p) => date >= p.from && date <= p.to) || null;
}

// ---------- Prestations incluses / options (deux blocs du devis) ----------

const INCLUDED_IDS = new Set(["main", "vin-honneur", "enfants", "prestataires"]);

/** Ligne du bloc « Prestations incluses » (sinon : bloc « Options »). */
export function isIncluded(line: QuoteLine): boolean {
  return INCLUDED_IDS.has(line.id) || line.id.startsWith("inc-");
}

/** Range une ligne dans l’un ou l’autre bloc en ajustant son identifiant (« inc-… » ou « x-… »). */
export function withGroup(line: QuoteLine, included: boolean): QuoteLine {
  if (isIncluded(line) === included) return line;
  const base = line.id.replace(/^(inc-|x-)/, "");
  const id = included ? (INCLUDED_IDS.has(base) ? base : `inc-${base}`) : INCLUDED_IDS.has(base) ? `x-${base}` : base;
  return { ...line, id };
}

/** Ordre du devis : prestations incluses, puis options, déplacement toujours en dernier. */
export function groupOrder(lines: QuoteLine[]): QuoteLine[] {
  return travelLast([...lines.filter(isIncluded), ...lines.filter((l) => !isIncluded(l))]);
}

// ---------- Réponse type Mariages.net (à coller dans leur messagerie) ----------

/** Nombre d’invités écrit par le couple (« pour 180 personnes », « 150 invités »…), sinon 0. */
export function guestsFromText(text: string): number {
  const m = (text || "").match(/(\d{2,4})\s*(personnes|pers\b|invités|invites|convives|adultes)/i);
  return m ? Number(m[1]) : 0;
}

/** Message court et personnalisé pour répondre à une demande Mariages.net, avec une fourchette quand c’est possible. */
export function mariagesNetReply(req: RequestRow): { subject: string; html: string; text: string } {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const first = firstName(req.client_name);
  const when = req.event_date && req.event_date >= todayISO() ? ` du ${formatDateFR(req.event_date)}` : "";
  const guests = req.adults || guestsFromText(req.message);
  const venue = (req.message.match(/choisi\s+(?:comme lieu de réception\s+)?((?:le|la|les|l’|l')\s*[^.,!?\n]{3,60})/i)?.[1] || "").trim();
  const round = (n: number) => Math.round(n / 100) * 100;
  // Fourchette : du buffet au service à l’assiette, vin d’honneur et service compris (paliers selon le nombre d’invités).
  const low = guests ? round(guests * (tierPrice("buffet", guests) + PRICES.honorWine)) : 0;
  const high = guests ? round(guests * (tierPrice("assiette", guests) + PRICES.honorWine)) : 0;
  const nb = (n: number) => n.toLocaleString("fr-FR").replace(/\u202f/g, " ");
  const paras = [
    `Merci pour votre message et toutes nos félicitations pour votre mariage${when}${venue ? ` (${venue})` : ""} !`,
    guests
      ? `Pour ${guests} invités, comptez environ ${nb(low)} € à ${nb(high)} € pour le vin d’honneur et le repas, service compris, selon la formule choisie : buffet, plateau ou service à l’assiette.`
      : "Nos formules vont de 40 € à 75 € par personne pour le vin d’honneur et le repas, service compris : buffet, plateau ou service à l’assiette, avec des tarifs dégressifs pour les grandes réceptions.",
    "Vous pouvez découvrir nos menus dans le catalogue en ligne : https://catalogue.cuilleredor.fr",
    "Et estimer votre réception en 2 minutes sur notre site : https://cuilleredor.fr/#calculateur",
    `Pour un devis détaillé, il nous suffit ${missingInfo(guests, venue)}. Nous restons disponibles au 07 83 74 89 71.`,
  ];
  const sign = ["Au plaisir d’échanger avec vous,", "Cheffe Huguette — Cuillère d’Or"];
  const link = (t: string) => esc(t).replace(/(https:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px">`
    + `<p>Bonjour ${esc(first)},</p>${paras.map((t) => `<p>${link(t)}</p>`).join("")}<p>${sign.map(esc).join("<br>")}</p></div>`;
  const text = [`Bonjour ${first},`, "", ...paras.flatMap((t) => [t, ""]), ...sign].join("\n");
  return { subject: "Votre mariage — Cuillère d’Or", html, text };
}

/** « du nombre d’invités, du lieu et de la formule qui vous plaît » sans redemander ce que le couple a déjà donné. */
function missingInfo(guests: number, venue: string): string {
  const parts = [guests ? "" : "du nombre d’invités", venue ? "" : "du lieu", "de la formule qui vous plaît"].filter(Boolean);
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}` : parts[0];
}

/** « Avec vin d’honneur » : 10 pièces et 4 cocktails au choix, en supplément par adulte (prestations incluses du devis). */
export function honorWineLines(adults: number): QuoteLine[] {
  return [
    { id: "vin-honneur", qty: adults, unit: "pers.", label: "Suppl. vin d’honneur — 10 pièces au choix", detail: "10 pièces par personne, au choix parmi nos mignardises salées et sucrées", price: PRICES.honorWine },
    { id: "inc-vh-cocktails", qty: adults, unit: "pers.", label: "Suppl. vin d’honneur — 4 cocktails au choix", detail: "4 cocktails par personne, au choix parmi nos cocktails", price: PRICES.honorWine },
  ];
}

/** Lignes du vin d’honneur déjà présentes (anciens et nouveaux libellés). */
export const isHonorWineLine = (l: QuoteLine) => l.id === "vin-honneur" || /vh-cocktails$/.test(l.id) || /^(Suppl\. )?vin d’honneur —/i.test(l.label);

// ---------- Avenants ----------

/** Photo du devis et des infos de l’événement à un instant donné (signature, avenant). */
export type Snapshot = {
  at: string;
  quote: Quote;
  event_date: string;
  event_place: string;
  event_type: string;
  formula: string;
  adults: number;
  children: number;
  providers: number;
};

export type Amendment = { id: number; request_id: number; number: number; created_at: string; reason: string; before_json: string; after_json: string; sent_on: string; signed_on: string };
export type AmendmentChange = { kind: "info" | "ajout" | "retrait" | "modif"; label: string; before: string; after: string; delta: number };

export function snapshotOf(row: RequestRow, at = new Date().toISOString()): Snapshot {
  return {
    at, quote: parseQuote(row), event_date: row.event_date, event_place: row.event_place, event_type: row.event_type,
    formula: row.formula, adults: row.adults, children: row.children, providers: row.providers,
  };
}

export function parseSnapshot(json: string | undefined | null): Snapshot | null {
  if (!json) return null;
  try { const s = JSON.parse(json) as Snapshot; return s && s.quote && Array.isArray(s.quote.lines) ? s : null; } catch { return null; }
}

const guestsText = (s: Snapshot) =>
  `${s.adults} adultes${s.children ? ` + ${s.children} enfants` : ""}${s.providers ? ` + ${s.providers} prestataires` : ""}`;
const lineText = (l: QuoteLine) =>
  isTravelPending(l) || isLodgingPending(l) ? "à chiffrer" : `${String(l.qty).replace(".", ",")} ${l.unit} × ${formatEUR(l.price)}`;

/** Différences entre deux versions : infos de l’événement puis lignes ajoutées, retirées ou modifiées. */
export function amendmentChanges(before: Snapshot, after: Snapshot): AmendmentChange[] {
  const out: AmendmentChange[] = [];
  const info = (label: string, a: string, b: string) => { if (a.trim() !== b.trim()) out.push({ kind: "info", label, before: a || "—", after: b || "—", delta: 0 }); };
  info("Date de l’événement", before.event_date ? formatDateFR(before.event_date) : "", after.event_date ? formatDateFR(after.event_date) : "");
  info("Lieu", before.event_place, after.event_place);
  info("Type d’événement", before.event_type, after.event_type);
  info("Formule", FORMULAS[before.formula as FormulaKey]?.label || before.formula, FORMULAS[after.formula as FormulaKey]?.label || after.formula);
  info("Invités", guestsText(before), guestsText(after));
  // Le report de date déplace aussi l’échéance du solde (2 mois avant l’événement).
  const due = (x: Snapshot) => computeTotals({ ...x.quote, issuedOn: before.quote.issuedOn }, x.event_date).balanceDue;
  info("Date limite du solde et de la caution", due(before) ? formatDateFR(due(before)) : "", due(after) ? formatDateFR(due(after)) : "");
  const old = new Map(before.quote.lines.map((l) => [l.id, l]));
  for (const l of after.quote.lines) {
    const o = old.get(l.id);
    if (!o) { out.push({ kind: "ajout", label: l.label, before: "—", after: lineText(l), delta: lineTotal(l) }); continue; }
    old.delete(l.id);
    if (o.qty !== l.qty || o.price !== l.price || o.label.trim() !== l.label.trim() || (o.unit || "") !== (l.unit || "") || (o.detail || "").trim() !== (l.detail || "").trim()) {
      const what = o.label.trim() !== l.label.trim() ? `${o.label} → ${l.label}` : l.label;
      const detailOnly = o.qty === l.qty && o.price === l.price && o.label.trim() === l.label.trim();
      out.push({ kind: "modif", label: detailOnly ? `${what} (détail modifié)` : what, before: lineText(o), after: lineText(l), delta: round2(lineTotal(l) - lineTotal(o)) });
    }
  }
  for (const o of old.values()) out.push({ kind: "retrait", label: o.label, before: lineText(o), after: "—", delta: -lineTotal(o) });
  return out;
}

export function amendmentFileName(req: RequestRow, n: number): string {
  return quoteFileName(req).replace(/_Devis_Contrat$/, `_Avenant_${n}`);
}
