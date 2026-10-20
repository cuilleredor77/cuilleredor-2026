import { getRequestById, json, requireAdmin } from "../../../../../../lib/server";
import { sendQuoteToClient } from "../../../../../../lib/automation";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const row = await getRequestById(Number(id));
  if (!row) return json({ error: "Demande introuvable" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { withContract?: boolean };
  const result = await sendQuoteToClient(row, new URL(request.url).origin, body.withContract !== false);
  if (!result.ok) return json({ error: result.error }, { status: 502 });
  return json({ ok: true, request: await getRequestById(row.id) });
}
