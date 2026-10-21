import { db, getRequestByToken, json } from "../../../../../../lib/server";
import { sendMail } from "../../../../../../lib/automation";
import { CODE_MINUTES, cannotSign, maskEmail, sha256 } from "../shared";

// Étape 1 de la signature : un code à 6 chiffres est envoyé à l’adresse e-mail du client (celle de la fiche).
export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const en = new URL(request.url).searchParams.get("lang") === "en";
  if (!/^[a-f0-9]{36}$/.test(token)) return json({ error: en ? "Invalid link." : "Lien invalide." }, { status: 404 });
  const row = await getRequestByToken(token);
  const refusal = cannotSign(row, en ? "en" : "fr");
  if (refusal) return json({ error: refusal }, { status: 409 });

  // Un nouveau code au plus toutes les 60 secondes.
  const previous = await db().prepare("SELECT created_at FROM sign_codes WHERE request_id = ?").bind(row!.id).first<{ created_at: string }>();
  if (previous && Date.now() - new Date(previous.created_at).getTime() < 60_000) {
    return json({ error: en ? "A code has just been sent: please wait a minute before requesting another one." : "Un code vient d’être envoyé : patientez une minute avant d’en demander un autre." }, { status: 429 });
  }

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  const now = new Date();
  await db()
    .prepare("INSERT OR REPLACE INTO sign_codes (request_id, code_hash, email, created_at, expires_at, attempts) VALUES (?, ?, ?, ?, ?, 0)")
    .bind(row!.id, await sha256(`${token}:${code}`), row!.client_email, now.toISOString(), new Date(now.getTime() + CODE_MINUTES * 60_000).toISOString())
    .run();
  const sent = await sendMail(en ? {
    to: row!.client_email,
    subject: `Your Cuillère d’Or signature code: ${code}`,
    text: [
      "Hello,",
      `Here is your code to sign your Cuillère d’Or quote online: ${code}`,
      `This code is valid for ${CODE_MINUTES} minutes. If you did not request it, simply ignore this message.`,
      "Cuillère d’Or — +33 7 83 74 89 71 — contact@cuilleredor.fr",
    ].join("\n\n"),
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a"><p>Hello,</p><p>Here is your code to sign your Cuillère d’Or quote online:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#8b6914;margin:10px 0">${code}</p><p>This code is valid for ${CODE_MINUTES} minutes. If you did not request it, simply ignore this message.</p><p style="color:#666;font-size:13px">Cuillère d’Or — +33 7 83 74 89 71 — contact@cuilleredor.fr</p></div>`,
  } : {
    to: row!.client_email,
    subject: `Votre code de signature Cuillère d’Or : ${code}`,
    text: [
      "Bonjour,",
      `Voici votre code pour signer en ligne votre devis Cuillère d’Or : ${code}`,
      `Ce code est valable ${CODE_MINUTES} minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez simplement ce message.`,
      "Cuillère d’Or — 07 83 74 89 71 — contact@cuilleredor.fr",
    ].join("\n\n"),
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a"><p>Bonjour,</p><p>Voici votre code pour signer en ligne votre devis Cuillère d’Or :</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#8b6914;margin:10px 0">${code}</p><p>Ce code est valable ${CODE_MINUTES} minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez simplement ce message.</p><p style="color:#666;font-size:13px">Cuillère d’Or — 07 83 74 89 71 — contact@cuilleredor.fr</p></div>`,
  });
  if (!sent.ok) return json({ error: en ? "The code could not be sent. Please try again or call us on +33 7 83 74 89 71." : "Le code n’a pas pu être envoyé. Réessayez ou appelez-nous au 07 83 74 89 71." }, { status: 502 });
  return json({ ok: true, email: maskEmail(row!.client_email), minutes: CODE_MINUTES });
}
