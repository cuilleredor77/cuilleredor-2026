// Chaîne automatique : demande reçue → devis calculé → e-mail « devis prêt » à la relectrice → envoi au client en 1 clic.
import { approvalKey, db, getRequestById, setting } from "./server";
import { roundTripKm } from "./geo";
import {
  buildDefaultQuote,
  clientEmail,
  charterEmail,
  computeTotals,
  formatDateFR,
  formatEUR,
  parseQuote,
  quoteAlerts,
  agendaDayLink,
  receivedAt,
  SOURCE_LABEL,
  serviceModeLabel,
  weddingPlannerLabel,
  type RequestRow,
} from "./quote";

const REPLY_TO = "contact@cuilleredor.fr";
export const PLACE_NOTE = "Lieu retenu pour les km : ";
export const TRAVEL_FROM_TOWN = "Estimation depuis la commune : montant ajusté avec l’adresse exacte du lieu";
export const TRAVEL_TO_QUOTE = "Frais de déplacement : à chiffrer selon l’adresse exacte du lieu de réception.";
const AVAILABILITY = "Avant d’envoyer : vérifie que la date est libre (l’e-mail au client dit « Nous sommes disponibles à cette date »).";

export type MailAttachment = { filename: string; content: string }; // content en base64
type Mail = { to: string; subject: string; text: string; html?: string; bcc?: string; replyTo?: string; attachments?: MailAttachment[] };

/** Envoi via Resend. Sans clé configurée, ne fait rien (le devis reste visible dans /admin). */
export async function sendMail(mail: Mail): Promise<{ ok: boolean; error?: string }> {
  const key = setting("RESEND_API_KEY");
  const from = setting("MAIL_FROM");
  if (!key || !from) return { ok: false, error: "Envoi d’e-mails non configuré (RESEND_API_KEY / MAIL_FROM)." };
  if (key === "log") {
    // Test local : l'e-mail est affiché dans la console au lieu d'être envoyé.
    console.log(`[mail simulé] à ${mail.to}${mail.bcc ? ` (cci ${mail.bcc})` : ""} — ${mail.subject}\n${mail.text}`);
    return { ok: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [mail.to],
        bcc: mail.bcc ? [mail.bcc] : undefined,
        reply_to: mail.replyTo || REPLY_TO,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        attachments: mail.attachments?.length ? mail.attachments : undefined,
      }),
      signal: AbortSignal.timeout(mail.attachments?.length ? 30000 : 10000),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status} : ${(await res.text()).slice(0, 200)}` };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Resend injoignable : ${String(error).slice(0, 120)}` };
  }
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

/** Garde dans les notes internes la commune retenue pour les km (pour vérifier une distance surprenante). */
export function withPlaceNote(notes: string, resolved: string): string {
  const line = `${PLACE_NOTE}${resolved}`;
  const kept = notes.split("\n").filter((l) => !l.startsWith(PLACE_NOTE));
  return [...kept, line].filter(Boolean).join("\n").slice(0, 4000);
}

/** Calcule les km et le devis d'une nouvelle demande, puis prévient la relectrice. Ne lève jamais d'erreur. */
export async function prepareAndNotify(id: number, origin: string): Promise<void> {
  try {
    let row = await getRequestById(id);
    if (!row) return;
    let km = row.km;
    let precision = km ? "adresse" : "";
    let notes = row.internal_notes;
    if (!km && row.event_place.length >= 4) {
      const distance = await roundTripKm(row.event_place);
      if (!("error" in distance)) {
        km = distance.km;
        notes = withPlaceNote(notes, distance.resolved);
      }
      precision = distance.precision || "";
    }
    const quote = buildDefaultQuote({ ...row, km, quote_json: "" });
    const travel = quote.lines.find((line) => line.id === "deplacement");
    if (travel && precision === "ville") travel.detail = TRAVEL_FROM_TOWN;
    await db()
      .prepare(
        `UPDATE requests SET updated_at = ?, km = ?, quote_json = ?, internal_notes = ?, quote_version = quote_version + 1,
          status = 'devis_pret'
         WHERE id = ? AND quote_json = ''`,
      )
      .bind(new Date().toISOString(), km, JSON.stringify(quote), notes, id)
      .run();
    row = await getRequestById(id);
    if (row) await notifyReviewer(row, origin);
  } catch (error) {
    console.error("prepareAndNotify", id, error);
  }
}

async function notifyReviewer(row: RequestRow, origin: string): Promise<void> {
  const to = setting("REVIEW_EMAIL");
  if (!to) return;
  const quote = parseQuote(row);
  const totals = computeTotals(quote, row.event_date, row.service_mode);
  const alerts = quoteAlerts(row, quote, totals);
  const agenda = row.event_date ? await agendaOnDate(row.event_date) : null;
  if (agenda && agenda.off.length) {
    alerts.unshift(`⛔ Huguette est OFF ce jour-là (${agenda.off.join(", ")}) : envoyer la réponse négative (« Préparer l’e-mail » → Indisponible).`);
  }
  if (agenda && agenda.count >= AGENDA_LIMIT) {
    alerts.unshift(`Déjà ${agenda.count} événements dans ton agenda ce jour-là (${agenda.titles.join(", ")}) : vérifie la disponibilité avant d’envoyer.`);
  }
  const key = await approvalKey(row.token);
  const sendUrl = key ? `${origin}/envoyer/${row.token}?k=${key}` : "";
  const viewUrl = `${origin}/devis/${row.token}`;
  const editUrl = `${origin}/admin/${row.id}`;
  const when = row.event_date ? formatDateFR(row.event_date, true) : "date inconnue";
  const subject = `📝 Nouvelle demande de devis à relire — ${row.client_name}, ${row.event_type} du ${when} — ${formatEUR(totals.total)}`;
  const facts = [
    `Origine : ${SOURCE_LABEL[row.source] || row.source} · reçue le ${receivedAt(row.created_at)}`,
    `${row.client_name} · ${row.client_email} · ${row.client_phone}`,
    `${row.event_type} le ${when}${row.event_place ? ` à ${row.event_place}` : ""}`,
    quote.summary,
    `Prestation : ${serviceModeLabel(row.service_mode)}`,
    row.budget ? `Budget indiqué : ${row.budget}` : "",
    row.wedding_planner ? `Wedding planner : ${weddingPlannerLabel(row.wedding_planner)}` : "",
    `Total ${formatEUR(totals.total)}${row.km ? ` (dont ${row.km} km AR)` : ""}`,
    row.selection_text ? `Plats choisis : ${row.selection_text}` : "",
    row.message ? `Message : ${row.message}` : "",
  ].filter(Boolean);
  const text = [
    ...facts,
    "",
    alerts.length ? `Points à relire :\n- ${alerts.join("\n- ")}` : "Aucun point bloquant détecté.",
    AVAILABILITY,
    "",
    sendUrl ? `Envoyer au client tel quel : ${sendUrl}` : "",
    `Voir le devis : ${viewUrl}`,
    `Modifier : ${editUrl}`,
    /^\d{4}-\d{2}-\d{2}$/.test(row.event_date) ? `Agenda ce jour-là : ${agendaDayLink(row.event_date)}` : "",
  ].join("\n");
  const button = (href: string, label: string, gold = false) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:4px 8px 4px 0;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;${gold ? "background:#d4ae2a;color:#0a0a0a" : "border:1px solid #775a19;color:#775a19"}">${label}</a>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a">
${facts.map((f) => `<p style="margin:0 0 6px">${esc(f)}</p>`).join("")}
${alerts.length ? `<div style="margin:14px 0;padding:12px 14px;background:#fff7e0;border:1px solid #e9c83e;border-radius:6px"><b>Points à relire</b><ul style="margin:6px 0 0;padding-left:18px">${alerts.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>` : `<p style="color:#2e6b2e">Aucun point bloquant détecté.</p>`}
<p style="color:#5e5e5e">${esc(AVAILABILITY)}</p>
<p style="margin-top:16px">${sendUrl ? button(sendUrl, "Envoyer au client", true) : ""}${button(viewUrl, "Voir le devis")}${button(editUrl, "Modifier")}${/^\d{4}-\d{2}-\d{2}$/.test(row.event_date) ? button(agendaDayLink(row.event_date), "📅 Agenda ce jour-là") : ""}</p>
</div>`;
  const result = await sendMail({ to, subject, text, html });
  if (!result.ok) console.error("notifyReviewer", row.id, result.error);
}

export const AGENDA_LIMIT = 3;

/** Événements déjà inscrits dans le Google Agenda de la cheffe à cette date (via le script de la feuille). null si indisponible. */
export async function agendaOnDate(date: string): Promise<{ count: number; titles: string[]; off: string[] } | null> {
  const url = setting("GSHEET_FINDER_URL");
  const secret = setting("GFORM_SECRET");
  if (!url || !secret || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  try {
    const res = await fetch(`${url}?action=agenda&date=${date}&cle=${encodeURIComponent(secret)}`, { signal: AbortSignal.timeout(15000) });
    const data = (await res.json()) as { count?: number; titles?: string[]; off?: string[] };
    return typeof data.count === "number" ? { count: data.count, titles: data.titles || [], off: data.off || [] } : null;
  } catch (error) {
    console.error("agendaOnDate", date, error);
    return null;
  }
}

/** Coche « Devis envoyé » sur la ligne du client dans le Google Sheet (via le script de la feuille). Ne lève jamais d'erreur. */
export async function markSheetSent(row: RequestRow): Promise<void> {
  const url = setting("GSHEET_FINDER_URL");
  const secret = setting("GFORM_SECRET");
  if (!url || !secret || row.source !== "google_sheet" || !row.client_email) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, email: row.client_email, date: row.event_date }),
      signal: AbortSignal.timeout(15000),
    });
    const answer = (await res.text()).slice(0, 80);
    if (!answer.startsWith("ok")) console.error("markSheetSent", row.id, res.status, answer);
  } catch (error) {
    console.error("markSheetSent", row.id, error);
  }
}

/** Envoie le devis au client (copie cachée à la relectrice) et marque la demande « envoyée ». */
export async function sendQuoteToClient(row: RequestRow, origin: string, withContract = true, attachments: MailAttachment[] = [], unavailable = false, custom?: { subject: string; html: string; text: string } | null): Promise<{ ok: boolean; error?: string }> {
  if (!row.quote_json) return { ok: false, error: "Le devis n’est pas encore calculé." };
  if (!row.client_email) return { ok: false, error: "E-mail du client manquant." };
  const quote = parseQuote(row);
  const totals = computeTotals(quote, row.event_date, row.service_mode);
  const link = `${origin}/devis/${row.token}${withContract ? "" : "?doc=devis"}`;
  // Avec pièces jointes, le mail dit « ci-joint en PDF » ; sans, il garde le lien en ligne.
  // Mail modifié à la main dans l’admin : on envoie exactement cette version.
  const { subject, html, text } = custom?.html ? custom : charterEmail(row, quote, totals, attachments.length ? "" : link, withContract, unavailable);
  const result = await sendMail({ to: row.client_email, subject, text, html, bcc: setting("REVIEW_EMAIL") || undefined, attachments });
  if (!result.ok) return result;
  const now = new Date().toISOString();
  await db()
    .prepare("UPDATE requests SET status = 'envoye', sent_at = ?, updated_at = ? WHERE id = ?")
    .bind(now, now, row.id)
    .run();
  await markSheetSent(row);
  return { ok: true };
}
