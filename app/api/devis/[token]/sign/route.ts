import { db, getRequestByToken, json, setting } from "../../../../../lib/server";
import { sendMail } from "../../../../../lib/automation";
import { computeTotals, formatEUR, offPeriod, parisDateTimeFR, parseQuote, parseSignature, snapshotOf, type Signature } from "../../../../../lib/quote";

const SIGNABLE = ["nouvelle", "en_cours", "devis_pret", "envoye"];

// Signature en ligne par le client (page du devis) : enregistre les preuves, passe la demande en « Signé »
// et prévient l’administratrice. Aucun e-mail n’est envoyé au client.
export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!/^[a-f0-9]{36}$/.test(token)) return json({ error: "Lien invalide." }, { status: 404 });
  const row = await getRequestByToken(token);
  if (!row || !row.quote_json) return json({ error: "Devis introuvable." }, { status: 404 });
  if (parseSignature(row)) return json({ error: "Ce devis est déjà signé." }, { status: 409 });
  // Date OFF ou complète : le devis a été envoyé « indisponible », il ne se signe pas.
  if (!SIGNABLE.includes(row.status) || offPeriod(row.event_date)) return json({ error: "Ce devis ne peut plus être signé en ligne. Contactez-nous au 07 83 74 89 71." }, { status: 409 });

  const body = (await request.json().catch(() => ({}))) as { name?: string; accept?: boolean; doc?: string; image?: string };
  const name = String(body.name || "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!body.accept) return json({ error: "Merci de cocher la case d’acceptation." }, { status: 400 });
  if (name.length < 3) return json({ error: "Merci de saisir vos nom et prénom." }, { status: 400 });
  const doc = body.doc === "devis" ? "devis" : "contrat";
  if (doc === "contrat" && body.image !== "accepte" && body.image !== "refuse") return json({ error: "Merci d’indiquer votre choix pour le droit à l’image." }, { status: 400 });

  const quote = parseQuote(row);
  const totals = computeTotals(quote, row.event_date, row.service_mode);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(row.quote_json));
  const now = new Date().toISOString();
  const signature: Signature = {
    name, at: now, doc,
    ...(doc === "contrat" ? { image: body.image as "accepte" | "refuse" } : {}),
    ip: request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "",
    userAgent: (request.headers.get("user-agent") || "").slice(0, 300),
    version: row.quote_version,
    total: totals.total,
    hash: Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""),
  };
  const day = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
  const notes = [row.internal_notes, `Signé en ligne le ${day} par « ${name} » (${doc === "contrat" ? "devis + contrat" : "devis"}, ${formatEUR(totals.total)}).`].filter(Boolean).join("\n").slice(0, 4000);
  const result = await db()
    .prepare("UPDATE requests SET signature_json = ?, status = 'signe', updated_at = ?, internal_notes = ?, signed_snapshot = CASE WHEN signed_snapshot = '' THEN ? ELSE signed_snapshot END WHERE id = ? AND signature_json = ''")
    .bind(JSON.stringify(signature), now, notes, JSON.stringify(snapshotOf(row, now)), row.id)
    .run();
  if (!result.meta.changes) return json({ error: "Ce devis est déjà signé." }, { status: 409 });

  // Alerte à l’administratrice (pas au client).
  const review = setting("REVIEW_EMAIL");
  if (review) {
    const origin = new URL(request.url).origin;
    await sendMail({
      to: review,
      subject: `✍️ ${doc === "contrat" ? "Contrat" : "Devis"} signé en ligne — ${row.client_name}`,
      text: [
        `${row.client_name} a signé en ligne ${doc === "contrat" ? "le devis et le contrat" : "le devis"} le ${parisDateTimeFR(now)}.`,
        `Nom saisi : ${name} — Total : ${formatEUR(totals.total)}${doc === "contrat" ? ` — Droit à l’image : ${signature.image === "accepte" ? "accepté" : "refusé"}` : ""}.`,
        "La demande est passée en « Signé ». Pensez à noter l’acompte dans la fiche dès sa réception.",
        `${origin}/admin/${row.id}`,
      ].join("\n\n"),
    }).catch(() => undefined);
  }
  return json({ ok: true, signature: { name, at: now, doc } });
}
