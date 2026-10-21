// Règles communes à l’envoi du code et à la signature en ligne.
import { offPeriod, parseSignature, type RequestRow } from "../../../../../lib/quote";

const SIGNABLE = ["nouvelle", "en_cours", "devis_pret", "envoye"];
export const CODE_MINUTES = 15;
export const MAX_ATTEMPTS = 5;

/** Raison pour laquelle le devis ne peut pas être signé en ligne, ou "" s’il peut l’être. */
export function cannotSign(row: RequestRow | null, lang: "fr" | "en" = "fr"): string {
  const en = lang === "en";
  if (!row || !row.quote_json) return en ? "Quote not found." : "Devis introuvable.";
  if (parseSignature(row)) return en ? "This quote has already been signed." : "Ce devis est déjà signé.";
  // Date OFF ou complète : le devis a été envoyé « indisponible », il ne se signe pas.
  if (!SIGNABLE.includes(row.status) || offPeriod(row.event_date)) return en ? "This quote can no longer be signed online. Please contact us on +33 7 83 74 89 71." : "Ce devis ne peut plus être signé en ligne. Contactez-nous au 07 83 74 89 71.";
  if (!row.client_email) return en ? "No email address is linked to this quote: please contact us on +33 7 83 74 89 71 to sign it." : "Aucune adresse e-mail n’est associée à ce devis : contactez-nous au 07 83 74 89 71 pour le signer.";
  return "";
}

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** « s•••••@gmail.com » : montre au client où le code est parti sans afficher toute l’adresse. */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 1)}${"•".repeat(Math.max(2, user.length - 1))}@${domain || ""}`;
}
