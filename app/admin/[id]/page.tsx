"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  FORMULAS, FORMULA_KEYS, OPTION_PRESETS, SOURCE_LABEL, receivedAt, withoutTechNoise, unavailableEmail, charterEmail, computeTotals, formatDateFR,
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
  const [sheetFinder, setSheetFinder] = useState("");
  const [files, setFiles] = useState<{ filename: string; content: string; size: number }[]>([]);
  const [presetId, setPresetId] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/requests/${id}`, { cache: "no-store" });
    if (res.status === 401) { window.location.href = "/admin"; return; }
    const data = await res.json();
    setReq(data.request); setQuote(data.quote); setDirty(!data.request.quote_json); setSheetFinder(data.sheetFinderUrl || "");
    // Ouverture directe de la fenêtre e-mail depuis la page du devis (?mail=1&doc=devis)
    const params = new URLSearchParams(window.location.search);
    if (params.get("mail") === "1") { setWithContract(params.get("doc") !== "devis"); setMail(true); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => (quote && req ? computeTotals(quote, req.event_date) : null), [quote, req]);
  // Google Agenda : alerte quand 3 événements ou plus sont déjà prévus à la date demandée.
  const [agenda, setAgenda] = useState<{ count: number; titles: string[]; off: string[] } | null>(null);
  const [negative, setNegative] = useState(false);
  const [agendaStatus, setAgendaStatus] = useState<"" | "loading" | "off" | "error" | "ok">("");
  const eventDate = req?.event_date || "";
  useEffect(() => {
    setAgenda(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) { setAgendaStatus(""); return; }
    setAgendaStatus("loading");
    const timer = setTimeout(() => {
      fetch(`/api/admin/agenda?date=${eventDate}`)
        .then((r) => r.json())
        .then((d) => {
          setAgenda(d.agenda); setAgendaStatus(!d.connected ? "off" : d.agenda ? "ok" : "error");
          // Période OFF : la réponse proposée par défaut est la réponse négative.
          if (d.agenda?.off?.length) setNegative(true);
        })
        .catch(() => setAgendaStatus("error"));
    }, 600);
    return () => clearTimeout(timer);
  }, [eventDate]);
  const alerts = useMemo(() => {
    const list = req && quote && totals ? quoteAlerts(req, quote, totals) : [];
    if (agenda?.off?.length) list.unshift(`⛔ Huguette est OFF ce jour-là (${agenda.off.join(", ")}) : envoyer la réponse négative (« Préparer l’e-mail » → Indisponible).`);
    if (agenda && agenda.count >= 3) list.unshift(`Déjà ${agenda.count} événements dans ton agenda ce jour-là (${agenda.titles.join(", ")}) : vérifie la disponibilité.`);
    return list;
  }, [req, quote, totals, agenda]);

  if (!req || !quote || !totals) return <p className="adm-muted">Chargement…</p>;

  const setField = (k: keyof RequestRow, v: string | number | null) => { setReq({ ...req, [k]: v } as RequestRow); setDirty(true); };
  const setQ = (patch: Partial<Quote>) => { setQuote({ ...quote, ...patch }); setDirty(true); };
  const setLine = (i: number, patch: Partial<QuoteLine>) => setQ({ lines: quote.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  const totalGuests = req.adults + req.children + req.providers;

  async function removeRequest() {
    if (!confirm(`Supprimer définitivement la demande de ${req!.client_name || "ce client"} ? Cette action est irréversible.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/requests/${id}`, { method: "DELETE" });
    if (res.ok) { window.location.href = "/admin"; return; }
    setBusy(false); setMsg("Suppression impossible.");
  }

  // Modifications non enregistrées : on enregistre avant d’ouvrir le devis, sinon il montrerait l’ancienne version.
  async function openSaved(e: { preventDefault: () => void }, href: string) {
    if (!dirty) return;
    e.preventDefault();
    const tab = window.open("about:blank", "_blank");
    if (await save()) { if (tab) tab.location.href = href; else window.open(href, "_blank"); } else tab?.close();
  }

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
  const { subject, html, text } = negative ? unavailableEmail(req) : charterEmail(req, quote, totals, "", withContract);
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
          <p className="adm-origin">
            Origine : <b>{SOURCE_LABEL[req.source] || req.source}</b> · reçue le <b>{receivedAt(req.created_at)}</b>{req.sent_at ? ` · envoyé le ${receivedAt(req.sent_at)}` : ""}
            {req.source === "google_sheet" && sheetFinder ? (
              <> · <a href={`${sheetFinder}?email=${encodeURIComponent(req.client_email)}&date=${req.event_date}`} target="_blank" rel="noopener noreferrer">📄 Demande initiale ↗</a></>
            ) : null}
          </p>
        </div>
        <div className="adm-actions">
          <select value={req.status} onChange={(e) => { setReq({ ...req, status: e.target.value }); setDirty(true); }}>
            {STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <a className="adm-btn" href={quoteLink} target="_blank" rel="noopener noreferrer" onClick={(e) => openSaved(e, quoteLink)}>Devis seul ↗</a>
          <a className="adm-btn" href={fullLink} target="_blank" rel="noopener noreferrer" onClick={(e) => openSaved(e, fullLink)}>Devis + contrat ↗</a>
          <button className="adm-btn" onClick={() => save({ status: req.status })} disabled={busy || !dirty}>{dirty ? "Enregistrer" : "Enregistré"}</button>
          <button className="adm-btn adm-gold" onClick={async () => { if (!dirty || (await save())) setMail(true); }} disabled={busy}>Préparer l’e-mail →</button>
          <button className="adm-btn adm-danger" onClick={removeRequest} disabled={busy}>🗑 Supprimer</button>
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
              <label>Date<input type="date" value={req.event_date} onChange={(e) => setField("event_date", e.target.value)} />
                {agendaStatus ? (
                  <small className={`adm-agenda ${agenda && (agenda.count >= 3 || agenda.off.length) ? "full" : ""}`} title={agenda?.titles.join("\n") || ""}>
                    📅 {agendaStatus === "loading" ? "Agenda : vérification…"
                      : agendaStatus === "off" ? "Agenda Google non relié"
                      : agendaStatus === "error" ? "Agenda : lecture impossible"
                      : agenda!.off.length ? `Huguette OFF ce jour-là (${agenda!.off.join(", ")})`
                      : agenda!.count === 0 ? "Agenda : aucun événement ce jour-là"
                      : `Agenda : ${agenda!.count} événement${agenda!.count > 1 ? "s" : ""} ce jour-là (${agenda!.titles.join(", ")})`}
                  </small>
                ) : null}
              </label>
              <label className="wide">Lieu (adresse complète)
                <span className="adm-inline adm-place">
                  <input value={req.event_place} onChange={(e) => setField("event_place", e.target.value)} />
                  {req.event_place.trim() ? (
                    <a className="adm-btn" href={mapsLink(req.event_place)} target="_blank" rel="noopener noreferrer" title="Itinéraire aller-retour depuis Vert-Saint-Denis">🗺 Itinéraire AR ↗</a>
                  ) : null}
                </span>
              </label>
              <label className="wide">Km aller-retour
                <span className="adm-inline">
                  <input type="number" step="0.1" min={0} value={req.km ?? ""} onChange={(e) => setField("km", e.target.value === "" ? null : Number(e.target.value))} />
                  <button type="button" className="adm-btn" onClick={computeKm}>Calculer les km</button>
                </span>
              </label>
              <label>Formule
                <select value={req.formula} onChange={(e) => setField("formula", e.target.value)}>
                  {FORMULA_KEYS.map((k) => <option key={k} value={k}>{FORMULAS[k].label}</option>)}
                </select>
              </label>
              <label>Adultes<input type="number" min={0} value={req.adults} onChange={(e) => setField("adults", Number(e.target.value))} /></label>
              <label>Enfants<input type="number" min={0} value={req.children} onChange={(e) => setField("children", Number(e.target.value))} /></label>
              <label>Prestataires<input type="number" min={0} value={req.providers} onChange={(e) => setField("providers", Number(e.target.value))} /></label>
              <label className="chk"><input type="checkbox" checked={Boolean(req.honor_wine)} onChange={(e) => setField("honor_wine", e.target.checked ? 1 : 0)} /> Avec vin d’honneur (buffet, plateau, assiette)</label>
            </div>
            {(
              <div className="adm-client">
                <p><b>Prestation :</b> {serviceModeLabel(req.service_mode)} · <b>Wedding planner :</b> {weddingPlannerLabel(req.wedding_planner)}{req.vendors_found ? <> · <b>Prestataires trouvés :</b> {req.vendors_found}</> : null}</p>
                {req.budget ? <p><b>Budget indiqué :</b> {req.budget.replace(/\s*€\s*$/, "")} €</p> : null}
                {req.message ? <p className="adm-msg"><b>Message du client :</b>{"\n"}{withoutTechNoise(req.message)}</p> : null}
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
                onChange={(e) => {
                  // Enregistré tout de suite : le devis en ligne et le PDF montrent aussitôt le changement.
                  const next = {
                    ...quote,
                    lines: e.target.checked
                      ? [...quote.lines.filter((l) => !/d[ée]placement/i.test(l.label)), { id: "dechets", qty: 1, unit: "forfait", label: "Gestion des déchets alimentaires (hors verre)", price: 50 }, ...quote.lines.filter((l) => /d[ée]placement/i.test(l.label))]
                      : quote.lines.filter((l) => !(l.id === "dechets" || /d[ée]chets/i.test(l.label))),
                  };
                  setQuote(next);
                  save({ quote: next });
                }}
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
              <label className="wide">Options / remarques<textarea rows={2} value={quote.remarks} onChange={(e) => setQ({ remarks: e.target.value })} /></label>
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
              <button className={!negative && !withContract ? "on" : ""} onClick={() => { setNegative(false); setWithContract(false); setCopied(""); }}>Devis seul</button>
              <button className={!negative && withContract ? "on" : ""} onClick={() => { setNegative(false); setWithContract(true); setCopied(""); }}>Devis + contrat</button>
              <button className={negative ? "on" : ""} onClick={() => { setNegative(true); setCopied(""); }}>Indisponible</button>
            </div>
            <p><b>À :</b> {req.client_email || <em>(adresse manquante)</em>}</p>
            <p><b>Objet :</b> {subject}</p>
            <div className="adm-mailpreview" dangerouslySetInnerHTML={{ __html: html }} />
            {copied ? <p className="adm-note">{copied}</p> : null}
            {!negative ? <div className="adm-attach">
              <label className="adm-btn">📎 Ajouter une pièce jointe<input type="file" multiple accept=".pdf,image/*,.doc,.docx" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} /></label>
              {files.length ? (
                <ul>{files.map((f, i) => <li key={i}>{f.filename} <span className="adm-muted">({Math.max(1, Math.round(f.size / 1024))} Ko)</span> <button className="adm-x" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Retirer">✕</button></li>)}</ul>
              ) : <span className="adm-muted">Pour l’envoi direct : télécharge le PDF (bouton 3) puis ajoute-le ici.</span>}
            </div> : null}
            <div className="adm-actions">
              <button className="adm-btn adm-gold" onClick={copyFormatted}>1. Copier l’e-mail mis en forme</button>
              <a className="adm-btn adm-gold" href={gmail} target="_blank" rel="noopener noreferrer">2. Ouvrir Gmail (destinataire + objet) ↗</a>
              {negative ? (
                <button className="adm-btn" onClick={async () => { if (await save({ status: "abandonnee" })) { setReq({ ...req, status: "abandonnee" }); setMail(false); } }}>✔ C’est envoyé : classer en Abandonnée</button>
              ) : (
                <>
                  <a className="adm-btn adm-gold" href={link} target="_blank" rel="noopener noreferrer">3. Télécharger le PDF à joindre ↗</a>
                  <button className="adm-btn" disabled={busy || !!req.sent_at} onClick={sendNow}>{req.sent_at ? "Déjà envoyé ✓" : "Envoyer directement depuis le site"}</button>
                  <button className="adm-btn" onClick={async () => { if (await save({ markSent: true })) setMail(false); }}>✔ C’est envoyé : marquer comme envoyé</button>
                </>
              )}
              <button className="adm-btn" onClick={() => setMail(false)}>Fermer</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Même lien que la formule « Lien itinéraire » du Google Sheet : dépôt → lieu → dépôt (Google affiche les km aller-retour).
const DEPOT = "8+All.+des+Bois,+77240+Vert-Saint-Denis,+France";

function mapsLink(place: string): string {
  return `https://www.google.com/maps/dir/${DEPOT}/${encodeURIComponent(place.trim())}/${DEPOT}/`;
}
