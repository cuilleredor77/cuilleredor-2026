import { db, getRequestById, json, requireAdmin } from "../../../../../../lib/server";
import { INVOICE_KINDS, INVOICE_START, draftInvoice, invoiceNumber, type Invoice, type InvoiceData, type InvoiceKind } from "../../../../../../lib/invoice";

async function list(requestId: number): Promise<Invoice[]> {
  return (await db().prepare("SELECT * FROM invoices WHERE request_id = ? ORDER BY year, seq").bind(requestId).all<Invoice>()).results;
}

const parisToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const day = (v: unknown) => (typeof v === "string" && /^(\d{4}-\d{2}-\d{2})?$/.test(v) ? v : null);

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  return json({ invoices: await list(Number(id)) });
}

// Nouvelle facture (brouillon) avec le numéro suivant de l'année : FAC-AAAA-NNN, sans trou.
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const row = await getRequestById(Number(id));
  if (!row) return json({ error: "Demande introuvable" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { kind?: string; source_id?: number };
  const kind = body.kind as InvoiceKind;
  if (!(kind in INVOICE_KINDS)) return json({ error: "Type de facture inconnu." }, { status: 400 });
  const previous = await list(row.id);
  const source = kind === "avoir" ? previous.find((i) => i.id === Number(body.source_id) && i.kind !== "avoir") : undefined;
  if (kind === "avoir" && !source) return json({ error: "Choisissez la facture à annuler." }, { status: 400 });
  const { data, ref_number } = draftInvoice(kind, row, previous, source);
  const issued = parisToday();
  const year = Number(issued.slice(0, 4));
  const last = await db().prepare("SELECT MAX(seq) AS seq FROM invoices WHERE year = ?").bind(year).first<{ seq: number | null }>();
  const seq = Math.max(last?.seq || 0, INVOICE_START[year] || 0) + 1;
  const now = new Date().toISOString();
  await db()
    .prepare("INSERT INTO invoices (request_id, number, seq, year, kind, issued_on, status, ref_number, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'brouillon', ?, ?, ?, ?)")
    .bind(row.id, invoiceNumber(year, seq), seq, year, kind, issued, ref_number, JSON.stringify(data), now, now)
    .run();
  return json({ ok: true, number: invoiceNumber(year, seq), invoices: await list(row.id) });
}

// Modifier un brouillon (contenu, date d'émission), marquer envoyée (la facture est alors figée), date de paiement.
export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { invoice_id?: number; data?: InvoiceData; issued_on?: string; sent_on?: string; paid_on?: string; reopen?: boolean };
  const inv = await db().prepare("SELECT * FROM invoices WHERE id = ? AND request_id = ?").bind(Number(body.invoice_id), Number(id)).first<Invoice>();
  if (!inv) return json({ error: "Facture introuvable." }, { status: 404 });
  const now = new Date().toISOString();
  const draft = inv.status === "brouillon";
  if ((body.data || body.issued_on) && !draft) return json({ error: "Facture envoyée : elle ne se modifie plus. Faites un avoir puis une nouvelle facture." }, { status: 400 });
  if (body.data) {
    const d = body.data;
    if (!Array.isArray(d.lines) || !d.client || !d.event) return json({ error: "Facture incomplète." }, { status: 400 });
    await db().prepare("UPDATE invoices SET data_json = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(d), now, inv.id).run();
  }
  const issued = day(body.issued_on);
  if (issued) await db().prepare("UPDATE invoices SET issued_on = ?, updated_at = ? WHERE id = ?").bind(issued, now, inv.id).run();
  const sent = day(body.sent_on);
  // Mention obligatoire : pas d'envoi sans l'adresse du client (et sans son SIREN pour un client professionnel).
  if (sent) {
    const d = JSON.parse(inv.data_json) as InvoiceData;
    if (!(d.client.address || "").trim()) return json({ error: "Adresse du client obligatoire sur une facture : renseignez l’adresse de facturation (bouton « modifier »), puis marquez-la envoyée." }, { status: 400 });
    if (d.client.pro && !(d.client.extra || "").trim()) return json({ error: "Client professionnel : renseignez son SIREN avant l’envoi." }, { status: 400 });
  }
  if (sent !== null) await db().prepare("UPDATE invoices SET sent_on = ?, status = ?, updated_at = ? WHERE id = ?").bind(sent, sent ? "envoyee" : "brouillon", now, inv.id).run();
  const paid = day(body.paid_on);
  if (paid !== null) await db().prepare("UPDATE invoices SET paid_on = ?, updated_at = ? WHERE id = ?").bind(paid, now, inv.id).run();
  return json({ ok: true, invoices: await list(Number(id)) });
}

// Supprimer : seulement la dernière facture numérotée, encore en brouillon (pas de trou dans la numérotation).
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const invoiceId = Number(new URL(request.url).searchParams.get("invoice_id"));
  const inv = await db().prepare("SELECT * FROM invoices WHERE id = ? AND request_id = ?").bind(invoiceId, Number(id)).first<Invoice>();
  if (!inv) return json({ error: "Facture introuvable." }, { status: 404 });
  const last = await db().prepare("SELECT id FROM invoices ORDER BY year DESC, seq DESC LIMIT 1").first<{ id: number }>();
  if (inv.status !== "brouillon" || last?.id !== inv.id) return json({ error: "Seule la dernière facture, non envoyée, peut être supprimée. Sinon, faites un avoir." }, { status: 400 });
  await db().prepare("DELETE FROM invoices WHERE id = ?").bind(inv.id).run();
  return json({ ok: true, invoices: await list(Number(id)) });
}
