"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  FORMULAS, FORMULA_KEYS, OPTION_PRESETS, charterEmail, computeTotals, formatDateFR, formatDateShort,
  formatEUR, isTravelPending, lineTotal, presetToLine, quoteAlerts, serviceModeLabel, weddingPlannerLabel, type Quote, type QuoteLine, type RequestRow,
} from "../../../lib/quote";

const STATUS: Array<[string, string]> = [
  ["nouvelle", "Nouvelle"], ["en_cours", "En cours"], ["devis_pret", "Devis prêt"], ["envoye", "Envoyé"],
  ["signe", "Signé"], ["acompte", "Acompte reçu"], ["archivee", "Archivée"], ["abandonnee", "Abandonnée"],
];

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const [req, setReq] = useState<RequestRow | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [mail, setMail] = useState(false);
  const [withContract, setWithContract] = useState(true);
  const [copied, setCopied] = useState("");
  const [files, setFiles] = useState<{ filename: string; content: string; size: number }[]>([]);
  const [presetId, setPresetId] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/requests/${id}`, { cache: "no-store" });
    if (res.status === 401) { window.location.href = "/admin"; return; }
    const data = await res.json();
    setReq(data.request); setQuote(data.quote); setDirty(!data.request.quote_json);
    // Ouverture directe de la fenêtre e-mail depuis la page du devis (?mail=1&doc=devis)
    const params = new URLSearchParams(window.location.search);
    if (params.get("mail") === "1") { setWithContract(params.get("doc") !== "devis"); setMail(true); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => (quote && req ? computeTotals(quote, req.event_date) : null), [quote, req]);
  const alerts = useMemo(() => (req && quote && totals ? quoteAlerts(req, quote, totals) : []), [req, quote, totals]);

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

  async function sendNow() {
    if (dirty && !(await save())) return;
    const warn = files.length ? `avec ${files.length} pièce${files.length > 1 ? "s" : ""} jointe${files.length > 1 ? "s" : ""}` : "SANS pièce jointe (le mail contiendra alors le lien vers le devis en ligne)";
    if (!confirm(`Envoyer le devis à ${req!.client_email} ${warn} ?`)) return;
    setBusy(true); setMsg("");
    const attachments = files.map(({ filename, content }) => ({ filename, content }));
    const res = await fetch(`/api/admin/requests/${id}/send`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ withContract, attachments }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(data.error || "Envoi impossible."); return; }
    setReq(data.request); setMail(false); setFiles([]); setMsg("Devis envoyé au client ✓");
  }

  async function addFiles(list: FileList | null) {
    const added = await Promise.all(Array.from(list || []).map((f) => new Promise<{ filename: string; content: string; size: number }>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve({ filename: f.name, content: String(r.result).split(",")[1] || "", size: f.size });
      r.onerror = () => reject(r.error);
      r.readAsDataURL(f);
    })));
    setFiles((cur) => [...cur, ...added]);
  }


  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullLink = `${origin}/devis/${req.token}`;
  const quoteLink = `${fullLink}?doc=devis`;
  const link = withContract ? fullLink : quoteLink;
  const { subject, html, text } = charterEmail(req, quote, totals, "", withContract);
  // Gmail ne reçoit que l’objet par l’adresse : le corps mis en forme se colle (Cmd+V) après « Copier l’e-mail mis en forme ».
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&authuser=cuilleredor4%40gmail.com&to=${encodeURIComponent(req.client_email)}&su=${encodeURIComponent(subject)}`;
  async function copyFormatted() {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]);
    } catch {
      await navigator.clipboard.writeText(text);
    }
    setCopied("E-mail copié avec sa mise en forme : collez-le (Cmd+V) dans Gmail.");
  }

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
          <a className="adm-btn" href={quoteLink} target="_blank" rel="noopener noreferrer">Devis seul ↗</a>
          <a className="adm-btn" href={fullLink} target="_blank" rel="noopener noreferrer">Devis + contrat ↗</a>
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
                  {req.event_place.trim() ? (
                    <a className="adm-btn" href={mapsLink(req.event_place)} target="_blank" rel="noopener noreferrer" title="Itinéraire depuis Vert-Saint-Denis : multiplier la distance par 2 pour l’aller-retour">🗺 Google Maps ↗</a>
                  ) : null}
                </span>
              </label>
            </div>
            {(
              <div className="adm-client">
                <p><b>Prestation :</b> {serviceModeLabel(req.service_mode)} · <b>Wedding planner :</b> {weddingPlannerLabel(req.wedding_planner)}{req.vendors_found ? <> · <b>Prestataires trouvés :</b> {req.vendors_found}</> : null}</p>
                {req.budget ? <p><b>Budget indiqué :</b> {req.budget.replace(/\s*€\s*$/, "")} €</p> : null}
                {req.message ? <p><b>Message du client :</b> {req.message}</p> : null}
                {req.selection_text ? <p><b>Plats choisis :</b> {req.selection_text}</p> : null}
              </div>
            )}
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
                  <b className="s">{isTravelPending(line) ? "à chiffrer" : formatEUR(lineTotal(line))}</b>
                  <button className="x" aria-label="Supprimer la ligne" onClick={() => setQ({ lines: quote.lines.filter((_, idx) => idx !== i) })}>✕</button>
                </div>
              ))}
            </div>
            <label className="adm-check">
              <input
                type="checkbox"
                checked={quote.lines.some((l) => l.id === "dechets" || /d[ée]chets/i.test(l.label))}
                onChange={(e) => setQ({
                  lines: e.target.checked
                    ? [...quote.lines.filter((l) => !/d[ée]placement/i.test(l.label)), { id: "dechets", qty: 1, unit: "forfait", label: "Gestion des déchets alimentaires (hors verre)", price: 50 }, ...quote.lines.filter((l) => /d[ée]placement/i.test(l.label))]
                    : quote.lines.filter((l) => !(l.id === "dechets" || /d[ée]chets/i.test(l.label))),
                })}
              />
              Gestion des déchets alimentaires (hors verre) — 50 € <span className="adm-muted">· cochée par défaut, à décocher si le lieu garde les déchets</span>
            </label>
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
            <div className="adm-seg">
              <button className={withContract ? "" : "on"} onClick={() => { setWithContract(false); setCopied(""); }}>Devis seul</button>
              <button className={withContract ? "on" : ""} onClick={() => { setWithContract(true); setCopied(""); }}>Devis + contrat</button>
            </div>
            <p><b>À :</b> {req.client_email || <em>(adresse manquante)</em>}</p>
            <p><b>Objet :</b> {subject}</p>
            <div className="adm-mailpreview" dangerouslySetInnerHTML={{ __html: html }} />
            {copied ? <p className="adm-note">{copied}</p> : null}
            <div className="adm-attach">
              <label className="adm-btn">📎 Ajouter une pièce jointe<input type="file" multiple accept=".pdf,image/*,.doc,.docx" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} /></label>
              {files.length ? (
                <ul>{files.map((f, i) => <li key={i}>{f.filename} <span className="adm-muted">({Math.max(1, Math.round(f.size / 1024))} Ko)</span> <button className="adm-x" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Retirer">✕</button></li>)}</ul>
              ) : <span className="adm-muted">Pour l’envoi direct : télécharge le PDF (bouton 3) puis ajoute-le ici.</span>}
            </div>
            <div className="adm-actions">
              <button className="adm-btn adm-gold" onClick={copyFormatted}>1. Copier l’e-mail mis en forme</button>
              <a className="adm-btn adm-gold" href={gmail} target="_blank" rel="noopener noreferrer">2. Ouvrir Gmail (destinataire + objet) ↗</a>
              <a className="adm-btn adm-gold" href={link} target="_blank" rel="noopener noreferrer">3. Télécharger le PDF à joindre ↗</a>
              <button className="adm-btn" disabled={busy || !!req.sent_at} onClick={sendNow}>{req.sent_at ? "Déjà envoyé ✓" : "Envoyer directement depuis le site"}</button>
              <button className="adm-btn" onClick={async () => { if (await save({ markSent: true })) setMail(false); }}>✔ C’est envoyé : marquer comme envoyé</button>
              <button className="adm-btn" onClick={() => setMail(false)}>Fermer</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const DEPOT = "8 Allée des Bois, 77240 Vert-Saint-Denis";

/** Itinéraire en voiture depuis le dépôt jusqu’au lieu saisi (distance aller : ×2 pour l’aller-retour). */
function mapsLink(place: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(DEPOT)}&destination=${encodeURIComponent(place.trim())}&travelmode=driving`;
}
