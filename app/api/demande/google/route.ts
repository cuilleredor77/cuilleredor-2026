import { db, json, newToken, setting } from "../../../../lib/server";
import { prepareAndNotify } from "../../../../lib/automation";

// Réponse du Google Form, transmise par le script Apps Script de la feuille (à chaque envoi du formulaire).
// Colonnes de la feuille : 0 horodateur, 1 e-mail, 2 nom, 3 prénom, 4 téléphone, 5 date, 6 type, 7 lieu,
// 9 distance, 10 adultes, 11 enfants, 12 prestataires, 13 formule, 14 options, 15 contact souhaité.
const cell = (values: unknown[], i: number, max: number) => String(values[i] ?? "").trim().slice(0, max);
const num = (s: string) => Number((s.replace(/\s/g, "").match(/\d+/) || ["0"])[0]);

function formulaOf(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("assiette")) return "assiette";
  if (t.includes("plateau")) return "plateau";
  if (t.includes("brunch")) return "brunch";
  if (t.includes("barbecue") || t.includes("bbq")) return "barbecue";
  if (t.includes("chef")) return "chef";
  if (t.includes("buffet")) return "buffet";
  if (t.includes("vin d") || t.includes("cocktail") || t.includes("mignardise") || t.includes("apéri")) return "aperitifs";
  return "buffet";
}

function honorWine(text: string): number {
  const t = text.toLowerCase().replace(/’/g, "'");
  return (t.includes("seul") && t.includes("repas")) || (!t.includes("vin d'honneur") && !t.includes("cocktail")) ? 0 : 1;
}

/** « 18/10/2026 22:14:48 » (heure de Paris) → ISO UTC ; « 03/06/2027 » → « 2027-06-03 ». */
function parisToIso(stamp: string): string {
  const m = stamp.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (!m) return new Date().toISOString();
  const asUtc = Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +m[6]);
  const paris = new Date(new Date(asUtc).toLocaleString("en-US", { timeZone: "Europe/Paris" })).getTime();
  const utc = new Date(new Date(asUtc).toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  return new Date(asUtc - (paris - utc)).toISOString();
}

export async function POST(request: Request) {
  const secret = setting("GFORM_SECRET");
  const body = (await request.json().catch(() => null)) as { secret?: string; values?: unknown[] } | null;
  if (!secret || !body || body.secret !== secret || !Array.isArray(body.values)) return json({ error: "Non autorisé" }, { status: 401 });
  const v = body.values;
  const email = cell(v, 1, 160).toLowerCase();
  const d = cell(v, 5, 10).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!email || !d) return json({ error: "E-mail ou date manquants" }, { status: 400 });
  const eventDate = `${d[3]}-${d[2]}-${d[1]}`;
  // Même réponse déjà reçue (même e-mail, même horodatage) : rien à faire.
  const created = parisToIso(cell(v, 0, 30));
  const exists = await db().prepare("SELECT id FROM requests WHERE client_email = ? AND created_at = ?").bind(email, created).first();
  if (exists) return json({ ok: true, duplicate: true });

  const formulaText = cell(v, 13, 300);
  const message = [
    formulaText ? `Formule demandée : ${formulaText}` : "",
    cell(v, 14, 800) ? `Options : ${cell(v, 14, 800)}` : "",
    cell(v, 15, 300) ? `Contact souhaité : ${cell(v, 15, 300)}` : "",
    cell(v, 9, 100) ? `Distance indiquée : ${cell(v, 9, 100)}` : "",
  ].filter(Boolean).join("\n");
  const now = new Date().toISOString();
  const inserted = await db()
    .prepare(
      `INSERT INTO requests (token, created_at, updated_at, status, source, client_name, client_email, client_phone,
        event_type, event_date, event_place, formula, adults, children, providers, honor_wine, message, internal_notes)
       VALUES (?, ?, ?, 'nouvelle', 'google_sheet', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      newToken(), created, now,
      `${cell(v, 3, 60)} ${cell(v, 2, 60)}`.trim(), email, cell(v, 4, 40),
      cell(v, 6, 60) || "Mariage", eventDate, cell(v, 7, 240),
      formulaOf(formulaText), Math.min(num(cell(v, 10, 20)), 5000), Math.min(num(cell(v, 11, 20)), 5000), Math.min(num(cell(v, 12, 20)), 5000),
      honorWine(formulaText), message.slice(0, 2000), "Reçue du Google Form.",
    )
    .run();
  const id = inserted.meta.last_row_id;
  if (id) await prepareAndNotify(id, new URL(request.url).origin);
  return json({ ok: true });
}
