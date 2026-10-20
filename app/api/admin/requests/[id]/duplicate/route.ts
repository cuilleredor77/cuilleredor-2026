import { db, getRequestById, json, newToken, requireAdmin } from "../../../../../../lib/server";
import { FORMULAS, buildDefaultQuote, isFormulaKey } from "../../../../../../lib/quote";

// Second devis pour la même demande (autre formule) : copie de la fiche, devis recalculé, liens croisés dans les notes.
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const row = await getRequestById(Number(id));
  if (!row) return json({ error: "Demande introuvable" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { formula?: string };
  const formula = body.formula && isFormulaKey(body.formula) ? body.formula : row.formula;
  const now = new Date().toISOString();
  const copy = { ...row, formula, quote_json: "" };
  const quote = buildDefaultQuote(copy);
  const notes = [`Second devis (${FORMULAS[formula as keyof typeof FORMULAS].label}) — variante de la demande n°${row.id}.`, row.internal_notes].filter(Boolean).join("\n").slice(0, 4000);
  const inserted = await db()
    .prepare(
      `INSERT INTO requests (token, created_at, updated_at, status, source, client_name, client_email, client_phone, billing_address,
        event_type, event_date, event_place, formula, adults, children, providers, honor_wine, km, budget, estimate_json,
        selection_text, message, quote_json, quote_version, internal_notes, service_mode, wedding_planner, vendors_found)
       VALUES (?, ?, ?, 'devis_pret', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
    )
    .bind(
      newToken(), row.created_at, now, row.source, row.client_name, row.client_email, row.client_phone, row.billing_address,
      row.event_type, row.event_date, row.event_place, formula, row.adults, row.children, row.providers, row.honor_wine, row.km,
      row.budget, row.estimate_json, row.selection_text, row.message, JSON.stringify(quote), notes,
      row.service_mode, row.wedding_planner, row.vendors_found,
    )
    .run();
  const newId = inserted.meta.last_row_id;
  await db()
    .prepare("UPDATE requests SET internal_notes = ?, updated_at = ? WHERE id = ?")
    .bind([row.internal_notes, `Second devis créé : demande n°${newId} (${FORMULAS[formula as keyof typeof FORMULAS].label}).`].filter(Boolean).join("\n").slice(0, 4000), now, row.id)
    .run();
  return json({ ok: true, id: newId });
}
