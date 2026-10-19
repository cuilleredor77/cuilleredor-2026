"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  FORMULAS, FORMULA_KEYS, OPTION_PRESETS, computeTotals, daysBetween, formatDateFR, formatDateShort,
  formatEUR, lineTotal, presetToLine, todayISO, type FormulaKey, type Quote, type QuoteLine, type RequestRow,
} from "../../../lib/quote";

const STATUS: Array<[string, string]> = [
  ["nouvelle", "Nouvelle"], ["en_cours", "En cours"], ["devis_pret", "Devis prêt"], ["envoye", "Envoyé"],
  ["signe", "Signé"], ["acompte", "Acompte reçu"], ["archivee", "Archivée"],
];

function firstName(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts.find((p) => /[a-zà-ÿ]/.test(p)) || parts[0] || "";
}

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const [req, setReq] = useState<RequestRow | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [mail, setMail] = useState(false);
  const [presetId, setPresetId] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/requests/${id}`, { cache: "no-store" });
    if (res.status === 401) { window.location.href = "/admin"; return; }
    const data = await res.json();
    setReq(data.request); setQuote(data.quote); setDirty(!data.request.quote_json);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => (quote && req ? computeTotals(quote, req.event_date) : null), [quote, req]);
  const alerts = useMemo(() => {
    if (!req || !quote || !totals) return [];
    const out: string[] = [];
    const key = (FORMULA_KEYS as string[]).includes(req.formula) ? (req.formula as FormulaKey) : "buffet";
    if (!req.client_email) out.push("E-mail du client manquant.");
    if (!req.event_date) out.push("Date de l’événement manquante.");
    else if (daysBetween(todayISO(), req.event_date) < 0) out.push("La date de l’événement est dépassée.");
    else if (totals.fullAtSignature) out.push("Événement dans moins de 2 mois : règlement intégral à la signature.");
    if (req.adults < FORMULAS[key].min) out.push(`Moins que le minimum de la formule (${FORMULAS[key].min} convives) : à valider avant d’envoyer.`);
    if (!req.km && req.event_place) out.push("Frais de déplacement non calculés : cliquez sur « Calculer les km ».");
    if (!req.event_place) out.push("Lieu de l’événement manquant.");
    if (quote.lines.some((l) => !(l.price > 0) || !(l.qty > 0))) out.push("Une ligne a une quantité ou un prix à zéro.");
    return out;
  }, [req, quote, totals]);

  if (!req || !quote || !totals) return <p className="adm-muted">Chargement…</p>;

  const setField = (k: keyof RequestRow, v: string | number | null) => { setReq({ ...req, [k]: v } as RequestRow); setDirty(true); };
  const setQ = (patch: Partial<Quote>) => { setQuote({ ...quote, ...patch }); setDirty(true); };
  const setLine = (i: number, patch: Partial<QuoteLine>) => setQ({ lines: quote.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  const totalGuests = req.adults + req.children + req.providers;

  async function save(extra: Record<string, unknown> = {}): Promise<boolean> {
    setBusy(true); setMsg("");
    const res = await fetch(`/api/admin/requests/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ request: req, quote, ...extra }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(data.error || "Enregistrement impossible."); return false; }
    setReq(data.request); setQuote(data.quote); setDirty(false); setMsg("Enregistré ✓");
    return true;
  }

  async function regenerate() {
    if (!confirm("Régénérer toutes les lignes à partir de la demande ? Vos modifications de lignes seront remplacées.")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/requests/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ request: req, regenerate: true }) });
    const data = await res.json();
    setBusy(false);
    if (res.ok) { setReq(data.request); setQuote(data.quote); setDirty(false); setMsg("Lignes régénérées ✓"); }
  }

  async function computeKm() {
    setMsg("Calcul de la distance…");
    const res = await fetch("/api/admin/distance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address: req!.event_place }) });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error || "Calcul impossible."); return; }
    setField("km", data.km);
    setMsg(`${data.km} km aller-retour (${data.oneWay} km l’aller) — pensez à régénérer les lignes pour intégrer le déplacement.`);
  }

  async function preview() {
    if (dirty && !(await save())) return;
    window.open(`/devis/${req!.token}`, "_blank");
  }

  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/devis/${req.token}`;
  const dateShort = req.event_date ? formatDateShort(req.event_date) : "";
  const subject = `Votre devis Cuillère d’Or — ${req.event_type} du ${dateShort} — ${req.client_name}`;
  const body = [
    `Bonjour ${firstName(req.client_name)},`,
    "",
    `Merci pour votre demande pour votre ${req.event_type.toLowerCase()} du ${req.event_date ? formatDateFR(req.event_date, true) : ""}${req.event_place ? ` à ${req.event_place}` : ""}. Nous sommes disponibles à cette date.`,
    "",
    "Vous trouverez votre devis et votre contrat à cette adresse (bouton « Télécharger en PDF » pour les enregistrer) :",
    link,
    "",
    `• ${quote.summary}`,
    `• Total : ${formatEUR(totals.total)}`,
    totals.fullAtSignature
      ? `• Règlement intégral à la signature : ${formatEUR(totals.total)}`
      : `• Acompte de 30 % à la signature : ${formatEUR(totals.deposit)} — solde de ${formatEUR(totals.balance)} au plus tard le ${formatDateFR(totals.balanceDue)}`,
    `• Devis valable jusqu’au ${formatDateFR(totals.validUntil)}`,
    "",
    "Pour réserver votre date, il vous suffit de nous retourner le contrat signé : nous vous communiquerons alors nos coordonnées bancaires pour l’acompte.",
    "",
    "Bien cordialement,",
    "Cheffe Huguette — 07 83 74 89 71 | cuilleredor4@gmail.com",
  ].join("\n");
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&authuser=cuilleredor4%40gmail.com&to=${encodeURIComponent(req.client_email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="adm-wrap">
      <header className="adm-top">
        <div>
          <a href="/admin" className="adm-back">← Toutes les demandes</a>
          <h1>{req.client_name || "Demande sans nom"}</h1>
          <p className="adm-muted">Reçue le {formatDateShort(req.created_at)} · source : {req.source}{req.sent_at ? ` · envoyé le ${formatDateShort(req.sent_at)}` : ""}</p>
        </div>
        <div className="adm-actions">
          <select value={req.status} onChange={(e) => { setReq({ ...req, status: e.target.value }); setDirty(true); }}>
            {STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button className="adm-btn" onClick={preview} disabled={busy}>Aperçu du devis</button>
          <button className="adm-btn" onClick={() => save({ status: req.status })} disabled={busy || !dirty}>{dirty ? "Enregistrer" : "Enregistré"}</button>
          <button className="adm-btn adm-gold" onClick={async () => { if (!dirty || (await save())) setMail(true); }} disabled={busy}>Préparer l’e-mail →</button>
        </div>
      </header>
      {msg ? <p className="adm-note">{msg}</p> : null}
      {alerts.length ? <ul className="adm-alerts">{alerts.map((a) => <li key={a}>⚠ {a}</li>)}</ul> : null}

      <div className="adm-cols">
        <div>
          <section className="adm-card">
            <h2>La demande</h2>
            <div className="adm-grid">
              <label>Nom et prénom<input value={req.client_name} onChange={(e) => setField("client_name", e.target.value)} /></label>
              <label>Téléphone<input value={req.client_phone} onChange={(e) => setField("client_phone", e.target.value)} /></label>
              <label>E-mail<input type="email" value={req.client_email} onChange={(e) => setField("client_email", e.target.value)} /></label>
              <label>Adresse de facturation (si société)<input value={req.billing_address} onChange={(e) => setField("billing_address", e.target.value)} /></label>
              <label>Type d’événement<input value={req.event_type} onChange={(e) => setField("event_type", e.target.value)} /></label>
              <label>Date<input type="date" value={req.event_date} onChange={(e) => setField("event_date", e.target.value)} /></label>
              <label className="wide">Lieu (adresse complète)<input value={req.event_place} onChange={(e) => setField("event_place", e.target.value)} /></label>
              <label>Formule
                <select value={req.formula} onChange={(e) => setField("formula", e.target.value)}>
                  {FORMULA_KEYS.map((k) => <option key={k} value={k}>{FORMULAS[k].label}</option>)}
                </select>
              </label>
              <label>Adultes<input type="number" min={0} value={req.adults} onChange={(e) => setField("adults", Number(e.target.value))} /></label>
              <label>Enfants<input type="number" min={0} value={req.children} onChange={(e) => setField("children", Number(e.target.value))} /></label>
              <label>Prestataires<input type="number" min={0} value={req.providers} onChange={(e) => setField("providers", Number(e.target.value))} /></label>
              <label className="chk"><input type="checkbox" checked={Boolean(req.honor_wine)} onChange={(e) => setField("honor_wine", e.target.checked ? 1 : 0)} /> Avec vin d’honneur (buffet, plateau, assiette)</label>
              <label>Km aller-retour
                <span className="adm-inline">
                  <input type="number" step="0.1" min={0} value={req.km ?? ""} onChange={(e) => setField("km", e.target.value === "" ? null : Number(e.target.value))} />
                  <button type="button" className="adm-btn" onClick={computeKm}>Calculer les km</button>
                </span>
              </label>
            </div>
            {req.message || req.selection_text || req.budget ? (
              <div className="adm-client">
                {req.budget ? <p><b>Budget indiqué :</b> {req.budget} €</p> : null}
                {req.message ? <p><b>Message du client :</b> {req.message}</p> : null}
                {req.selection_text ? <p><b>Plats choisis :</b> {req.selection_text}</p> : null}
              </div>
            ) : null}
            <label className="wide">Notes internes (non visibles du client)
              <textarea rows={2} value={req.internal_notes} onChange={(e) => setField("internal_notes", e.target.value)} />
            </label>
          </section>

          <section className="adm-card">
            <div className="adm-split"><h2>Lignes du devis</h2><button className="adm-btn" onClick={regenerate} disabled={busy}>↻ Régénérer depuis la demande</button></div>
            <div className="adm-lines">
              {quote.lines.map((line, i) => (
                <div className="adm-line" key={line.id}>
                  <input className="q" type="number" step="any" value={line.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} />
                  <input className="u" value={line.unit} onChange={(e) => setLine(i, { unit: e.target.value })} />
                  <div className="t">
                    <input value={line.label} onChange={(e) => setLine(i, { label: e.target.value })} />
                    <input className="d" placeholder="Détail (facultatif)" value={line.detail || ""} onChange={(e) => setLine(i, { detail: e.target.value })} />
                  </div>
                  <input className="p" type="number" step="any" value={line.price} onChange={(e) => setLine(i, { price: Number(e.target.value) })} />
                  <b className="s">{formatEUR(lineTotal(line))}</b>
                  <button className="x" aria-label="Supprimer la ligne" onClick={() => setQ({ lines: quote.lines.filter((_, idx) => idx !== i) })}>✕</button>
                </div>
              ))}
            </div>
            <div className="adm-inline">
              <select value={presetId} onChange={(e) => {
                const preset = OPTION_PRESETS.find((p) => p.id === e.target.value);
                if (preset) setQ({ lines: [...quote.lines, presetToLine(preset, req.adults, totalGuests)] });
                setPresetId("");
              }}>
                <option value="">+ Ajouter une option du catalogue…</option>
                {OPTION_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.price} €/{p.unit}</option>)}
              </select>
              <button className="adm-btn" onClick={() => setQ({ lines: [...quote.lines, { id: `l-${Date.now()}`, qty: 1, unit: "forfait", label: "Nouvelle ligne", price: 0 }] })}>+ Ligne libre</button>
            </div>
          </section>

          <section className="adm-card">
            <h2>Texte du devis</h2>
            <div className="adm-grid">
              <label>Date d’émission<input type="date" value={quote.issuedOn} onChange={(e) => setQ({ issuedOn: e.target.value })} /></label>
              <label className="chk"><input type="checkbox" checked={quote.includeComplementary} onChange={(e) => setQ({ includeComplementary: e.target.checked })} /> Joindre la page « Services complémentaires »</label>
              <label className="wide">Prestation souhaitée<input value={quote.summary} onChange={(e) => setQ({ summary: e.target.value })} /></label>
              <label className="wide">Options / remarques<input value={quote.remarks} onChange={(e) => setQ({ remarks: e.target.value })} /></label>
              <label className="wide">Mention libre sous les conditions (facultatif)<textarea rows={2} value={quote.note} onChange={(e) => setQ({ note: e.target.value })} /></label>
            </div>
          </section>
        </div>

        <aside className="adm-card adm-sticky">
          <h2>Totaux</h2>
          <dl className="adm-totals">
            <div><dt>Total TTC</dt><dd>{formatEUR(totals.total)}</dd></div>
            <div><dt>{totals.fullAtSignature ? "À la signature (100 %)" : "Acompte (30 %)"}</dt><dd>{formatEUR(totals.deposit)}</dd></div>
            {!totals.fullAtSignature ? <div><dt>Solde (70 %)</dt><dd>{formatEUR(totals.balance)}</dd></div> : null}
            {!totals.fullAtSignature && totals.balanceDue ? <div><dt>Solde dû le</dt><dd>{formatDateFR(totals.balanceDue)}</dd></div> : null}
            <div><dt>Caution</dt><dd>{formatEUR(totals.caution)}</dd></div>
            <div><dt>Valable jusqu’au</dt><dd>{formatDateFR(totals.validUntil)}</dd></div>
          </dl>
          <p className="adm-muted">Fichier : CDO_{(req.event_date || "").replaceAll("-", "")}_…_Devis_Contrat</p>
        </aside>
      </div>

      {mail ? (
        <div className="adm-modal" onClick={() => setMail(false)}>
          <div className="adm-card adm-mail" onClick={(e) => e.stopPropagation()}>
            <h2>E-mail au client</h2>
            <p className="adm-muted">Relisez, puis ouvrez Gmail : le message est pré-rempli, vous n’avez plus qu’à cliquer sur « Envoyer ».</p>
            <p><b>À :</b> {req.client_email || <em>(adresse manquante)</em>}</p>
            <p><b>Objet :</b> {subject}</p>
            <pre className="adm-pre">{body}</pre>
            <div className="adm-actions">
              <button className="adm-btn" onClick={() => navigator.clipboard.writeText(body)}>Copier le texte</button>
              <a className="adm-btn adm-gold" href={gmail} target="_blank" rel="noreferrer">Ouvrir dans Gmail ↗</a>
              <button className="adm-btn" onClick={async () => { if (await save({ markSent: true })) setMail(false); }}>✔ C’est envoyé : marquer comme envoyé</button>
              <button className="adm-btn" onClick={() => setMail(false)}>Fermer</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
