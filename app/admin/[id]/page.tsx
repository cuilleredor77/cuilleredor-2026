"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  FORMULAS, FORMULA_KEYS, OPTION_PRESETS, mariagesNetReply, honorWineLines, isHonorWineLine, travelLast, isIncluded, withGroup, groupOrder, offPeriod, SOURCE_LABEL, receivedAt, withoutTechNoise, unavailableEmail, agendaDayLink, charterEmail, computeTotals, formatDateFR,
  formatEUR, isTravelPending, isLodgingPending, lineTotal, presetToLine, quoteAlerts, amendmentChanges, paidTotal, type Payment, parseSnapshot, snapshotOf, type Amendment, serviceModeLabel, weddingPlannerLabel, type Quote, type QuoteLine, type RequestRow,
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
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [amendReason, setAmendReason] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/requests/${id}`, { cache: "no-store" });
    if (res.status === 401) { window.location.href = "/admin"; return; }
    const data = await res.json();
    setReq(data.request); setQuote(data.quote); setDirty(!data.request.quote_json); setSheetFinder(data.sheetFinderUrl || ""); setAmendments(data.amendments || []);
    // Demande Mariages.net : la réponse type est proposée par défaut (pas d’e-mail du client).
    if (data.request.source === "mariages_net") setMnet(true);
    // Ouverture directe de la fenêtre e-mail depuis la page du devis (?mail=1&doc=devis)
    const params = new URLSearchParams(window.location.search);
    if (params.get("mail") === "1") { setWithContract(params.get("doc") !== "devis"); setMail(true); }
    // Date dans une période OFF : la réponse négative est proposée par défaut.
    if (offPeriod(data.request.event_date)) setNegative(true);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => (quote && req ? computeTotals(quote, req.event_date, req.service_mode) : null), [quote, req]);
  // Google Agenda : alerte quand 3 événements ou plus sont déjà prévus à la date demandée.
  const [agenda, setAgenda] = useState<{ count: number; titles: string[]; off: string[] } | null>(null);
  const [negative, setNegative] = useState(false);
  // Enregistrement automatique : compteur de modifications et heure du dernier enregistrement.
  const edits = useRef(0);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  // Navigation fiche à fiche dans la liste d’où l’on vient (rangée par la liste dans sessionStorage).
  const [nav, setNav] = useState<{ label: string; ids: number[] } | null>(null);
  useEffect(() => {
    try { const v = sessionStorage.getItem("adm-nav"); if (v) setNav(JSON.parse(v)); } catch { /* navigation privée */ }
  }, []);
  const saveRef = useRef<() => Promise<boolean>>(async () => true);
  useEffect(() => {
    if (!dirty || busy || mail) return;
    const t = setTimeout(() => { saveRef.current(); }, 1200);
    return () => clearTimeout(t);
  }, [dirty, busy, mail, req, quote]);
  const [secondFormula, setSecondFormula] = useState("assiette");
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [unavailableQuote, setUnavailableQuote] = useState(false);
  const [mnet, setMnet] = useState(false);
  // Version du mail modifiée à la main dans l’aperçu (null = modèle proposé).
  const [edited, setEdited] = useState<{ subject: string; html: string; text: string } | null>(null);
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

  const setField = (k: keyof RequestRow, v: string | number | null) => { edits.current += 1; setReq({ ...req, [k]: v } as RequestRow); setDirty(true); };
  const setQ = (patch: Partial<Quote>) => { edits.current += 1; setQuote({ ...quote, ...patch }); setDirty(true); };
  const setLine = (i: number, patch: Partial<QuoteLine>) => setQ({ lines: quote.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  const totalGuests = req.adults + req.children + req.providers;
  // Lignes + barre « OPTIONS » : au-dessus = prestations incluses, en dessous = options.
  // Déplacer une ligne (glisser-déposer ou flèches) peut lui faire franchir la barre ; le déplacement reste en dernier.
  const includedCount = quote.lines.filter(isIncluded).length;
  type Slot = QuoteLine | "SEP";
  const slots = (): Slot[] => [...quote.lines.slice(0, includedCount), "SEP", ...quote.lines.slice(includedCount)];
  const slotOf = (i: number) => (i < includedCount ? i : i + 1);
  const applySlots = (list: Slot[]) => {
    const sep = list.indexOf("SEP");
    const lines = list.filter((x): x is QuoteLine => x !== "SEP").map((l) => withGroup(l, list.indexOf(l) < sep));
    setQ({ lines: groupOrder(lines) });
  };
  const moveSlot = (from: number, to: number) => {
    const list = slots();
    if (from === to || to < 0 || to >= list.length) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    applySlots(list);
  };
  const moveLine = (from: number, to: number) => moveSlot(slotOf(from), slotOf(to));
  // Flèches : un cran dans la liste avec la barre ; passer la barre change de bloc.
  const stepLine = (i: number, dir: -1 | 1) => moveSlot(slotOf(i), slotOf(i) + dir);
  const dropOnSeparator = (from: number) => {
    const list = slots();
    const fromSlot = slotOf(from);
    const sep = list.indexOf("SEP");
    const [moved] = list.splice(fromSlot, 1);
    list.splice(fromSlot < sep ? sep : sep + 1, 0, moved); // incluse → 1re option ; option → dernière incluse
    applySlots(list);
  };

  // Avenants (devis signé) : différences entre la dernière version signée et la fiche telle qu’elle est maintenant.
  const signed = req.status === "signe" || req.status === "acompte";
  const lastAmendment = amendments[amendments.length - 1];
  const reference = signed ? parseSnapshot(lastAmendment ? lastAmendment.after_json : req.signed_snapshot) : null;
  const pendingChanges = reference ? amendmentChanges(reference, snapshotOf({ ...req, quote_json: JSON.stringify(quote) })) : [];
  async function createAmendment() {
    if (dirty && !(await save())) return;
    if (!confirm(`Générer l’avenant n°${(lastAmendment?.number || 0) + 1} (${pendingChanges.length} modification${pendingChanges.length > 1 ? "s" : ""}) ?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/requests/${id}/amendments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: amendReason }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(data.error || "Avenant impossible."); return; }
    setAmendments(data.amendments); setAmendReason("");
    setMsg(`Avenant n°${data.number} généré.`);
    window.open(`/devis/${req!.token}/avenant/${data.number}`, "_blank", "noopener");
  }
  async function trackAmendment(number: number, patch: { sent_on?: string; signed_on?: string }) {
    const res = await fetch(`/api/admin/requests/${id}/amendments`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ number, ...patch }) });
    const data = await res.json();
    if (res.ok) setAmendments(data.amendments); else setMsg(data.error || "Enregistrement impossible.");
  }
  async function removeLastAmendment() {
    if (!lastAmendment || !confirm(`Supprimer l’avenant n°${lastAmendment.number} ? Les modifications resteront dans la fiche et pourront être reprises dans un nouvel avenant.`)) return;
    const res = await fetch(`/api/admin/requests/${id}/amendments`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) setAmendments(data.amendments); else setMsg(data.error || "Suppression impossible.");
  }

  // Second devis : même demande, autre formule (ouvert dans un nouvel onglet).
  async function createSecondQuote() {
    if (dirty && !(await save())) return;
    if (!confirm(`Créer un second devis pour ${req!.client_name} avec la formule « ${FORMULAS[secondFormula as keyof typeof FORMULAS].label} » ?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/requests/${id}/duplicate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ formula: secondFormula }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(data.error || "Création impossible."); return; }
    setMsg(`Second devis créé (demande n°${data.id}).`);
    window.location.href = `/admin/${data.id}`;
  }

  // Fiche suivante / précédente : on enregistre d’abord les modifications en cours.
  const navIdx = nav ? nav.ids.indexOf(Number(id)) : -1;
  const navInfo = nav && navIdx >= 0 ? { pos: navIdx + 1, total: nav.ids.length, prev: nav.ids[navIdx - 1], next: nav.ids[navIdx + 1] } : null;
  async function goTo(e: { preventDefault: () => void }, target: number) {
    e.preventDefault();
    if (dirty && !(await save())) return;
    window.location.href = `/admin/${target}`;
  }

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
    const seq = edits.current;
    const res = await fetch(`/api/admin/requests/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ request: req, quote, ...extra }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(data.error || "Enregistrement impossible."); return false; }
    setSavedAt(new Date());
    // Si l’on a continué à écrire pendant l’enregistrement, on garde la saisie en cours (elle sera enregistrée ensuite).
    if (edits.current === seq) { setReq(data.request); setQuote(data.quote); setDirty(false); }
    return true;
  }

  saveRef.current = () => save();

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
    const res = await fetch(`/api/admin/requests/${id}/send`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ withContract, attachments, unavailable: unavailableQuote, custom: edited }) });
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
  const model = mnet ? mariagesNetReply(req) : negative ? unavailableEmail(req) : charterEmail(req, quote, totals, "", withContract, unavailableQuote);
  const mnetUrl = req.internal_notes.match(/Répondre : (https:\/\/\S+)/)?.[1] || "";
  const { subject, html, text } = edited ?? model;
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
          <div className="adm-navline">
            <a href="/admin" className="adm-back">← Toutes les demandes</a>
            {navInfo ? (
              <span className="adm-pager">
                {navInfo.prev ? <a href={`/admin/${navInfo.prev}`} onClick={(e) => goTo(e, navInfo.prev!)}>‹ Précédente</a> : <span className="off">‹ Précédente</span>}
                <span>{navInfo.pos} / {navInfo.total} · {nav!.label}</span>
                {navInfo.next ? <a href={`/admin/${navInfo.next}`} onClick={(e) => goTo(e, navInfo.next!)}>Suivante ›</a> : <span className="off">Suivante ›</span>}
              </span>
            ) : null}
          </div>
          <h1>{req.client_name || "Demande sans nom"}</h1>
          <p className="adm-origin">
            Origine : <b>{SOURCE_LABEL[req.source] || req.source}</b> · reçue le <b>{receivedAt(req.created_at)}</b>{req.sent_at ? ` · envoyé le ${receivedAt(req.sent_at)}` : ""}
            {req.source === "mariages_net" && /Répondre : (https:\/\/\S+)/.test(req.internal_notes) ? (
              <> · <a href={req.internal_notes.match(/Répondre : (https:\/\/\S+)/)![1]} target="_blank" rel="noopener noreferrer">💬 Répondre sur Mariages.net ↗</a></>
            ) : null}
            {req.source === "google_sheet" && sheetFinder ? (
              <> · <a href={`${sheetFinder}?email=${encodeURIComponent(req.client_email)}&date=${req.event_date}`} target="_blank" rel="noopener noreferrer">📄 Demande initiale ↗</a></>
            ) : null}
          </p>
        </div>
        <div className="adm-toolbar">
          <span className={`adm-status s-${req.status}`}>
            <select aria-label="Statut" value={req.status} onChange={(e) => setField("status", e.target.value)}>
              {STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </span>
          <a className="adm-btn" href={quoteLink} target="_blank" rel="noopener noreferrer" onClick={(e) => openSaved(e, quoteLink)}>Devis seul ↗</a>
          <a className="adm-btn" href={fullLink} target="_blank" rel="noopener noreferrer" onClick={(e) => openSaved(e, fullLink)}>Devis + contrat ↗</a>
          <span className={`adm-savestate ${dirty ? "pending" : ""}`} aria-live="polite">
            {busy ? "Enregistrement…" : dirty ? "Modifications en cours…" : savedAt ? `Enregistré ✓ ${savedAt.getHours().toString().padStart(2, "0")}h${savedAt.getMinutes().toString().padStart(2, "0")}` : "Enregistré ✓"}
          </span>
          <button className="adm-btn adm-gold" onClick={async () => { if (!dirty || (await save())) setMail(true); }} disabled={busy}>Préparer l’e-mail →</button>
          <details className="adm-more">
            <summary className="adm-btn" aria-label="Autres actions">⋯</summary>
            <div className="adm-more-menu">
              <label>Second devis avec la formule
                <select aria-label="Formule du second devis" value={secondFormula} onChange={(e) => setSecondFormula(e.target.value)}>
                  {FORMULA_KEYS.map((k) => <option key={k} value={k}>{FORMULAS[k].label}</option>)}
                </select>
              </label>
              <button className="adm-btn" onClick={createSecondQuote} disabled={busy}>➕ Créer le second devis</button>
              <hr />
              <button className="adm-btn adm-danger" onClick={removeRequest} disabled={busy}>🗑 Supprimer la demande</button>
            </div>
          </details>
        </div>
      </header>
      {msg ? <p className="adm-note">{msg}</p> : null}
      {alerts.length ? <ul className="adm-alerts">{alerts.map((a) => <li key={a}>⚠ {a}</li>)}</ul> : null}

      <div className="adm-cols">
        <div>
          {signed ? (
            <section className="adm-card adm-amend">
              <h2>Avenants</h2>
              {amendments.length ? (
                <ul className="adm-amend-list">
                  {amendments.map((a) => (
                    <li key={a.id}>
                      <div>
                        <a href={`/devis/${req.token}/avenant/${a.number}`} target="_blank" rel="noopener noreferrer">Avenant n°{a.number} ↗</a>
                        <span> · créé le {formatDateFR(a.created_at.slice(0, 10))}{a.reason ? ` · ${a.reason}` : ""}</span>
                        {a.id === lastAmendment?.id && !a.sent_on && !a.signed_on ? <button type="button" className="adm-linkbtn" onClick={removeLastAmendment}>supprimer</button> : null}
                      </div>
                      <div className="adm-amend-track">
                        <span className={`adm-pill ${a.signed_on ? "ok" : a.sent_on ? "sent" : ""}`}>{a.signed_on ? "✓ Signé" : a.sent_on ? "Envoyé, en attente de signature" : "Pas encore envoyé"}</span>
                        <label>Envoyé le<input type="date" value={a.sent_on || ""} onChange={(e) => trackAmendment(a.number, { sent_on: e.target.value })} /></label>
                        {!a.sent_on ? <button type="button" className="adm-btn" onClick={() => trackAmendment(a.number, { sent_on: new Date().toISOString().slice(0, 10) })}>Envoyé aujourd’hui</button> : null}
                        <label>Signé le<input type="date" value={a.signed_on || ""} onChange={(e) => trackAmendment(a.number, { signed_on: e.target.value })} /></label>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
              {!reference ? (
                <p className="adm-muted">Version signée introuvable : repassez le statut sur Signé, puis modifiez le devis.</p>
              ) : pendingChanges.length ? (
                <>
                  <p><b>{pendingChanges.length} modification{pendingChanges.length > 1 ? "s" : ""}</b> depuis {lastAmendment ? `l’avenant n°${lastAmendment.number}` : "la version signée"} :</p>
                  <ul className="adm-amend-changes">
                    {pendingChanges.map((c, i) => <li key={i}><b>{c.label}</b> : {c.before} → {c.after}</li>)}
                  </ul>
                  <label className="wide">Objet de l’avenant (facultatif)<input value={amendReason} placeholder="Ex. : 20 invités de plus, ajout du brunch" onChange={(e) => setAmendReason(e.target.value)} /></label>
                  <button type="button" className="adm-btn adm-gold" disabled={busy} onClick={createAmendment}>📝 Générer l’avenant n°{(lastAmendment?.number || 0) + 1}</button>
                </>
              ) : (
                <p className="adm-muted">Modifiez la demande ou les lignes du devis ci-dessous : les changements apparaîtront ici et pourront être regroupés dans un avenant.</p>
              )}
            </section>
          ) : null}

          <section className="adm-card">
            <h2>La demande</h2>
            <div className="adm-grid">
              <label>Nom et prénom<input value={req.client_name} onChange={(e) => setField("client_name", e.target.value)} /></label>
              <label>Téléphone<input value={req.client_phone} onChange={(e) => setField("client_phone", e.target.value)} /></label>
              <label>E-mail<input type="email" value={req.client_email} onChange={(e) => setField("client_email", e.target.value)} /></label>
              <label>Adresse de facturation (si société)<input value={req.billing_address} onChange={(e) => setField("billing_address", e.target.value)} /></label>
              <label>Type d’événement<input value={req.event_type} onChange={(e) => setField("event_type", e.target.value)} /></label>
              <label>Date<input type="date" value={req.event_date} onChange={(e) => setField("event_date", e.target.value)} />
                <span className="adm-date-extra">
                {/^\d{4}-\d{2}-\d{2}$/.test(req.event_date) ? (
                  <a className="adm-agenda-link" href={agendaDayLink(req.event_date)} target="_blank" rel="noopener noreferrer">📅 Voir l’agenda ce jour-là ↗</a>
                ) : null}
                {agendaStatus && agendaStatus !== "off" ? (
                  <small className={`adm-agenda ${agenda && (agenda.count >= 3 || agenda.off.length) ? "full" : ""}`} title={agenda?.titles.join("\n") || ""}>
                    📅 {agendaStatus === "loading" ? "Agenda : vérification…"
                      : agendaStatus === "off" ? "Agenda Google non relié"
                      : agendaStatus === "error" ? "Agenda : lecture impossible"
                      : agenda!.off.length ? `Huguette OFF ce jour-là (${agenda!.off.join(", ")})`
                      : agenda!.count === 0 ? "Agenda : aucun événement ce jour-là"
                      : `Agenda : ${agenda!.count} événement${agenda!.count > 1 ? "s" : ""} ce jour-là (${agenda!.titles.join(", ")})`}
                  </small>
                ) : null}
                </span>
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
              <div className="adm-row4">
              <label>Formule
                <select value={req.formula} onChange={(e) => setField("formula", e.target.value)}>
                  {FORMULA_KEYS.map((k) => <option key={k} value={k}>{FORMULAS[k].label}</option>)}
                </select>
              </label>
              <label>Adultes<input type="number" min={0} value={req.adults} onChange={(e) => setField("adults", Number(e.target.value))} /></label>
              <label>Enfants<input type="number" min={0} value={req.children} onChange={(e) => setField("children", Number(e.target.value))} /></label>
              <label>Prestataires<input type="number" min={0} value={req.providers} onChange={(e) => setField("providers", Number(e.target.value))} /></label>
              </div>
              <label className="chk"><input type="checkbox" checked={Boolean(req.honor_wine)} onChange={(e) => {
                // Coché : les deux suppléments (10 pièces + 4 cocktails) s’ajoutent juste après le repas ; décoché : ils sont retirés.
                const on = e.target.checked;
                setField("honor_wine", on ? 1 : 0);
                const rest = quote.lines.filter((l) => !isHonorWineLine(l));
                const at = Math.max(0, rest.findIndex((l) => l.id === "main") + 1);
                setQ({ lines: on ? groupOrder([...rest.slice(0, at), ...honorWineLines(req.adults), ...rest.slice(at)]) : rest });
              }} /> Avec vin d’honneur : 10 pièces + 4 cocktails (buffet, plateau, assiette)</label>
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
              <p className="adm-group-title">Prestations incluses</p>
              {includedCount === 0 ? <OptionsBar onDrop={() => dragFrom !== null && dropOnSeparator(dragFrom)} active={dragFrom !== null} /> : null}
              {quote.lines.map((line, i) => (
                <Fragment key={line.id}>
                {i === includedCount && i > 0 ? <OptionsBar onDrop={() => dragFrom !== null && dropOnSeparator(dragFrom)} active={dragFrom !== null} /> : null}
                <div
                  className={`adm-line ${dragOver === i && dragFrom !== null && dragFrom !== i ? "drop" : ""} ${dragFrom === i ? "dragging" : ""}`}
                  onDragOver={(e) => { if (dragFrom !== null) { e.preventDefault(); setDragOver(i); } }}
                  onDrop={(e) => { e.preventDefault(); if (dragFrom !== null) moveLine(dragFrom, i); setDragFrom(null); setDragOver(null); }}
                >
                  <div className="g">
                    <span className="grip" draggable title="Glisser pour déplacer la ligne"
                      onDragStart={(e) => { setDragFrom(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); }}
                      onDragEnd={() => { setDragFrom(null); setDragOver(null); }}>⠿</span>
                    <button type="button" aria-label="Monter la ligne" disabled={slotOf(i) === 0} onClick={() => stepLine(i, -1)}>▲</button>
                    <button type="button" aria-label="Descendre la ligne" disabled={slotOf(i) === quote.lines.length} onClick={() => stepLine(i, 1)}>▼</button>
                  </div>
                  <input className="q" type="number" step="any" value={line.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} />
                  <input className="u" value={line.unit} onChange={(e) => setLine(i, { unit: e.target.value })} />
                  <div className="t">
                    <input value={line.label} onChange={(e) => setLine(i, { label: e.target.value })} />
                    <input className="d" placeholder="Détail (facultatif)" value={line.detail || ""} onChange={(e) => setLine(i, { detail: e.target.value })} />
                  </div>
                  <input className="p" type="number" step="any" value={line.price} onChange={(e) => setLine(i, { price: Number(e.target.value) })} />
                  <b className="s">{isTravelPending(line) || isLodgingPending(line) ? "à chiffrer" : formatEUR(lineTotal(line))}</b>
                  <button className="x" aria-label="Supprimer la ligne" onClick={() => setQ({ lines: quote.lines.filter((_, idx) => idx !== i) })}>✕</button>
                </div>
                </Fragment>
              ))}
              {includedCount === quote.lines.length && includedCount > 0 ? <OptionsBar onDrop={() => dragFrom !== null && dropOnSeparator(dragFrom)} active={dragFrom !== null} /> : null}
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
                if (preset) setQ({ lines: travelLast([...quote.lines, presetToLine(preset, req.adults, totalGuests, req.adults + req.children)]) });
                setPresetId("");
              }}>
                <option value="">+ Ajouter une option du catalogue…</option>
                {OPTION_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.price} €/{p.unit}</option>)}
              </select>
              <button className="adm-btn" onClick={() => setQ({ lines: travelLast([...quote.lines, { id: `l-${Date.now()}`, qty: 1, unit: "forfait", label: "Nouvelle ligne", price: 0 }]) })}>+ Ligne libre</button>
            </div>
          </section>

          <section className="adm-card">
            <h2>Texte du devis</h2>
            <div className="adm-grid">
              <label>Date d’émission<input type="date" value={quote.issuedOn} onChange={(e) => setQ({ issuedOn: e.target.value })} /></label>
              <label>Solde dû le (vide = 2 mois avant)<input type="date" value={quote.balanceDue || ""} onChange={(e) => setQ({ balanceDue: e.target.value || undefined })} /></label>
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
            <div><dt>Caution</dt><dd>{totals.caution ? formatEUR(totals.caution) : "aucune (sans service)"}</dd></div>
            <div><dt>Valable jusqu’au</dt><dd>{formatDateFR(totals.validUntil)}</dd></div>
          </dl>
          <div className="adm-pay">
            <h3>Paiements reçus</h3>
            {(quote.payments || []).map((p, i) => {
              const setPay = (patch: Partial<Payment>) => setQ({ payments: (quote.payments || []).map((x, k) => (k === i ? { ...x, ...patch } : x)) });
              return (
                <div key={p.id} className="adm-pay-row">
                  <div className="adm-pay-top">
                    <input value={p.label} aria-label="Paiement" onChange={(e) => setPay({ label: e.target.value })} />
                    <input type="number" step="0.01" min={0} value={p.amount} aria-label="Montant" onChange={(e) => setPay({ amount: Number(e.target.value) })} />
                    <button type="button" className="x" aria-label="Supprimer le paiement" onClick={() => setQ({ payments: (quote.payments || []).filter((_, k) => k !== i) })}>✕</button>
                  </div>
                  <label>Reçu le<input type="date" value={p.receivedOn} onChange={(e) => setPay({ receivedOn: e.target.value })} /></label>
                  <label>Confirmé le<input type="date" value={p.confirmedOn} onChange={(e) => setPay({ confirmedOn: e.target.value })} /></label>
                </div>
              );
            })}
            <div className="adm-pay-add">
              {([
                ["Acompte", totals.fullAtSignature ? totals.total : totals.deposit],
                ["Solde", Math.max(0, totals.total - paidTotal(quote))],
                ...(totals.caution ? [["Caution", totals.caution] as [string, number]] : []),
                ["Autre", 0],
              ] as Array<[string, number]>).map(([label, amount]) => (
                <button key={label} type="button" className="adm-btn" onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  setQ({ payments: [...(quote.payments || []), { id: `pay-${Math.random().toString(36).slice(2, 7)}`, label: label === "Autre" ? "" : label, amount, receivedOn: today, confirmedOn: "" }] });
                }}>+ {label}</button>
              ))}
            </div>
            {quote.payments?.length ? (
              <dl className="adm-totals">
                <div><dt>Reçu (hors caution)</dt><dd>{formatEUR(paidTotal(quote))}</dd></div>
                <div><dt>Reste à régler</dt><dd>{formatEUR(Math.max(0, totals.total - paidTotal(quote)))}</dd></div>
              </dl>
            ) : null}
          </div>
          <p className="adm-muted">Fichier : CDO_{(req.event_date || "").replaceAll("-", "")}_…_Devis_Contrat</p>
        </aside>
      </div>

      {mail ? (
        <div className="adm-modal" onClick={() => setMail(false)}>
          <div className="adm-card adm-mail" onClick={(e) => e.stopPropagation()}>
            <h2>E-mail au client</h2>
            <div className="adm-seg">
              {req.source === "mariages_net" ? <button className={mnet ? "on" : ""} onClick={() => { setMnet(true); setCopied(""); }}>💍 Réponse Mariages.net</button> : null}
              <button className={!mnet && !negative && !unavailableQuote && !withContract ? "on" : ""} onClick={() => { setMnet(false); setNegative(false); setUnavailableQuote(false); setWithContract(false); setCopied(""); }}>Devis seul</button>
              <button className={!mnet && !negative && !unavailableQuote && withContract ? "on" : ""} onClick={() => { setMnet(false); setNegative(false); setUnavailableQuote(false); setWithContract(true); setCopied(""); }}>Devis + contrat</button>
              <button className={!mnet && unavailableQuote ? "on" : ""} onClick={() => { setMnet(false); setNegative(false); setUnavailableQuote(true); setWithContract(false); setCopied(""); }}>Indispo + devis</button>
              <button className={!mnet && negative ? "on" : ""} onClick={() => { setMnet(false); setNegative(true); setUnavailableQuote(false); setCopied(""); }}>Indisponible</button>
            </div>
            <p><b>À :</b> {req.client_email || <em>(adresse manquante)</em>}</p>
            <MailEditor model={model} edited={edited} onChange={setEdited} />
            {copied ? <p className="adm-note">{copied}</p> : null}
            {mnet ? (
              <div className="adm-sendblocks">
                <section className="adm-sendblock">
                  <h3>Répondre sur Mariages.net</h3>
                  <div className="adm-steps">
                    <button className="adm-btn adm-gold" onClick={copyFormatted}>1. Copier le message</button>
                    {mnetUrl ? <a className="adm-btn adm-gold" href={mnetUrl} target="_blank" rel="noopener noreferrer">2. Ouvrir la demande ↗</a> : null}
                  </div>
                  <p className="adm-muted">Sur Mariages.net : colle le message (Cmd + V) dans la réponse, puis envoie.</p>
                </section>
              </div>
            ) : null}
            {!mnet ? <div className="adm-sendblocks">
              <section className="adm-sendblock">
                <h3>Envoyer avec Gmail</h3>
                <div className="adm-steps">
                  {!negative ? <a className="adm-btn adm-gold" href={link} target="_blank" rel="noopener noreferrer">1. Télécharger le PDF ↗</a> : null}
                  <button className="adm-btn adm-gold" onClick={copyFormatted}>{negative ? "1" : "2"}. Copier l’e-mail</button>
                  <a className="adm-btn adm-gold" href={gmail} target="_blank" rel="noopener noreferrer">{negative ? "2" : "3"}. Ouvrir Gmail ↗</a>
                </div>
                <p className="adm-muted">Dans Gmail : colle le texte (Cmd + V){!negative ? ", joins le PDF" : ""}, puis envoie.</p>
              </section>
              {!negative ? (
                <section className="adm-sendblock">
                  <h3>Ou envoyer directement depuis le site</h3>
                  <div className="adm-attach">
                    <label className="adm-btn">📎 Pièce jointe<input type="file" multiple accept=".pdf,image/*,.doc,.docx" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} /></label>
                    {files.length ? (
                      <ul>{files.map((f, i) => <li key={i}>{f.filename} <span className="adm-muted">({Math.max(1, Math.round(f.size / 1024))} Ko)</span> <button className="adm-x" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Retirer">✕</button></li>)}</ul>
                    ) : <span className="adm-muted">Joins le PDF téléchargé (étape 1).</span>}
                  </div>
                  <button className="adm-btn adm-gold adm-send" disabled={busy || !!req.sent_at} onClick={sendNow}>{req.sent_at ? "Déjà envoyé ✓" : "✉ Envoyer au client"}</button>
                </section>
              ) : null}
            </div> : null}
            <div className="adm-mailfoot">
              {negative ? (
                <button className="adm-btn" onClick={async () => { if (await save({ status: "abandonnee" })) { setReq({ ...req, status: "abandonnee" }); setMail(false); } }}>✔ Envoyé depuis Gmail : classer en Abandonnée</button>
              ) : (
                <button className="adm-btn" onClick={async () => { if (await save({ markSent: true })) setMail(false); }}>✔ Envoyé depuis Gmail : marquer comme envoyé</button>
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

/** Aperçu du mail modifiable : on clique dans le texte pour l’adapter avant de le copier ou de l’envoyer. */
function MailEditor({ model, edited, onChange }: {
  model: { subject: string; html: string; text: string };
  edited: { subject: string; html: string; text: string } | null;
  onChange: (v: { subject: string; html: string; text: string } | null) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  // Changement de modèle (devis, contrat, indisponible…) : on repart du texte proposé.
  useEffect(() => {
    if (box.current) box.current.innerHTML = model.html;
    onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.html]);
  const current = edited ?? model;
  const update = (subject = current.subject) => onChange({ subject, html: box.current?.innerHTML || "", text: box.current?.innerText || "" });
  return (
    <>
      <label className="adm-mailsubject"><b>Objet :</b>
        <input value={current.subject} onChange={(e) => update(e.target.value)} />
      </label>
      <div className="adm-mailpreview adm-editable" contentEditable suppressContentEditableWarning ref={box} onInput={() => update()} />
      <p className="adm-muted adm-mailhint">
        ✏️ Clique dans le texte pour le modifier avant de le copier ou de l’envoyer.
        {edited ? <> · <button type="button" className="adm-linkbtn" onClick={() => { if (box.current) box.current.innerHTML = model.html; onChange(null); }}>↺ Revenir au modèle</button></> : null}
      </p>
    </>
  );
}

/** Barre « OPTIONS » de l’éditeur : y déposer une ligne la fait changer de bloc (incluse ↔ option). */
function OptionsBar({ onDrop, active }: { onDrop: () => void; active: boolean }) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={`adm-sep ${active ? "active" : ""} ${over ? "over" : ""}`}
      onDragOver={(e) => { if (active) { e.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onDrop(); }}
    >
      <span>Options</span>
      <small>au-dessus : prestations incluses · en dessous : options</small>
    </div>
  );
}
