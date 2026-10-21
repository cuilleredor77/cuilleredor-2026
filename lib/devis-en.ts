// Version anglaise du devis et du contrat : formats (montants, dates, unités) et traduction des libellés du catalogue.
// Les textes propres à un client (menu, remarque…) se saisissent en anglais dans la fiche (labelEn, detailEn, noteEn…).
import { formatDateFR, formatEUR, type QuoteLine } from "./quote";

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
