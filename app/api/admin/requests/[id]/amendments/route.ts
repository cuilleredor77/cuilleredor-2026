import { db, getRequestById, json, requireAdmin } from "../../../../../../lib/server";
import { amendmentChanges, parseSnapshot, snapshotOf, type Amendment } from "../../../../../../lib/quote";

const SIGNED = ["signe", "acompte"];

async function list(requestId: number): Promise<Amendment[]> {
  return (await db().prepare("SELECT * FROM amendments WHERE request_id = ? ORDER BY number").bind(requestId).all<Amendment>()).results;
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  return json({ amendments: await list(Number(id)) });
}

// Nouvel avenant : différences entre la dernière version signée (contrat ou avenant précédent) et la fiche actuelle.
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const row = await getRequestById(Number(id));
  if (!row) return json({ error: "Demande introuvable" }, { status: 404 });
  if (!SIGNED.includes(row.status)) return json({ error: "Avenant possible seulement pour un devis signé (statut Signé ou Acompte reçu)." }, { status: 400 });
  const body = (await request.json().catch(() => ({}))) as { reason?: string };
  const existing = await list(row.id);
  const last = existing[existing.length - 1];
  const before = parseSnapshot(last ? last.after_json : row.signed_snapshot);
  if (!before) return json({ error: "Version signée introuvable : repassez le statut sur Signé avant de modifier le devis." }, { status: 400 });
  const after = snapshotOf(row);
  if (!amendmentChanges(before, after).length) return json({ error: "Aucune modification depuis la dernière version signée." }, { status: 400 });
  const number = (last?.number || 0) + 1;
  await db()
    .prepare("INSERT INTO amendments (request_id, number, created_at, reason, before_json, after_json) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(row.id, number, after.at, String(body.reason || "").trim().slice(0, 1000), JSON.stringify(before), JSON.stringify(after))
    .run();
  return json({ ok: true, number, amendments: await list(row.id) });
}

// Suivi d’un avenant : date d’envoi au client, date de signature (AAAA-MM-JJ, vide pour effacer).
export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { number?: number; sent_on?: string; signed_on?: string };
  const day = (v: unknown) => (typeof v === "string" && /^(\d{4}-\d{2}-\d{2})?$/.test(v) ? v : null);
  const sent = day(body.sent_on), signed = day(body.signed_on);
  if (sent !== null) await db().prepare("UPDATE amendments SET sent_on = ? WHERE request_id = ? AND number = ?").bind(sent, Number(id), Number(body.number)).run();
  if (signed !== null) await db().prepare("UPDATE amendments SET signed_on = ? WHERE request_id = ? AND number = ?").bind(signed, Number(id), Number(body.number)).run();
  return json({ ok: true, amendments: await list(Number(id)) });
}

// Retirer le dernier avenant (créé par erreur) : la fiche redevient comparée à la version précédente.
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const existing = await list(Number(id));
  const last = existing[existing.length - 1];
  if (!last) return json({ error: "Aucun avenant." }, { status: 404 });
  await db().prepare("DELETE FROM amendments WHERE id = ?").bind(last.id).run();
  return json({ ok: true, amendments: existing.slice(0, -1) });
}
