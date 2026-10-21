// Version anglaise du devis et du contrat : formats (montants, dates, unités) et traduction des libellés du catalogue.
// Les textes propres à un client (menu, remarque…) se saisissent en anglais dans la fiche (labelEn, detailEn, noteEn…).
import { PRICES, firstName, formatDateFR, formatDateShort, formatEUR, isLodgingPending, isTravelPending, lineTotal, round2, type Quote, type QuoteLine, type RequestRow, type Totals } from "./quote";

export type Lang = "fr" | "en";

export const isLang = (v: unknown): v is Lang => v === "fr" || v === "en";

/** « €12,692.80 » en anglais, « 12 692,80 € » en français. */
export function money(n: number, lang: Lang): string {
  if (lang === "fr") return formatEUR(n);
  return `€${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** « Tuesday 27 July 2027 » / « mardi 27 juillet 2027 ». */
export function dateText(iso: string, lang: Lang, withWeekday = false): string {
  if (lang === "fr") return formatDateFR(iso, withWeekday);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return iso || "";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: withWeekday ? "long" : undefined, day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** « 21 October 2026 at 14:05 » (heure de Paris). */
export function dateTimeText(iso: string, lang: Lang, frText: (iso: string) => string): string {
  if (lang === "fr") return frText(iso);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(d);
  return `${date} at ${time}`;
}

const UNITS: Record<string, string> = {
  "pers.": "guests", "pers": "guests", "enf.": "children", "kit": "kit", "kits": "kits", "forfait": "flat rate",
  "serveur": "server", "serveurs": "servers", "km AR": "km round trip", "unité": "unit", "unités": "units",
  "litre": "litre", "litres": "litres", "nappes": "tablecloths", "couverts": "covers",
};
export const unitText = (unit: string, lang: Lang) => (lang === "fr" ? unit : UNITS[unit.trim()] ?? unit);

// Expressions du catalogue, des plus longues aux plus courtes (la première qui correspond est remplacée).
const PHRASES: Array<[RegExp, string]> = [
  [/Suppl\. vin d’honneur — 10 pièces au choix/gi, "Cocktail reception supplement — 10 canapés of your choice"],
  [/Suppl\. vin d’honneur — 4 cocktails au choix/gi, "Cocktail reception supplement — 4 cocktails of your choice"],
  [/10 pièces par personne, au choix parmi nos mignardises salées et sucrées/gi, "10 pieces per guest, chosen from our sweet and savoury canapés"],
  [/4 cocktails par personne, au choix parmi nos cocktails/gi, "4 cocktails per guest, chosen from our cocktail menu"],
  [/Formule Brunch signature avec service compris/gi, "Signature brunch with service included"],
  [/Location kit vaisselle Essentiel/gi, "Essential tableware kit rental"],
  [/Location kit vaisselle Complet/gi, "Complete tableware kit rental"],
  [/Location kit vaisselle Prestige/gi, "Prestige tableware kit rental"],
  [/Location kit vaisselle Argent/gi, "Silver tableware kit rental"],
  [/Location kit vaisselle essentiel/gi, "Essential tableware kit rental"],
  [/Kit vaisselle Essentiel/gi, "Essential tableware kit"],
  [/Kit vaisselle Complet/gi, "Complete tableware kit"],
  [/Kit vaisselle Prestige/gi, "Prestige tableware kit"],
  [/2 assiettes, verre à eau, verre à vin, couverts/gi, "2 plates, water glass, wine glass, cutlery"],
  [/3 assiettes, verres eau, vin et champagne, couverts/gi, "3 plates, water, wine and champagne glasses, cutlery"],
  [/2 assiettes, 2 verres, couverts argentés/gi, "2 plates, 2 glasses, silver cutlery"],
  [/2 assiettes, 2 verres, couverts/gi, "2 plates, 2 glasses, cutlery"],
  [/Kit Complet \+ sous-plat perlé/gi, "Complete kit + beaded charger plate"],
  [/Dressage des tables compris avec la vaisselle louée/gi, "Table setting included with rented tableware"],
  [/Gestion des déchets alimentaires \(hors verre\)/gi, "Food waste management (excluding glass)"],
  [/Frais de déplacement aller-retour/gi, "Round-trip travel costs"],
  [/Depuis 8 Allée des Bois, 77240 Vert-Saint-Denis/gi, "From 8 Allée des Bois, 77240 Vert-Saint-Denis"],
  [/Frais de logement de l’équipe/gi, "Team accommodation costs"],
  [/Service des boissons tout au long de la soirée/gi, "Beverage service throughout the evening"],
  [/Service boissons tout au long de la soirée/gi, "Beverage service throughout the evening"],
  [/Service des boissons toute la soirée/gi, "Beverage service throughout the evening"],
  [/1 serveur (conseillé )?pour 50 convives/gi, "1 server per 50 guests"],
  [/Présentation, découpe et service (du wedding cake|du gâteau|de la pièce montée)/gi, "Presentation, cutting and serving of the wedding cake"],
  [/Présentation et découpe du wedding cake/gi, "Presentation and cutting of the wedding cake"],
  [/Assiette de fromages avant le dessert/gi, "Cheese plate before dessert"],
  [/\(adultes uniquement\)/gi, "(adults only)"],
  [/Menu enfants? \((3|5)[–-](12|à 12) ans\)/gi, "Children’s menu (ages 3–12)"],
  [/Menu enfant \(5 à 12 ans\)/gi, "Children’s menu (ages 5–12)"],
  [/Menu prestataires/gi, "Vendor meals"],
  [/wedding planner, photographe, DJ…/gi, "wedding planner, photographer, DJ…"],
  [/DJ, photographe, vidéaste…/gi, "DJ, photographer, videographer…"],
  [/Serviettes? en tissu/gi, "Cloth napkins"],
  [/Nappes rondes \(tables de 10\)/gi, "Round tablecloths (tables of 10)"],
  [/Nombre de tables à confirmer/gi, "Number of tables to be confirmed"],
  [/Sous-plat perlé/gi, "Beaded charger plate"],
  [/Mange-debout/gi, "Cocktail tables"],
  [/Étuve professionnelle/gi, "Professional food warmer"],
  [/Réchaud de buffet \(chafing dish\)/gi, "Chafing dish"],
  [/Installation complète/gi, "Full set-up"],
  [/Maître d’hôtel/gi, "Maître d’hôtel"],
  [/Forfait soft et eau/gi, "Soft drinks and water package"],
  [/Cocktails supplémentaires/gi, "Additional cocktails"],
  [/Vin d’honneur \+ (R|r)epas/g, "Cocktail reception + meal"],
  [/Vin d’honneur \+ service à l’assiette/gi, "Cocktail reception + plated service"],
  [/Vin d’honneur/g, "Cocktail reception"],
  [/vin d’honneur/g, "cocktail reception"],
  [/Repas — service à l’assiette/gi, "Meal — plated service"],
  [/Repas — service buffet/gi, "Meal — buffet service"],
  [/Repas — service plateau/gi, "Meal — platter service"],
  [/Repas/g, "Meal"],
  [/service à l’assiette/gi, "plated service"],
  [/service buffet/gi, "buffet service"],
  [/service plateau/gi, "platter service"],
  [/avec service compris/gi, "with service included"],
  [/entrée et plat, sans dessert/gi, "starter and main course, no dessert"],
  [/1 entrée, 1 plat, 1 dessert/gi, "1 starter, 1 main course, 1 dessert"],
  [/10 amuse-bouches \+ 4 cocktails offerts( au choix)?/gi, "10 canapés + 4 complimentary cocktails of your choice"],
  [/10 amuse-bouches par personne et 4 cocktails offerts au choix/gi, "10 canapés per guest and 4 complimentary cocktails of your choice"],
  [/2 viandes \| 2 poissons \| 4 accompagnements \| 1 légume \(au choix\)/gi, "2 meats | 2 fish | 4 sides | 1 vegetable (of your choice)"],
  [/Entrée : 1 choix \| Plat : 1 viande ou 1 poisson avec féculent ou légumes \| Dessert : 1 choix/gi, "Starter: 1 choice | Main: 1 meat or 1 fish with starch or vegetables | Dessert: 1 choice"],
  [/à chiffrer/gi, "to be quoted"],
  [/MARIAGE/g, "WEDDING"],
  [/BRUNCH DU LENDEMAIN/g, "NEXT-DAY BRUNCH"],
];

/** Traduction automatique des libellés standard ; le reste est laissé tel quel (à compléter dans la fiche). */
export function autoEn(text: string): string {
  let out = text || "";
  for (const [re, en] of PHRASES) out = out.replace(re, en);
  return out;
}

export const lineLabel = (l: QuoteLine, lang: Lang) => (lang === "fr" ? l.label : (l.labelEn?.trim() || autoEn(l.label)));
export const lineDetail = (l: QuoteLine, lang: Lang) => (lang === "fr" ? l.detail || "" : (l.detailEn?.trim() || autoEn(l.detail || "")));
export const textIn = (fr: string, en: string | undefined, lang: Lang) => (lang === "fr" ? fr : (en?.trim() || autoEn(fr)));

const EVENT_TYPES: Record<string, string> = { mariage: "Wedding", anniversaire: "Birthday", baptême: "Christening", bapteme: "Christening", fiançailles: "Engagement party", "événement professionnel": "Corporate event", séminaire: "Seminar", brunch: "Brunch", dot: "Traditional engagement (dot)" };
export const eventTypeText = (t: string, lang: Lang) => (lang === "fr" ? t : EVENT_TYPES[(t || "").trim().toLowerCase()] ?? t);

export function guestsLine(row: { formula: string; adults: number; children: number; providers: number }, lang: Lang): string {
  if (lang === "fr") {
    return row.formula === "chef"
      ? `${row.adults} couverts`
      : `${row.adults} adultes${row.children ? ` + ${row.children} enfants` : ""}${row.providers ? ` + ${row.providers} prestataires` : ""}`;
  }
  return row.formula === "chef"
    ? `${row.adults} covers`
    : `${row.adults} adults${row.children ? ` + ${row.children} children` : ""}${row.providers ? ` + ${row.providers} vendors` : ""}`;
}

// ---------- Mails en anglais (même modèle que les mails français) ----------

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const EMAIL_SIGNATURE_EN = `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;margin-top:4px"><tr>`
  + `<td style="padding:0 14px 0 0;border-right:2px solid #c9a227;vertical-align:middle"><img src="https://cuilleredor.fr/logo-cuillere-dor.png" alt="Cuillère d’Or" width="96" style="display:block;width:96px;height:auto"></td>`
  + `<td style="padding:0 0 0 14px;vertical-align:middle;font-size:13px;line-height:1.5;color:#1a1a1a"><strong>Chef Huguette MVUNDA</strong><br><span style="color:#6b5420">Cuillère d’Or — caterer</span><br>`
  + `<a href="tel:+33783748971" style="color:#1a1a1a;text-decoration:none">+33 7 83 74 89 71</a> · <a href="mailto:contact@cuilleredor.fr" style="color:#1a1a1a">contact@cuilleredor.fr</a><br>`
  + `<a href="https://cuilleredor.fr" target="_blank" rel="noopener noreferrer" style="color:#8b6914">cuilleredor.fr</a></td></tr></table>`;

const SIGN_TEXT_EN = ["Kind regards,", "Cuillère d’Or", "", "Chef Huguette MVUNDA — Cuillère d’Or, caterer", "+33 7 83 74 89 71 · contact@cuilleredor.fr · cuilleredor.fr"];

/** Mail de devis en anglais : même structure que charterEmail (intro, récapitulatif, informations, signature). */
export function charterEmailEn(req: RequestRow, quote: Quote, totals: Totals, link: string, withContract: boolean, unavailable = false): { subject: string; html: string; text: string } {
  const lang: Lang = "en";
  const m = (n: number) => money(n, lang);
  const first = firstName(req.client_name);
  const dateLong = req.event_date ? dateText(req.event_date, lang) : "";
  const type = eventTypeText(req.event_type || "event", lang).toLowerCase();
  const docs = withContract ? "your quote and the catering service agreement" : "your quote";
  const knownDate = Boolean(req.event_date) && req.event_date >= quote.issuedOn;
  const subject = `${withContract ? "Your quote and agreement" : "Your quote"} from Cuillère d’Or — ${eventTypeText(req.event_type, lang)}${knownDate ? ` on ${formatDateShort(req.event_date)}` : ""} — ${req.client_name}`;
  const intro1 = unavailable
    ? `Thank you for your enquiry about your ${type}${knownDate ? ` on ${dateLong}` : ""}${req.event_place ? ` (${req.event_place})` : ""}. Unfortunately, we are not available on that date. We are nevertheless sending you your quote in case your plans change (another date, another format): please do not hesitate to get back to us.`
    : knownDate
    ? `Thank you for your enquiry. We are pleased to confirm our availability for your ${type} on ${dateLong}${req.event_place ? ` (${req.event_place})` : ""}.`
    : `Thank you for your enquiry about your ${type}${req.event_place ? ` (${req.event_place})` : ""}. We have not received the date of the event: could you let us know? Until we have it, we cannot confirm our availability.`;
  const intro2 = link ? `You will find ${docs} online, downloadable as a PDF:` : `Please find ${docs} attached as a PDF.`;
  const rows = quote.lines.map((l) => {
    const pending = isTravelPending(l) || isLodgingPending(l);
    const qty = isTravelPending(l) ? `${m(l.price)}/km round trip` : isLodgingPending(l) ? "—" : `${l.qty} ${unitText(l.unit, lang)} × ${m(l.price)}`;
    return { label: lineLabel(l, lang), qty, total: pending ? "to be quoted" : m(lineTotal(l)) };
  });
  const deposit = knownDate ? totals.deposit : round2(totals.total * PRICES.depositRate);
  const balance = knownDate ? totals.balance : round2(totals.total - deposit);
  const infos = [
    `Quote validity: 30 days (until ${dateText(totals.validUntil, lang)}).`,
    totals.fullAtSignature && knownDate
      ? `Confirmation: as the event takes place in less than two months, the booking will be confirmed upon signature${withContract ? " of the agreement" : ""} and payment in full, i.e. ${m(totals.total)}.`
      : `Confirmation: the booking will be confirmed upon signature${withContract ? " of the agreement" : " of the quote"} and payment of a 30% deposit, i.e. ${m(deposit)}. The remaining balance of ${m(balance)} is payable ${totals.balanceDue && knownDate ? `no later than ${dateText(totals.balanceDue, lang)}` : "no later than two months before the event"}.`,
    !totals.caution ? "" : `Security deposit: ${m(totals.caution)}, payable ${totals.fullAtSignature && knownDate ? "upon signature" : `with the balance${totals.balanceDue && knownDate ? `, no later than ${dateText(totals.balanceDue, lang)}` : ""}`}, to cover any delay. It is not part of the price and is refunded if no delay occurs.`,
    withContract ? "Payment by bank transfer: the bank details are included in the agreement." : "",
  ].filter(Boolean);
  const reread = withContract ? "Please read and check the quote and the agreement carefully before signing them." : "Please read and check the quote carefully before signing it.";
  const discover = "Discover our world and all our packages on our website, and browse our online catalogue to compose your menu:";
  const td = "padding:11px 14px;border-bottom:1px solid #e6dccb;font-size:14px";
  const table = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:8px 0 18px;font-family:Arial,Helvetica,sans-serif">`
    + `<tr style="background:#0f1a14"><th style="padding:12px 14px;text-align:left;color:#c9a227;font-size:14px">Service</th><th style="padding:12px 14px;text-align:center;color:#c9a227;font-size:14px">Qty</th><th style="padding:12px 14px;text-align:right;color:#c9a227;font-size:14px">Total</th></tr>`
    + rows.map((r, i) => `<tr style="background:${i % 2 ? "#ffffff" : "#f6efe4"}"><td style="${td}">${esc(r.label)}</td><td style="${td};text-align:center;white-space:nowrap">${esc(r.qty)}</td><td style="${td};text-align:right;white-space:nowrap">${esc(r.total)}</td></tr>`).join("")
    + `<tr style="background:#0f1a14"><td colspan="2" style="padding:13px 14px;color:#ffffff;font-weight:bold;font-size:15px">TOTAL</td><td style="padding:13px 14px;text-align:right;color:#c9a227;font-weight:bold;font-size:15px;white-space:nowrap">${esc(m(totals.total))}</td></tr></table>`;
  const bold = (t: string) => esc(t).replace(/(€[\d,]+\.\d\d)/g, "<strong>$1</strong>").replace(/(no later than )([^,.]+(?:, \d{4})?)/, "$1<strong>$2</strong>");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:680px">`
    + `<p>Hello ${esc(first)},</p><p>${esc(intro1)}</p>`
    + (link ? `<p>${esc(intro2)} <a href="${link}" target="_blank" rel="noopener noreferrer">${withContract ? "view my quote and agreement" : "view my quote"}</a></p>` : `<p>${esc(intro2)}</p>`)
    + `<p>Here is a summary of your quote:</p>${table}`
    + `<p style="margin:0 0 6px"><strong>Additional information:</strong></p>`
    + `<ul style="margin:0 0 16px;padding-left:22px">${infos.map((t) => `<li style="margin-bottom:4px">${bold(t)}</li>`).join("")}</ul>`
    + `<p>${esc(reread)}</p>`
    + `<p>${esc(discover)} <a href="https://cuilleredor.fr" target="_blank" rel="noopener noreferrer">cuilleredor.fr</a> · <a href="https://catalogue.cuilleredor.fr" target="_blank" rel="noopener noreferrer">online catalogue</a></p>`
    + `<p>I remain at your entire disposal for any question or adjustment.</p>`
    + `<p style="margin:18px 0 0">Kind regards,</p><p style="margin:2px 0 22px"><strong>Cuillère d’Or</strong></p>${EMAIL_SIGNATURE_EN}</div>`;
  const text = [
    `Hello ${first},`, "", intro1, "", link ? `${intro2} ${link}` : intro2, "",
    "Here is a summary of your quote:",
    ...rows.map((r) => `- ${r.label}: ${r.qty} = ${r.total}`),
    `TOTAL: ${m(totals.total)}`, "",
    "Additional information:", ...infos.map((t) => `- ${t}`), "",
    reread, "",
    `${discover} https://cuilleredor.fr · online catalogue: https://catalogue.cuilleredor.fr`, "",
    "I remain at your entire disposal for any question or adjustment.", "",
    ...SIGN_TEXT_EN,
  ].join("\n");
  return { subject, html, text };
}

/** Réponse négative en anglais (date indisponible). */
export function unavailableEmailEn(req: RequestRow): { subject: string; html: string; text: string } {
  const lang: Lang = "en";
  const first = firstName(req.client_name);
  const type = eventTypeText(req.event_type || "event", lang).toLowerCase();
  const when = req.event_date ? ` on ${dateText(req.event_date, lang)}` : "";
  const subject = `Your Cuillère d’Or enquiry — ${eventTypeText(req.event_type, lang)}${req.event_date ? ` on ${formatDateShort(req.event_date)}` : ""} — ${req.client_name}`;
  const paras = [
    "Thank you for your enquiry and for your interest in Cuillère d’Or.",
    `Unfortunately, we are not available for your ${type}${when} and will therefore not be able to cater for it.`,
    "If your date is flexible, please feel free to suggest another one: we would be delighted to prepare a quote for you.",
    "We wish you a wonderful celebration.",
  ];
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:680px">`
    + `<p>Hello ${esc(first)},</p>${paras.map((t) => `<p>${esc(t)}</p>`).join("")}`
    + `<p style="margin:18px 0 0">Kind regards,</p><p style="margin:2px 0 22px"><strong>Cuillère d’Or</strong></p>${EMAIL_SIGNATURE_EN}</div>`;
  const text = [`Hello ${first},`, "", ...paras.flatMap((t) => [t, ""]), ...SIGN_TEXT_EN].join("\n");
  return { subject, html, text };
}
