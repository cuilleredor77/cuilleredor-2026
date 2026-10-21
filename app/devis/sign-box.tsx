"use client";

import { useState } from "react";

const TEXT = {
  fr: {
    title: "Signer en ligne",
    docs: (quoteOnly: boolean) => (quoteOnly ? "le devis" : "le devis et le contrat de prestation"),
    intro: (docs: string) => `Après avoir bien relu ${docs}, vous pouvez les signer ici. Votre réservation sera confirmée à réception de l’acompte.`,
    image: "Droit à l’image (article 9 du contrat) :", yes: "J’accepte", no: "Je refuse",
    accept: (docs: string) => `J’ai lu et j’accepte ${docs}, pour un montant total de `,
    name: "Vos nom et prénom (valant signature)",
    sent: "Code reçu par e-mail à", valid: "(valable 15 minutes)",
    sign: "✍️ Signer", signing: "Signature…", resend: "Je n’ai pas reçu le code : le renvoyer",
    ask: "Recevoir mon code de signature par e-mail", asking: "Envoi du code…",
    legal: "Signature électronique simple : un code est envoyé à votre adresse e-mail pour confirmer votre identité. Vos nom, date, heure et adresse de connexion sont enregistrés comme preuve de votre accord.",
    failCode: "Le code n’a pas pu être envoyé. Réessayez ou appelez-nous au 07 83 74 89 71.",
    failSign: "La signature n’a pas pu être enregistrée. Réessayez ou appelez-nous au 07 83 74 89 71.",
  },
  en: {
    title: "Sign online",
    docs: (quoteOnly: boolean) => (quoteOnly ? "the quote" : "the quote and the catering service agreement"),
    intro: (docs: string) => `Once you have carefully read ${docs}, you can sign here. Your booking will be confirmed upon receipt of the deposit.`,
    image: "Image rights (article 9 of the agreement):", yes: "I accept", no: "I refuse",
    accept: (docs: string) => `I have read and accept ${docs}, for a total amount of `,
    name: "Your full name (as your signature)",
    sent: "Code sent by email to", valid: "(valid for 15 minutes)",
    sign: "✍️ Sign", signing: "Signing…", resend: "I didn’t receive the code: send it again",
    ask: "Get my signature code by email", asking: "Sending the code…",
    legal: "Simple electronic signature: a code is sent to your email address to confirm your identity. Your name, date, time and connection address are recorded as proof of your agreement.",
    failCode: "The code could not be sent. Please try again or call us on +33 7 83 74 89 71.",
    failSign: "The signature could not be recorded. Please try again or call us on +33 7 83 74 89 71.",
  },
};

// Signature en ligne : case d’acceptation + nom tapé + code reçu par e-mail (signature électronique simple). Masqué à l’impression.
export default function SignBox({ token, quoteOnly, clientName, total, lang = "fr" }: { token: string; quoteOnly: boolean; clientName: string; total: string; lang?: "fr" | "en" }) {
  const t = TEXT[lang];
  const [accept, setAccept] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState<"" | "accepte" | "refuse">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Étape 2 : code reçu par e-mail (adresse masquée affichée au client).
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const docs = t.docs(quoteOnly);
  const ready = accept && name.trim().length >= 3 && (quoteOnly || image !== "");

  async function askCode() {
    if (!ready || busy) return;
    setBusy(true); setError("");
    const res = await fetch(`/api/devis/${token}/sign/code?lang=${lang}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error || t.failCode); return; }
    setSentTo(data.email); setCode("");
  }

  async function sign() {
    if (!ready || busy || code.replace(/\D/g, "").length !== 6) return;
    setBusy(true); setError("");
    const res = await fetch(`/api/devis/${token}/sign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, accept, doc: quoteOnly ? "devis" : "contrat", image: image || undefined, code, lang }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setError(data.error || t.failSign); return; }
    window.location.reload();
  }

  return (
    <section className="dv-signbox" aria-label={t.title} lang={lang}>
      <h2>{t.title}</h2>
      <p>{t.intro(docs)}</p>
      {quoteOnly ? null : (
        <fieldset className="dv-signbox-image">
          <legend>{t.image}</legend>
          <label><input type="radio" name="image" checked={image === "accepte"} onChange={() => setImage("accepte")} /> {t.yes}</label>
          <label><input type="radio" name="image" checked={image === "refuse"} onChange={() => setImage("refuse")} /> {t.no}</label>
        </fieldset>
      )}
      <label className="dv-signbox-check">
        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
        <span>{t.accept(docs)}<b>{total}</b>.</span>
      </label>
      <label className="dv-signbox-name">{t.name}
        <input value={name} placeholder={clientName} autoComplete="name" onChange={(e) => setName(e.target.value)} />
      </label>
      {sentTo ? (
        <div className="dv-signbox-code">
          <label>{t.sent} <b>{sentTo}</b> {t.valid}
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </label>
          {error ? <p className="dv-signbox-error">{error}</p> : null}
          <button type="button" className="dv-print" disabled={!ready || busy || code.length !== 6} onClick={sign}>{busy ? t.signing : t.sign}</button>
          <button type="button" className="dv-linkbtn" disabled={busy} onClick={askCode}>{t.resend}</button>
        </div>
      ) : (
        <>
          {error ? <p className="dv-signbox-error">{error}</p> : null}
          <button type="button" className="dv-print" disabled={!ready || busy} onClick={askCode}>{busy ? t.asking : t.ask}</button>
        </>
      )}
      <p className="dv-signbox-legal">{t.legal}</p>
    </section>
  );
}
