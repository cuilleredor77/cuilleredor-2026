import { db, getRequestById, json, requireAdmin, setting } from "../../../../../lib/server";
import { markSheetSent } from "../../../../../lib/automation";
import {
  buildDefaultQuote,
  computeTotals,
  isFormulaKey,
  parseQuote,
  snapshotOf,
  type Quote,
} from "../../../../../lib/quote";

const STATUSES = ["nouvelle", "en_cours", "devis_pret", "envoye", "signe", "acompte", "archivee", "abandonnee"];

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const row = await getRequestById(Number(id));
  if (!row) return json({ error: "Demande introuvable" }, { status: 404 });
  const quote = parseQuote(row);
  const amendments = (await db().prepare("SELECT * FROM amendments WHERE request_id = ? ORDER BY number").bind(row.id).all()).results;
  return json({ request: row, quote, totals: computeTotals(quote, row.event_date), sheetFinderUrl: setting("GSHEET_FINDER_URL"), amendments });
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const existing = await getRequestById(Number(id));
  if (!existing) return json({ error: "Demande introuvable" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as {
    request?: Record<string, unknown>;
    quote?: Quote;
    regenerate?: boolean;
    markSent?: boolean;
    relaunched?: boolean;
    answered?: boolean;
    status?: string;
  };
  const r = body.request || {};
  const text = (v: unknown, fallback: string, max: number) =>
    typeof v === "string" ? v.trim().slice(0, max) : fallback;
  const num = (v: unknown, fallback: number) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  const formula = text(r.formula, existing.formula, 20);
  const kmRaw = r.km === null || r.km === "" ? null : Number(r.km);

  const next = {
    ...existing,
    client_name: text(r.client_name, existing.client_name, 120),
    client_email: text(r.client_email, existing.client_email, 160),
    client_phone: text(r.client_phone, existing.client_phone, 40),
    billing_address: text(r.billing_address, existing.billing_address, 300),
    event_type: text(r.event_type, existing.event_type, 60),
    event_date: text(r.event_date, existing.event_date, 10),
    event_place: text(r.event_place, existing.event_place, 240),
    formula: isFormulaKey(formula) ? formula : existing.formula,
    adults: num(r.adults, existing.adults),
    children: num(r.children, existing.children),
    providers: num(r.providers, existing.providers),
    honor_wine: r.honor_wine === undefined ? existing.honor_wine : r.honor_wine ? 1 : 0,
    km: kmRaw === null || !Number.isFinite(kmRaw) || kmRaw < 0 ? null : Math.round(kmRaw * 10) / 10,
    internal_notes: text(r.internal_notes, existing.internal_notes, 4000),
  };

  let quote: Quote | null = body.quote ?? null;
  if (body.regenerate) quote = buildDefaultQuote({ ...next, quote_json: "" });
  const quoteJson = quote ? JSON.stringify(quote) : existing.quote_json;

  let status = body.status && STATUSES.includes(body.status) ? body.status : existing.status;
  let sentAt = existing.sent_at;
  let version = existing.quote_version;
  if (quote && quoteJson !== existing.quote_json) {
    version += 1;
    if (status === "nouvelle" || status === "en_cours") status = "devis_pret";
  }
  if (body.markSent) {
    status = "envoye";
    sentAt = new Date().toISOString();
  }
  // Réponse faite ailleurs (Gmail, Mariages.net, téléphone) : la demande passe « En attente » comme un devis envoyé.
  if (body.answered) {
    status = "envoye";
    sentAt = new Date().toISOString();
    const day = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
    next.internal_notes = [next.internal_notes, `Déjà répondu (hors /admin) le ${day}.`].filter(Boolean).join("\n").slice(0, 4000);
  }
  // Relance faite : le délai repart de zéro (la demande revient « En attente ») et la date est gardée dans les notes.
  if (body.relaunched) {
    status = "envoye";
    sentAt = new Date().toISOString();
    const day = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
    next.internal_notes = [next.internal_notes, `Relancé le ${day}.`].filter(Boolean).join("\n").slice(0, 4000);
  }

  await db()
    .prepare(
      `UPDATE requests SET updated_at = ?, status = ?, client_name = ?, client_email = ?, client_phone = ?,
        billing_address = ?, event_type = ?, event_date = ?, event_place = ?, formula = ?, adults = ?, children = ?,
        providers = ?, honor_wine = ?, km = ?, internal_notes = ?, quote_json = ?, quote_version = ?, sent_at = ?
       WHERE id = ?`,
    )
    .bind(
      new Date().toISOString(), status, next.client_name, next.client_email, next.client_phone,
      next.billing_address, next.event_type, next.event_date, next.event_place, next.formula,
      next.adults, next.children, next.providers, next.honor_wine, next.km, next.internal_notes,
      quoteJson, version, sentAt, existing.id,
    )
    .run();

  let row = await getRequestById(existing.id);
  if (body.markSent && row) await markSheetSent(row);
  // Passage en Signé / Acompte reçu : le devis tel que signé est gardé, référence des avenants.
  if (row && (row.status === "signe" || row.status === "acompte") && !row.signed_snapshot) {
    await db().prepare("UPDATE requests SET signed_snapshot = ? WHERE id = ?").bind(JSON.stringify(snapshotOf(row)), row.id).run();
    row = await getRequestById(existing.id);
  }
  const saved = parseQuote(row!);
  return json({ ok: true, request: row, quote: saved, totals: computeTotals(saved, row!.event_date) });
}

// Suppression définitive (demandes de test, doublons). Demandée depuis la fiche, avec confirmation.
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const result = await db().prepare("DELETE FROM requests WHERE id = ?").bind(Number(id)).run();
  if (!result.meta.changes) return json({ error: "Demande introuvable" }, { status: 404 });
  return json({ ok: true });
}
