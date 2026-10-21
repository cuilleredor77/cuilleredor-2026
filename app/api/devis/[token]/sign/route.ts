import { db, getRequestByToken, json, setting } from "../../../../../lib/server";
import { sendMail } from "../../../../../lib/automation";
import { computeTotals, formatEUR, parisDateTimeFR, parseQuote, snapshotOf, type Signature } from "../../../../../lib/quote";
import { MAX_ATTEMPTS, cannotSign, maskEmail, sha256 } from "./shared";

// Étape 2 de la signature en ligne : vérifie le code reçu par e-mail, enregistre les preuves,
// passe la demande en « Signé » et prévient l’administratrice (seul le code est envoyé au client).
export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!/^[a-f0-9]{36}$/.test(token)) return json({ error: "Lien invalide." }, { status: 404 });
  const row = await getRequestByToken(token);
  const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const en = raw.lang === "en";
  const tr = (fr: string, english: string) => (en ? english : fr);
  const refusal = cannotSign(row, en ? "en" : "fr");
  if (refusal || !row) return json({ error: refusal }, { status: 409 });

  const body = raw as { name?: string; accept?: boolean; doc?: string; image?: string; code?: string };
  const name = String(body.name || "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!body.accept) return json({ error: tr("Merci de cocher la case d’acceptation.", "Please tick the acceptance box.") }, { status: 400 });
  if (name.length < 3) return json({ error: tr("Merci de saisir vos nom et prénom.", "Please enter your full name.") }, { status: 400 });
  const doc = body.doc === "devis" ? "devis" : "contrat";
  if (doc === "contrat" && body.image !== "accepte" && body.image !== "refuse") return json({ error: tr("Merci d’indiquer votre choix pour le droit à l’image.", "Please indicate your choice regarding image rights.") }, { status: 400 });

  // Code à 6 chiffres envoyé à l’adresse du client : valable 15 minutes, 5 essais au plus.
  const pending = await db().prepare("SELECT * FROM sign_codes WHERE request_id = ?").bind(row.id).first<{ code_hash: string; email: string; expires_at: string; attempts: number }>();
  if (!pending || pending.expires_at < new Date().toISOString()) return json({ error: tr("Code expiré ou non demandé : cliquez sur « Recevoir mon code ».", "Code expired or not requested: click “Get my signature code by email”.") }, { status: 400 });
  if (pending.attempts >= MAX_ATTEMPTS) return json({ error: tr("Trop d’essais : demandez un nouveau code.", "Too many attempts: please request a new code.") }, { status: 429 });
  if (pending.code_hash !== (await sha256(`${token}:${String(body.code || "").replace(/\D/g, "")}`))) {
    await db().prepare("UPDATE sign_codes SET attempts = attempts + 1 WHERE request_id = ?").bind(row.id).run();
    return json({ error: tr("Code incorrect.", "Incorrect code.") }, { status: 400 });
  }

  const quote = parseQuote(row);
  const totals = computeTotals(quote, row.event_date, row.service_mode);
  const now = new Date().toISOString();
  const signature: Signature = {
    name, at: now, doc,
    ...(doc === "contrat" ? { image: body.image as "accepte" | "refuse" } : {}),
    ip: request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "",
    userAgent: (request.headers.get("user-agent") || "").slice(0, 300),
    version: row.quote_version,
    total: totals.total,
    hash: await sha256(row.quote_json),
    email: maskEmail(pending.email),
    method: "code-email",
    lang: en ? "en" : "fr",
  };
  const day = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
  const notes = [row.internal_notes, `Signé en ligne le ${day} par « ${name} » (${doc === "contrat" ? "devis + contrat" : "devis"}${en ? ", version anglaise" : ""}, ${formatEUR(totals.total)}).`].filter(Boolean).join("\n").slice(0, 4000);
  const result = await db()
    .prepare("UPDATE requests SET signature_json = ?, status = 'signe', updated_at = ?, internal_notes = ?, signed_snapshot = CASE WHEN signed_snapshot = '' THEN ? ELSE signed_snapshot END WHERE id = ? AND signature_json = ''")
    .bind(JSON.stringify(signature), now, notes, JSON.stringify(snapshotOf(row, now)), row.id)
    .run();
  if (!result.meta.changes) return json({ error: tr("Ce devis est déjà signé.", "This quote has already been signed.") }, { status: 409 });
  await db().prepare("DELETE FROM sign_codes WHERE request_id = ?").bind(row.id).run();

  // Alerte à l’administratrice (pas au client).
  const review = setting("REVIEW_EMAIL");
  if (review) {
    const origin = new URL(request.url).origin;
    await sendMail({
      to: review,
      subject: `✍️ ${doc === "contrat" ? "Contrat" : "Devis"} signé en ligne — ${row.client_name}`,
      text: [
        `${row.client_name} a signé en ligne ${doc === "contrat" ? "le devis et le contrat" : "le devis"} le ${parisDateTimeFR(now)}.`,
        `Nom saisi : ${name} — Adresse vérifiée par code : ${pending.email} — Total : ${formatEUR(totals.total)}${doc === "contrat" ? ` — Droit à l’image : ${signature.image === "accepte" ? "accepté" : "refusé"}` : ""}.`,
        "La demande est passée en « Signé ». Pensez à noter l’acompte dans la fiche dès sa réception.",
        `${origin}/admin/${row.id}`,
      ].join("\n\n"),
    }).catch(() => undefined);
  }
  return json({ ok: true, signature: { name, at: now, doc } });
}
