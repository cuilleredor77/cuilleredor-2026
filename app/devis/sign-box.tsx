"use client";

import { useState } from "react";

// Signature en ligne : case d’acceptation + nom tapé (signature électronique simple). Masqué à l’impression.
export default function SignBox({ token, quoteOnly, clientName, total }: { token: string; quoteOnly: boolean; clientName: string; total: string }) {
  const [accept, setAccept] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState<"" | "accepte" | "refuse">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Étape 2 : code reçu par e-mail (adresse masquée affichée au client).
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const docs = quoteOnly ? "le devis" : "le devis et le contrat de prestation";
  const ready = accept && name.trim().length >= 3 && (quoteOnly || image !== "");

  async function askCode() {
    if (!ready || busy) return;
    setBusy(true); setError("");
    const res = await fetch(`/api/devis/${token}/sign/code`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error || "Le code n’a pas pu être envoyé. Réessayez ou appelez-nous au 07 83 74 89 71."); return; }
    setSentTo(data.email); setCode("");
  }

  async function sign() {
    if (!ready || busy || code.replace(/\D/g, "").length !== 6) return;
    setBusy(true); setError("");
    const res = await fetch(`/api/devis/${token}/sign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, accept, doc: quoteOnly ? "devis" : "contrat", image: image || undefined, code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setError(data.error || "La signature n’a pas pu être enregistrée. Réessayez ou appelez-nous au 07 83 74 89 71."); return; }
    window.location.reload();
  }

  return (
    <section className="dv-signbox" aria-label="Signer en ligne">
      <h2>Signer en ligne</h2>
      <p>Après avoir bien relu {docs}, vous pouvez les signer ici. Votre réservation sera confirmée à réception de l’acompte.</p>
      {quoteOnly ? null : (
        <fieldset className="dv-signbox-image">
          <legend>Droit à l’image (article 9 du contrat) :</legend>
          <label><input type="radio" name="image" checked={image === "accepte"} onChange={() => setImage("accepte")} /> J’accepte</label>
          <label><input type="radio" name="image" checked={image === "refuse"} onChange={() => setImage("refuse")} /> Je refuse</label>
        </fieldset>
      )}
      <label className="dv-signbox-check">
        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
        <span>J’ai lu et j’accepte {docs}, pour un montant total de <b>{total}</b>.</span>
      </label>
      <label className="dv-signbox-name">Vos nom et prénom (valant signature)
        <input value={name} placeholder={clientName} autoComplete="name" onChange={(e) => setName(e.target.value)} />
      </label>
      {sentTo ? (
        <div className="dv-signbox-code">
          <label>Code reçu par e-mail à <b>{sentTo}</b> (valable 15 minutes)
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </label>
          {error ? <p className="dv-signbox-error">{error}</p> : null}
          <button type="button" className="dv-print" disabled={!ready || busy || code.length !== 6} onClick={sign}>{busy ? "Signature…" : "✍️ Signer"}</button>
          <button type="button" className="dv-linkbtn" disabled={busy} onClick={askCode}>Je n’ai pas reçu le code : le renvoyer</button>
        </div>
      ) : (
        <>
          {error ? <p className="dv-signbox-error">{error}</p> : null}
          <button type="button" className="dv-print" disabled={!ready || busy} onClick={askCode}>{busy ? "Envoi du code…" : "Recevoir mon code de signature par e-mail"}</button>
        </>
      )}
      <p className="dv-signbox-legal">Signature électronique simple : un code est envoyé à votre adresse e-mail pour confirmer votre identité. Vos nom, date, heure et adresse de connexion sont enregistrés comme preuve de votre accord.</p>
    </section>
  );
}
