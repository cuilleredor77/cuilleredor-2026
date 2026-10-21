import { getRequestById, json, requireAdmin } from "../../../../../../lib/server";
import { sendQuoteToClient, type MailAttachment } from "../../../../../../lib/automation";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const row = await getRequestById(Number(id));
  if (!row) return json({ error: "Demande introuvable" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { withContract?: boolean; attachments?: MailAttachment[]; unavailable?: boolean; custom?: { subject: string; html: string; text: string } | null; lang?: string };
  const attachments = (body.attachments || []).filter((a) => a && typeof a.filename === "string" && typeof a.content === "string");
  // Resend accepte 40 Mo au total ; on reste sous 20 Mo de fichiers (base64 ≈ ×1,37).
  if (attachments.reduce((n, a) => n + a.content.length, 0) > 27_000_000) return json({ error: "Pièces jointes trop lourdes (20 Mo maximum)." }, { status: 413 });
  const result = await sendQuoteToClient(row, new URL(request.url).origin, body.withContract !== false, attachments, body.unavailable === true, body.custom && typeof body.custom.html === "string" ? body.custom : null, body.lang === "en" ? "en" : "fr");
  if (!result.ok) return json({ error: result.error }, { status: 502 });
  return json({ ok: true, request: await getRequestById(row.id) });
}
