import { db, isAdmin, json, newToken, requireAdmin } from "../../../../lib/server";
import { computeTotals, isFormulaKey, parseQuote, type RequestRow } from "../../../../lib/quote";

const ARCHIVE_AFTER_DAYS = 45;

export async function GET(request: Request) {
  if (!(await isAdmin(request))) return json({ error: "Non autorisé" }, { status: 401 });
  // Archivage automatique : 45 jours sans activité (depuis le dernier envoi ou la dernière relance, sinon la réception),
  // sauf demandes signées ou avec acompte.
  const limit = new Date(Date.now() - ARCHIVE_AFTER_DAYS * 86_400_000).toISOString();
  await db()
    .prepare("UPDATE requests SET status = 'archivee', updated_at = ? WHERE COALESCE(sent_at, created_at) < ? AND status NOT IN ('archivee', 'abandonnee', 'signe', 'acompte')")
    .bind(new Date().toISOString(), limit)
    .run();
  const { results } = await db()
    .prepare("SELECT * FROM requests ORDER BY created_at ASC")
    .all<RequestRow>();
  const rows = results.map((row) => {
    const totals = computeTotals(parseQuote(row), row.event_date);
    return {
      id: row.id,
      createdAt: row.created_at,
      source: row.source,
      status: row.status,
      name: row.client_name,
      email: row.client_email,
      phone: row.client_phone,
      eventType: row.event_type,
      eventDate: row.event_date,
      place: row.event_place,
      formula: row.formula,
      adults: row.adults,
      children: row.children,
      providers: row.providers,
      total: totals.total,
      sentAt: row.sent_at,
      hasQuote: Boolean(row.quote_json),
      // Demandes Mariages.net : lien direct pour y répondre (pas d’e-mail du client).
      replyUrl: row.internal_notes.match(/Répondre : (https:\/\/\S+)/)?.[1] || "",
    };
  });
  return json({ requests: rows });
}

// Création manuelle d'une demande (reçue par téléphone, WhatsApp ou e-mail).
export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const num = (v: unknown) => Math.max(0, Math.floor(Number(v)) || 0);
  const formula = text(body.formula, 20);
  const now = new Date().toISOString();
  const token = newToken();
  const result = await db()
    .prepare(
      `INSERT INTO requests (token, created_at, updated_at, status, source, client_name, client_email, client_phone,
        event_type, event_date, event_place, formula, adults, children, providers, honor_wine, message)
       VALUES (?, ?, ?, 'nouvelle', 'manuel', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      token, now, now,
      text(body.name, 120),
      text(body.email, 160),
      text(body.phone, 40),
      text(body.eventType, 60) || "Mariage",
      text(body.eventDate, 10),
      text(body.place, 240),
      isFormulaKey(formula) ? formula : "buffet",
      num(body.adults),
      num(body.children),
      num(body.providers),
      body.honorWine === false ? 0 : 1,
      text(body.message, 2000),
    )
    .run();
  return json({ ok: true, id: result.meta.last_row_id });
}
