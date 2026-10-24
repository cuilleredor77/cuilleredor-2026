"use client";

// Bloc « Factures » de la fiche : créer (acompte, solde, unique, personnalisée, avoir), modifier tant que non envoyée, suivre envoi et paiement.
import { useState } from "react";
import { formatDateFR, formatEUR } from "../../../lib/quote";
import { INVOICE_KINDS, invoiceTotals, parseInvoice, type Invoice, type InvoiceData, type InvoiceKind } from "../../../lib/invoice";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const num = (v: string) => Number(v.replace(",", ".")) || 0;

export default function Invoices({ id, token, invoices, setInvoices }: { id: string; token: string; invoices: Invoice[]; setInvoices: (l: Invoice[]) => void }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [draft, setDraft] = useState<InvoiceData | null>(null);
  const [issued, setIssued] = useState("");
  const [avoirOf, setAvoirOf] = useState("");

  async function call(method: string, body?: unknown, query = "") {
    setBusy(true); setMsg("");
    const res = await fetch(`/api/admin/requests/${id}/invoices${query}`, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(data.error || "Action impossible."); return null; }
    setInvoices(data.invoices);
    return data;
  }
  async function create(kind: InvoiceKind, source_id?: number) {
    const data = await call("POST", { kind, source_id });
    if (data) {
      const inv = (data.invoices as Invoice[]).find((i) => i.number === data.number);
      if (inv) edit(inv);
    }
  }
  function edit(inv: Invoice) { setOpen(inv.id); setDraft(parseInvoice(inv)); setIssued(inv.issued_on); }
  async function save(inv: Invoice) {
    if (!draft) return;
    const ok = await call("PUT", { invoice_id: inv.id, data: draft, issued_on: issued });
    if (ok) { setOpen(null); setDraft(null); window.open(`/devis/${token}/facture/${inv.number}`, "_blank", "noopener"); }
  }
  const track = (inv: Invoice, patch: { sent_on?: string; paid_on?: string }) => call("PUT", { invoice_id: inv.id, ...patch });
  async function remove(inv: Invoice) {
    if (!confirm(`Supprimer le brouillon ${inv.number} ? Le numéro sera réutilisé par la prochaine facture.`)) return;
    if (await call("DELETE", undefined, `?invoice_id=${inv.id}`)) { setOpen(null); setDraft(null); }
  }
  const setLine = (i: number, patch: Partial<InvoiceData["lines"][number]>) => draft && setDraft({ ...draft, lines: draft.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  const setDed = (i: number, patch: Partial<InvoiceData["deductions"][number]>) => draft && setDraft({ ...draft, deductions: draft.deductions.map((d, j) => (j === i ? { ...d, ...patch } : d)) });
  const sendable = invoices.filter((i) => i.kind !== "avoir");

  return (
    <section className="adm-card adm-amend adm-invoices">
      <h2>Factures</h2>
      {invoices.length ? (
        <ul className="adm-amend-list">
          {invoices.map((inv) => {
            const d = parseInvoice(inv);
            const total = invoiceTotals(d).net;
            return (
              <li key={inv.id}>
                <div>
                  <a href={`/devis/${token}/facture/${inv.number}`} target="_blank" rel="noopener noreferrer">{inv.number} ↗</a>
                  <span> · {INVOICE_KINDS[inv.kind].label}{inv.ref_number ? ` de ${inv.ref_number}` : ""} · {formatEUR(total)} · émise le {formatDateFR(inv.issued_on)}</span>
                  {inv.status === "brouillon" ? <button type="button" className="adm-linkbtn" onClick={() => (open === inv.id ? setOpen(null) : edit(inv))}>{open === inv.id ? "fermer" : "modifier"}</button> : null}
                  {inv.status === "brouillon" ? <button type="button" className="adm-linkbtn" onClick={() => remove(inv)}>supprimer</button> : null}
                </div>
                <div className="adm-amend-track">
                  <span className={`adm-pill ${inv.paid_on ? "ok" : inv.sent_on ? "sent" : ""}`}>{inv.paid_on ? (inv.kind === "avoir" ? "✓ Remboursé" : "✓ Soldée") : inv.sent_on ? "Envoyée · à régler" : "Brouillon · à régler"}</span>
                  <label>Envoyée le<input type="date" value={inv.sent_on || ""} onChange={(e) => (e.target.value || confirm("Repasser en brouillon modifiable ? À éviter si le client l’a déjà reçue.")) && track(inv, { sent_on: e.target.value })} /></label>
                  {!inv.sent_on ? <button type="button" className="adm-btn" onClick={() => confirm(`Marquer ${inv.number} comme envoyée ? Elle ne sera plus modifiable.${!(d.client.address || "").trim() ? "\n\n⚠️ L’adresse du client est vide : une ligne restera à remplir à la main sur la facture." : ""}`) && track(inv, { sent_on: today() })}>Envoyée aujourd’hui</button> : null}
                  {inv.archived_on ? <span className="adm-muted">📁 PDF archivé sur le Drive le {formatDateFR(inv.archived_on)}</span> : inv.sent_on ? <span className="adm-muted">📁 Archivage du PDF sur le Drive : à faire</span> : null}
                  {!inv.sent_on && !(d.client.address || "").trim() ? <span className="adm-inv-warn">⚠️ Adresse du client à compléter (mention obligatoire)</span> : null}
                  {!inv.sent_on && d.client.pro && !(d.client.extra || "").trim() ? <span className="adm-inv-warn">⚠️ SIREN du client professionnel à compléter</span> : null}
                  <label>{inv.kind === "avoir" ? "Remboursé le" : "Soldée le"}<input type="date" value={inv.paid_on || ""} onChange={(e) => track(inv, { paid_on: e.target.value })} /></label>
                  {!inv.paid_on && inv.kind !== "avoir" ? <button type="button" className="adm-btn" onClick={() => track(inv, { paid_on: today() })}>✓ Soldée aujourd’hui</button> : null}
                </div>
                {open === inv.id && draft ? (
                  <div className="adm-inv-edit">
                    <div className="adm-grid">
                      <label>Titre<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
                      <label>Date d’émission<input type="date" value={issued} onChange={(e) => setIssued(e.target.value)} /></label>
                      <label>Client (nom ou société)<input value={draft.client.name} onChange={(e) => setDraft({ ...draft, client: { ...draft.client, name: e.target.value } })} /></label>
                      <label className="chk"><input type="checkbox" checked={Boolean(draft.client.pro)} onChange={(e) => setDraft({ ...draft, client: { ...draft.client, pro: e.target.checked || undefined } })} /> Client professionnel (entreprise, wedding planner…) : ajoute les mentions de retard obligatoires</label>
                      <label>SIREN / n° TVA (client pro)<input value={draft.client.extra} onChange={(e) => setDraft({ ...draft, client: { ...draft.client, extra: e.target.value } })} /></label>
                      <label>À l’attention de<input value={draft.client.attention || ""} placeholder="Ex. M. Derrick ADU" onChange={(e) => setDraft({ ...draft, client: { ...draft.client, attention: e.target.value } })} /></label>
                      <label className="wide">Objet<input value={draft.subject || ""} placeholder="Prestation traiteur — Mariage de … — date, lieu — convives, formule" onChange={(e) => setDraft({ ...draft, subject: e.target.value })} /></label>
                      <label className="wide">Adresse de facturation (mention obligatoire)<textarea rows={2} value={draft.client.address} onChange={(e) => setDraft({ ...draft, client: { ...draft.client, address: e.target.value } })} /></label>
                      <label>Échéance (vide = à réception)<input type="date" value={draft.dueOn} onChange={(e) => setDraft({ ...draft, dueOn: e.target.value })} /></label>
                    </div>
                    <p className="adm-muted">Lignes</p>
                    {draft.lines.map((l, i) => (
                      <div key={i} className="adm-inv-line">
                        <input placeholder="Désignation" value={l.label} onChange={(e) => setLine(i, { label: e.target.value })} />
                        <input placeholder="Détail" value={l.detail || ""} onChange={(e) => setLine(i, { detail: e.target.value })} />
                        <input aria-label="Quantité" inputMode="decimal" value={String(l.qty).replace(".", ",")} onChange={(e) => setLine(i, { qty: num(e.target.value) })} />
                        <input aria-label="Unité" value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })} />
                        <input aria-label="Prix unitaire" inputMode="decimal" value={String(l.price).replace(".", ",")} onChange={(e) => setLine(i, { price: num(e.target.value) })} />
                        <b>{formatEUR(l.qty * l.price)}</b>
                        <button type="button" className="adm-linkbtn" onClick={() => setDraft({ ...draft, lines: draft.lines.filter((_, j) => j !== i) })}>✕</button>
                      </div>
                    ))}
                    <button type="button" className="adm-btn" onClick={() => setDraft({ ...draft, lines: [...draft.lines, { label: "", qty: 1, unit: "forfait", price: 0 }] })}>+ Ligne</button>
                    <p className="adm-muted">Déductions (acomptes déjà facturés)</p>
                    {draft.deductions.map((d, i) => (
                      <div key={i} className="adm-inv-line adm-inv-ded">
                        <input value={d.label} onChange={(e) => setDed(i, { label: e.target.value })} />
                        <input inputMode="decimal" value={String(d.amount).replace(".", ",")} onChange={(e) => setDed(i, { amount: num(e.target.value) })} />
                        <button type="button" className="adm-linkbtn" onClick={() => setDraft({ ...draft, deductions: draft.deductions.filter((_, j) => j !== i) })}>✕</button>
                      </div>
                    ))}
                    <button type="button" className="adm-btn" onClick={() => setDraft({ ...draft, deductions: [...draft.deductions, { label: "Acompte déjà réglé", amount: 0 }] })}>+ Déduction</button>
                    <label className="wide">Note sur la facture<textarea rows={2} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></label>
                    <p><b>Total : {formatEUR(invoiceTotals(draft).net)}</b></p>
                    <button type="button" className="adm-btn adm-gold" disabled={busy} onClick={() => save(inv)}>💾 Enregistrer et voir la facture</button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : <p className="adm-muted">Aucune facture. Numérotation continue : la prochaine suit la dernière émise.</p>}
      <div className="adm-inv-new">
        <button type="button" className="adm-btn" disabled={busy} onClick={() => create("acompte")}>🧾 Facture d’acompte</button>
        <button type="button" className="adm-btn" disabled={busy} onClick={() => create("solde")}>🧾 Facture de solde</button>
        <button type="button" className="adm-btn" disabled={busy} onClick={() => create("unique")}>🧾 Facture unique</button>
        <button type="button" className="adm-btn" disabled={busy} onClick={() => create("perso")}>✏️ Personnalisée</button>
      </div>
      {sendable.length ? (
        <div className="adm-inv-new">
          <select value={avoirOf} onChange={(e) => setAvoirOf(e.target.value)}>
            <option value="">Avoir sur la facture…</option>
            {sendable.map((i) => <option key={i.id} value={i.id}>{i.number} · {formatEUR(invoiceTotals(parseInvoice(i)).net)}</option>)}
          </select>
          <button type="button" className="adm-btn" disabled={busy || !avoirOf} onClick={() => create("avoir", Number(avoirOf)).then(() => setAvoirOf(""))}>↩︎ Créer l’avoir</button>
        </div>
      ) : null}
      {msg ? <p className="adm-note">{msg}</p> : null}
    </section>
  );
}
