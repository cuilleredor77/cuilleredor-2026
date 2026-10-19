import { checkApprovalKey, getRequestByToken } from "../../../lib/server";
import { sendQuoteToClient } from "../../../lib/automation";

// Bouton « Envoyer au client » de l'e-mail « devis prêt » : formulaire POST (un simple aperçu du lien n'envoie rien).
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const token = String(form?.get("t") || "");
  const key = String(form?.get("k") || "");
  const back = (state: string) =>
    Response.redirect(`${new URL(request.url).origin}/envoyer/${token}?k=${encodeURIComponent(key)}&etat=${state}`, 303);
  if (!/^[a-f0-9]{36}$/.test(token) || !(await checkApprovalKey(token, key))) {
    return new Response("Lien invalide ou expiré.", { status: 403 });
  }
  const row = await getRequestByToken(token);
  if (!row) return new Response("Demande introuvable.", { status: 404 });
  if (row.sent_at) return back("deja");
  const result = await sendQuoteToClient(row, new URL(request.url).origin);
  return back(result.ok ? "envoye" : `erreur`);
}
