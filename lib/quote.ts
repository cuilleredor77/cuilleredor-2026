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
      "Entrée : 1 choix | Plat : 1 viande ou 1 poisson avec féculent et légumes | Dessert : 1 choix",
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
};

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
};

export type EstimateOption = { id: string; label: string; amount: number };

export const lineTotal = (line: QuoteLine) => round2(line.qty * line.price);

/** Déplacement dont la distance n’est pas encore connue : affiché « à chiffrer ». */
export const isTravelPending = (line: QuoteLine) => /d[ée]placement/i.test(line.label) && !(line.qty > 0);

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
  basis: "guests" | "adults" | "one" | "servers";
  detail?: string;
};

export const OPTION_PRESETS: OptionPreset[] = [
  { id: "soft", label: "Forfait soft et eau (Coca-Cola, Fanta, Oasis, eau plate et gazeuse)", unit: "pers.", price: 5, basis: "guests" },
  { id: "vh-cocktails", label: "Vin d’honneur — 4 cocktails au choix", unit: "pers.", price: PRICES.honorWine, basis: "adults", detail: "4 cocktails par personne, au choix parmi nos cocktails" },
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
  { id: "kit-essentiel", label: "Kit vaisselle Essentiel (2 assiettes, verre à eau, verre à vin, couverts)", unit: "kit", price: 7, basis: "guests" },
  { id: "kit-complet", label: "Kit vaisselle Complet (3 assiettes, verres eau, vin et champagne, couverts)", unit: "kit", price: 10, basis: "guests" },
  { id: "kit-prestige", label: "Kit vaisselle Prestige (Kit Complet + sous-plat perlé)", unit: "kit", price: 13, basis: "guests" },
  { id: "serviette", label: "Serviette en tissu", unit: "pers.", price: 2, basis: "guests" },
  { id: "sous-plat", label: "Sous-plat perlé", unit: "unité", price: 3, basis: "one" },
  { id: "mange-debout", label: "Mange-debout (housse et nappe incluses)", unit: "unité", price: 15, basis: "one" },
  { id: "chafing", label: "Réchaud de buffet (chafing dish)", unit: "unité", price: 25, basis: "one" },
  { id: "etuve", label: "Étuve professionnelle", unit: "forfait", price: 150, basis: "one" },
  { id: "degustation", label: "Dégustation au restaurant Chez Lina (non déductible du devis)", unit: "pers.", price: 70, basis: "one" },
];

export function presetToLine(preset: OptionPreset, adults: number, totalGuests: number): QuoteLine {
  const qty =
    preset.basis === "guests"
      ? totalGuests
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

  if (meta.honorWine && req.honor_wine) {
    lines.push({
      id: "vin-honneur",
      qty: adults,
      unit: "pers.",
      label: "Vin d’honneur — 10 pièces au choix",
      detail: "10 pièces par personne, au choix parmi nos mignardises salées et sucrées",
      price: PRICES.honorWine,
    });
  }
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
  const form = estimate || isChef ? { lines: [], message: req.message } : formOptions(req.message, adults, totalGuests);
  lines.push(...form.lines);

  if (!isChef && wasteWanted) {
    lines.push({
      id: "dechets",
      qty: 1,
      unit: "forfait",
      label: "Gestion des déchets alimentaires (hors verre)",
      price: PRICES.waste,
    });
  }

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
      if (Array.isArray(q.lines)) return q;
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

export function computeTotals(quote: Quote, eventDate: string): Totals {
  const total = round2(quote.lines.reduce((sum, l) => sum + lineTotal(l), 0));
  const days = eventDate ? daysBetween(quote.issuedOn, eventDate) : 999;
  const fullAtSignature = days < PRICES.fullPaymentUnderDays;
  const deposit = fullAtSignature ? total : round2(total * PRICES.depositRate);
  const balance = round2(total - deposit);
  return {
    total,
    deposit,
    balance,
    balanceDue: fullAtSignature || !eventDate ? "" : nextWorkingDay(addMonths(eventDate, -2)),
    fullAtSignature,
    validUntil: addDays(quote.issuedOn, PRICES.validDays),
    caution: PRICES.caution,
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
  if (quote.lines.some((l) => !(l.price > 0) || !(l.qty > 0))) out.push("Une ligne a une quantité ou un prix à zéro.");
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

/** E-mail client au modèle Cuillère d’Or : intro, tableau récapitulatif, informations complémentaires, signature. */
export function charterEmail(req: RequestRow, quote: Quote, totals: Totals, link: string, withContract: boolean): { subject: string; html: string; text: string } {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const first = firstName(req.client_name);
  const dateLong = req.event_date ? formatDateFR(req.event_date) : "";
  const type = (req.event_type || "événement").toLowerCase();
  const docs = withContract ? "votre devis ainsi que le contrat de prestation" : "votre devis";
  // Sans date valable (vide ou déjà passée), on ne peut pas confirmer la disponibilité : on la demande.
  const knownDate = Boolean(req.event_date) && req.event_date >= quote.issuedOn;
  const subject = `${withContract ? "Votre devis et contrat" : "Votre devis"} Cuillère d’Or — ${req.event_type}${knownDate ? ` du ${formatDateShort(req.event_date)}` : ""} — ${req.client_name}`;
  const intro1 = knownDate
    ? `Merci pour votre demande. Nous vous confirmons notre disponibilité pour votre ${type} du ${dateLong}${req.event_place ? ` (${req.event_place})` : ""}.`
    : `Merci pour votre demande pour votre ${type}${req.event_place ? ` (${req.event_place})` : ""}. La date de l’événement ne nous est pas parvenue : pourriez-vous nous l’indiquer ? Tant que nous ne la connaissons pas, nous ne pouvons pas vous confirmer notre disponibilité.`;
  // Sans lien : le devis (et le contrat) part en pièce jointe PDF.
  const intro2 = link
    ? `Vous trouverez ${docs} en ligne, téléchargeable${withContract ? "s" : ""} en PDF :`
    : `Vous trouverez ci-joint ${docs} en PDF.`;
  const rows = quote.lines.map((l) => {
    const pending = isTravelPending(l);
    const qty = pending ? `${formatEUR(l.price)}/km AR` : `${String(l.qty).replace(".", ",")} ${l.unit} × ${formatEUR(l.price)}`;
    return { label: l.label, qty, total: pending ? "à chiffrer" : formatEUR(lineTotal(l)) };
  });
  const infos = [
    `Validité du devis : 30 jours (jusqu’au ${formatDateFR(totals.validUntil)}).`,
    totals.fullAtSignature && knownDate
      ? `Confirmation : l’événement ayant lieu dans moins de deux mois, la réservation sera effective après signature${withContract ? " du contrat" : ""} et règlement de la totalité, soit ${formatEUR(totals.total)}, accompagné de la caution de ${formatEUR(totals.caution)} (en prévention de retard, restituée si aucun retard constaté).`
      : `Confirmation : la réservation sera effective après signature${withContract ? " du contrat" : " du devis"} et versement d’un acompte de 30 %, soit ${formatEUR(knownDate ? totals.deposit : round2(totals.total * PRICES.depositRate))}. Le solde restant de ${formatEUR(knownDate ? totals.balance : round2(totals.total - round2(totals.total * PRICES.depositRate)))} sera à régler ${totals.balanceDue && knownDate ? `au plus tard le ${formatDateFR(totals.balanceDue)}` : "au plus tard deux mois avant l’événement"}, accompagné de la caution de ${formatEUR(totals.caution)} (en prévention de retard, restituée si aucun retard constaté).`,
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
    + `<p>Je reste à votre entière disposition pour toute question ou ajustement.</p>`
    + `<p style="margin:18px 0 0">Bien cordialement,</p><p style="margin:2px 0 22px"><strong>Cuillère d’Or</strong></p>${EMAIL_SIGNATURE}</div>`;
  const text = [
    `Bonjour ${first},`, "", intro1, "", link ? `${intro2} ${link}` : intro2, "",
    "Voici le récapitulatif de votre devis :",
    ...rows.map((r) => `- ${r.label} : ${r.qty} = ${r.total}`),
    `TOTAL PRESTATIONS : ${formatEUR(totals.total)}`, "",
    "Informations complémentaires :", ...infos.map((t) => `- ${t}`), "",
    reread, "",
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
    .filter((l) => l && !/^(Contact souhaité|Distance indiquée)\s*:/i.test(l))
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
export function formOptions(message: string, adults: number, totalGuests: number): { lines: QuoteLine[]; message: string } {
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
      const line = presetToLine(preset, adults, totalGuests);
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
