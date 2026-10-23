// Lecture d'un message client collé (e-mail, WhatsApp, Instagram, Mariages.net) pour pré-remplir une nouvelle demande.
// Tout se fait dans la page, sans service extérieur : on repère e-mail, téléphone, date, lieu, invités et formule.
import type { FormulaKey } from "./quote";

export type PasteGuess = {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string; // AAAA-MM-JJ
  otherDates: string[]; // autres dates citées (2e jour, cérémonie…)
  place: string;
  formula: FormulaKey | "";
  adults: number;
  children: number;
  providers: number;
  honorWine: boolean;
  twoDays: boolean;
  found: string[]; // ce qui a été reconnu, pour l'afficher
};

const MOIS: Record<string, number> = {
  janvier: 1, janv: 1, jan: 1, fevrier: 2, fevr: 2, fev: 2, mars: 3, avril: 4, avr: 4, mai: 5, juin: 6,
  juillet: 7, juil: 7, aout: 8, septembre: 9, sept: 9, sep: 9, octobre: 10, oct: 10, novembre: 11, nov: 11, decembre: 12, dec: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const iso = (y: number, m: number, d: number) =>
  m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : "";

// Lignes d'en-tête des messageries (« 20 oct. 2026 13:35 (il y a 2 jours) », « À moi », « Envoyé depuis… »).
const HEADER = /\d{1,2}[:h]\d{2}|il y a \d|^(a|to|de|from|objet|subject|envoye|sent|cc)\s*:|^a moi$|^to me$/;

function dates(lines: string[], today: string): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const line = plain(raw);
    if (HEADER.test(line.trim())) continue;
    // « du 17 juin au 18 juin 2028 », « 17 et 18 juin 2028 » : l'année du second vaut pour le premier.
    const range = /(\d{1,2})(?:er)?\s*(?:([a-z]+)\.?\s*)?(?:au|et|-|&)\s*(\d{1,2})(?:er)?\s+([a-z]+)\.?\s+(\d{4})/g;
    for (const m of line.matchAll(range)) {
      const m2 = MOIS[m[4]], y = Number(m[5]);
      const m1 = m[2] && MOIS[m[2]] ? MOIS[m[2]] : m2;
      if (m2) out.push(iso(y, m1, Number(m[1])), iso(y, m2, Number(m[3])));
    }
    for (const m of line.matchAll(/(\d{1,2})(?:er)?\s+([a-z]+)\.?\s+(\d{4})/g)) {
      if (MOIS[m[2]]) out.push(iso(Number(m[3]), MOIS[m[2]], Number(m[1])));
    }
    for (const m of line.matchAll(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/g)) {
      const y = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
      out.push(iso(y, Number(m[2]), Number(m[1])));
    }
  }
  return [...new Set(out.filter((d) => d && d >= today))];
}

function count(text: string, words: string): number {
  // « 210 à 220 invités », « environ 91 adultes » : on garde le plus grand nombre.
  const re = new RegExp(`(\\d{1,4})(?:\\s*(?:a|-|/|ou)\\s*(\\d{1,4}))?\\s*(?:${words})\\b`, "g");
  let best = 0;
  for (const m of text.matchAll(re)) best = Math.max(best, Number(m[1]), Number(m[2] || 0));
  return best;
}

const VENUE = /\b(chateau|domaine|manoir|salle|ferme|abbaye|moulin|hotel|orangerie|mas|bastide|espace|pavillon|restaurant|eglise|mairie|parc|jardin|villa|clos|prieure|grange|longere)\b/i;

function place(lines: string[]): string {
  for (const raw of lines) {
    const p = plain(raw);
    const lieu = /\b(?:lieu|venue|adresse)\s*:\s*(.+)/i.exec(raw);
    if (lieu) return lieu[1].trim();
    const v = VENUE.exec(p);
    if (!v || HEADER.test(p)) continue;
    // Le nom du lieu, depuis le mot repéré jusqu'à la ponctuation ; on garde la casse d'origine.
    let venue = raw.slice(v.index).split(/[.,;!?\n()]/)[0].trim();
    venue = venue.replace(/\s+(?:et|pour|avec|le|nous)\s.*$/i, "").trim();
    venue = venue.charAt(0).toUpperCase() + venue.slice(1);
    // La ville : « à Jouy en Josas », « à Paris (75) », un code postal.
    const city = /(?:^|\s)(?:a|à)\s+([A-ZÉÈ][\wÀ-ÿ'’-]*(?:[\s-](?:en|sur|sous|le|la|les|de|du|des|lès|[A-ZÉÈ][\wÀ-ÿ'’-]*))*)/.exec(raw.slice(0, v.index) + " " + raw.slice(v.index + venue.length));
    const cp = /\b\d{5}\b[^,.\n]*/.exec(raw);
    const where = cp && !venue.includes(cp[0].slice(0, 5)) ? cp[0].trim() : city && !cp ? city[1].trim() : "";
    return [venue, where].filter(Boolean).join(", ");
  }
  return "";
}

function name(lines: string[], email: string): string {
  const looksLikeName = (s: string) =>
    /^[A-ZÀ-Ý][\wÀ-ÿ'’-]+(?:\s+(?:&|et|de|du|le|la|[A-ZÀ-Ý][\wÀ-ÿ'’-]+)){1,4}$/.test(s) && !/\d|@|:/.test(s) && s.length <= 60;
  const clean = lines.map((l) => l.trim()).filter(Boolean);
  // Signature (en fin de message), sinon l'expéditeur affiché en tête (copie depuis Gmail).
  const tail = clean.slice(-4).reverse().find(looksLikeName);
  const head = clean.slice(0, 2).find(looksLikeName);
  const intro = /(?:je m'appelle|je suis|moi c'est|my name is)\s+([A-ZÀ-Ý][\wÀ-ÿ'’-]+(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'’-]+)?)/i.exec(clean.join(" "));
  // « … Merci ! Aïcha 06 12 34 56 78 » : un prénom seul juste avant le numéro.
  const beforePhone = /([A-ZÀ-Ý][a-zà-ÿ'’-]+)\s*[:,-]?\s*(?:\+\d|0[1-9])[\d\s.]{8,}/.exec(clean.join(" "));
  const n = tail || head || (intro ? intro[1] : "") || (beforePhone && !/^(Merci|Bonjour|Tel|Tél)$/i.test(beforePhone[1]) ? beforePhone[1] : "");
  if (n) return n.replace(/\s+/g, " ");
  return email ? email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
}

export function guessRequest(text: string, today = new Date().toISOString().slice(0, 10)): PasteGuess {
  const lines = text.split(/\r?\n/);
  const p = plain(text);
  const found: string[] = [];
  // Coordonnées de Cuillère d'Or (en-tête des devis PDF) : jamais prises pour celles du client.
  const OWN = /cuilleredor|cuillere-dor|7\D?83\D?74\D?89\D?71/i;
  const email = [...text.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)].map((m) => m[0]).find((e) => !OWN.test(e)) || "";
  const phone = ([...text.matchAll(/(?:\+\d{2,3}[\s.]?\(?0?\)?[\s.]?|\b0)[1-9](?:[\s.-]?\d{2,4}){3,4}\b/g)].map((m) => m[0].trim()).find((t) => !OWN.test(t)) || "");
  const all = dates(lines, today);
  const adults = count(p, "adultes?|invites?|personnes?|convives?|pers|couverts|guests|people|pax");
  const children = count(p, "enfants?|children|kids");
  const providers = count(p, "prestataires?|vendors?");

  let formula: PasteGuess["formula"] = "";
  if (/a l'assiette|a l’assiette|service assiette|entree,? plat,? (?:et )?dessert|entree plat dessert|plated/.test(p)) formula = "assiette";
  else if (/plateau|sharing platters?|family-style/.test(p)) formula = "plateau";
  else if (/buffet(?! de bienvenue)/.test(p)) formula = "buffet";
  else if (/cocktail dinatoire|cocktail|aperitif|amuse-bouche|mignardises/.test(p)) formula = "aperitifs";
  else if (/brunch/.test(p)) formula = "brunch";
  else if (/barbecue|bbq/.test(p)) formula = "barbecue";
  else if (/chef a domicile|chef à domicile|diner a domicile/.test(p)) formula = "chef";

  const honorWine = /vin d'honneur|vin d’honneur|buffet de bienvenue|cocktail|amuse-bouche|\bpieces?\b|\bvdh\b/.test(p) && formula !== "aperitifs";
  const twoDays = (/lendemain|jour 2|deuxieme jour|day after/.test(p) || (/brunch/.test(p) && formula !== "brunch")) && all.length > 1;

  let eventType = "Mariage";
  if (/mariage civil/.test(p)) eventType = "Mariage civil";
  else if (/mariage religieux|benediction/.test(p)) eventType = "Mariage religieux";
  else if (/mariage|wedding|noces/.test(p)) eventType = "Mariage";
  else if (/anniversaire|birthday|\bans\b/.test(p)) eventType = "Anniversaire";
  else if (/bapteme|communion/.test(p)) eventType = "Baptême";
  else if (/gala|soiree d'entreprise|seminaire|entreprise|corporate/.test(p)) eventType = "Événement professionnel";
  else if (/fiancailles/.test(p)) eventType = "Fiançailles";

  // Documents structurés (devis PDF, formulaires) : « Nom du client : … », la valeur pouvant être sur la ligne suivante.
  const field = (label: RegExp) => {
    const clean = lines.map((l) => l.trim());
    for (let i = 0; i < clean.length; i++) {
      const m = new RegExp(`^(?:${label.source})\\s*:\\s*(.*)$`, "i").exec(clean[i]);
      if (!m) continue;
      const at = m[1].trim() ? i : i + 1 + clean.slice(i + 1).findIndex(Boolean);
      let value = m[1].trim() || clean[at] || "";
      // Adresse coupée sur deux lignes (« Château de …, » puis « Allée …, 95270 … ») : on rattache les suites.
      for (let k = at + 1; /(,|\b\d{5})\s*$/.test(value) && clean[k] && !/:/.test(clean[k]); k++) value = `${value} ${clean[k]}`;
      return value;
    }
    return "";
  };
  const fName = field(/nom du client|client name|nom et pr[ée]nom|nom|name|client/);
  const fPlace = field(/lieu|venue|adresse du lieu|lieu de la r[ée]ception/);
  const fType = field(/type(?: d['’]?[ée]v[ée]nement)?|event type/);
  const fDate = field(/date de l['’][ée]v[ée]nement|date du mariage|event date|date/);
  const fDates = fDate ? dates([fDate], today) : [];
  const g: PasteGuess = {
    name: fName && !/@|\d{4}/.test(fName) ? fName : name(lines, email), email, phone,
    eventType: fType ? fType.replace(/^wedding$/i, "Mariage").replace(/^birthday$/i, "Anniversaire") : eventType,
    eventDate: fDates[0] || all[0] || "", otherDates: all.filter((d) => d !== (fDates[0] || all[0])),
    place: fPlace || place(lines), formula, adults, children, providers, honorWine, twoDays, found,
  };
  if (g.name) found.push("nom");
  if (email) found.push("e-mail");
  if (phone) found.push("téléphone");
  if (g.eventDate) found.push(all.length > 1 ? `${all.length} dates` : "date");
  if (g.place) found.push("lieu");
  if (adults) found.push("invités");
  if (formula) found.push("formule");
  return g;
}
