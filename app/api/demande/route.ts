import { db, json, newToken } from "../../../lib/server";
import { isFormulaKey } from "../../../lib/quote";
import { prepareAndNotify } from "../../../lib/automation";

const SERVICE_MODES = ["service", "livraison", "emporter"];

// Demande de devis envoyée depuis le site (formulaire natif). Publique, donc validée strictement.
const clamp = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const int = (value: unknown, max = 5000) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
};

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Requête invalide" }, { status: 400 });
  }
  if (clamp(body.website, 100)) return json({ ok: true }); // champ piège anti-robots

  const name = clamp(body.name, 120);
  const email = clamp(body.email, 160);
  const phone = clamp(body.phone, 40);
  const eventDate = clamp(body.eventDate, 10);
  const formula = clamp(body.formula, 20);
  const errors: string[] = [];
  if (name.length < 2) errors.push("Indiquez votre nom et prénom.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push("Indiquez une adresse e-mail valide.");
  if (phone.replace(/\D/g, "").length < 9) errors.push("Indiquez un numéro de téléphone valide.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) errors.push("Indiquez la date de l’événement.");
  if (!isFormulaKey(formula)) errors.push("Choisissez une formule.");
  if (errors.length) return json({ error: errors.join(" ") }, { status: 400 });

  const adults = int(body.adults);
  if (adults < 1) return json({ error: "Indiquez le nombre d’adultes." }, { status: 400 });

  let estimateJson = "";
  if (body.estimate && typeof body.estimate === "object") {
    estimateJson = JSON.stringify(body.estimate).slice(0, 8000);
  }

  const now = new Date().toISOString();
  const token = newToken();
  const inserted = await db()
    .prepare(
      `INSERT INTO requests (token, created_at, updated_at, status, source, client_name, client_email, client_phone,
        event_type, event_date, event_place, formula, adults, children, providers, honor_wine, budget,
        estimate_json, selection_text, message, service_mode, wedding_planner, vendors_found)
       VALUES (?, ?, ?, 'nouvelle', 'site', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      token, now, now, name, email, phone,
      clamp(body.eventType, 60) || "Mariage",
      eventDate,
      clamp(body.place, 240),
      formula,
      adults,
      int(body.children),
      int(body.providers),
      body.honorWine === false ? 0 : 1,
      clamp(body.budget, 40),
      estimateJson,
      clamp(body.selection, 4000),
      clamp(body.message, 2000),
      SERVICE_MODES.includes(clamp(body.serviceMode, 20)) ? clamp(body.serviceMode, 20) : "service",
      ["oui", "non", "recherche"].includes(clamp(body.weddingPlanner, 20)) ? clamp(body.weddingPlanner, 20) : "",
      clamp(body.vendorsFound, 300),
    )
    .run();
  // Devis calculé et relectrice prévenue tout de suite ; un échec ici n'empêche pas la demande d'être enregistrée.
  const id = inserted.meta.last_row_id;
  if (id) await prepareAndNotify(id, new URL(request.url).origin);
  return json({ ok: true });
}
