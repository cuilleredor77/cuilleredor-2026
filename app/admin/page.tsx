"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FORMULAS, FORMULA_KEYS, SOURCE_LABEL, receivedAt, offPeriod, formatDateShort, formatEUR, type FormulaKey } from "../../lib/quote";

type Item = {
  id: number; createdAt: string; source: string; status: string; name: string; email: string; phone: string;
  eventType: string; eventDate: string; place: string; formula: string; adults: number;
  children: number; providers: number; total: number; sentAt: string | null; hasQuote: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  nouvelle: "Nouvelle", en_cours: "En cours", devis_pret: "Devis prêt", envoye: "Envoyé",
  signe: "Signé", acompte: "Acompte reçu", archivee: "Archivée", abandonnee: "Abandonnée",
};

// Classement par action, calculé à partir du statut, de la date d’envoi et de la date de l’événement.
const TABS: Array<[string, string, string]> = [
  ["relire", "À relire", "Relire le devis puis l’envoyer"],
  ["verifier", "À vérifier", "Demandes importées, peut-être traitées sur WhatsApp : vérifier puis classer"],
  ["attente", "En attente", "Devis envoyé il y a moins de 7 jours"],
  ["relancer", "À relancer", "Devis envoyé il y a 7 à 45 jours, événement à venir"],
  ["confirmes", "Confirmés", "Contrat signé ou acompte reçu"],
  ["sans_reponse", "Sans réponse", "Devis envoyé il y a plus de 45 jours, sans retour"],
  ["archives", "Archives", "Événements passés et demandes abandonnées"],
  ["all", "Toutes", "Toutes les demandes"],
];
const QUIET = ["sans_reponse", "archives", "all"];

function bucketOf(it: Item, today: string): string {
  if (it.status === "archivee" || it.status === "abandonnee" || (it.eventDate && it.eventDate < today)) return "archives";
  if (it.status === "signe" || it.status === "acompte") return "confirmes";
  if (it.status === "en_cours" && !it.sentAt) return "verifier";
  if (!it.sentAt) return it.status === "envoye" ? "sans_reponse" : "relire";
  const days = daysAgo(it.sentAt);
  return days < 7 ? "attente" : days <= 45 ? "relancer" : "sans_reponse";
}

const daysAgo = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

export default function AdminHome() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [auth, setAuth] = useState<"loading" | "login" | "ok">("loading");
  const [filter, setFilter] = useState<string>("relire");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/requests", { cache: "no-store" });
    if (res.status === 401) return setAuth("login");
    const data = await res.json();
    setItems(data.requests);
    setAuth("ok");
  }, []);
  useEffect(() => { load().catch(() => setError("Chargement impossible.")); }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const buckets = useMemo(() => new Map((items || []).map((it) => [it.id, bucketOf(it, today)])), [items, today]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items?.length ?? 0 };
    for (const b of buckets.values()) c[b] = (c[b] || 0) + 1;
    return c;
  }, [items, buckets]);

  const shown = useMemo(() => {
    const q = norm(query.trim());
    // Une recherche porte sur toutes les demandes, quel que soit l’onglet choisi.
    const list = (items || []).filter((it) =>
      q
        ? norm([it.name, it.email, it.phone, it.place, it.eventType].join(" ")).includes(q) || norm(it.phone || "").replace(/\s/g, "").includes(q.replace(/\s/g, ""))
        : filter === "all" || buckets.get(it.id) === filter,
    );
    // Relances : les envois les plus anciens d’abord ; ailleurs, les demandes les plus récentes d’abord.
    return filter === "relancer" && !q
      ? list.sort((a, b) => (a.sentAt || "").localeCompare(b.sentAt || ""))
      : list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [items, filter, query, buckets]);

  async function markRelaunched(id: number) {
    const res = await fetch(`/api/admin/requests/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ relaunched: true }) });
    if (!res.ok) { setError("Impossible d’enregistrer la relance."); return; }
    const now = new Date().toISOString();
    setItems((cur) => (cur || []).map((it) => (it.id === id ? { ...it, status: "envoye", sentAt: now } : it)));
  }

  const showBadge = Boolean(query.trim()) || filter === "all";

  if (auth === "loading") return <p className="adm-muted">Chargement…</p>;
  if (auth === "login") return <Login onDone={load} />;

  return (
    <div className="adm-wrap">
      <header className="adm-top">
        <h1>Demandes de devis</h1>
        <div className="adm-actions">
          <button className="adm-btn adm-gold" onClick={() => setCreating(true)}>+ Nouvelle demande</button>
          <button className="adm-btn" onClick={async () => { await fetch("/api/admin/login", { method: "DELETE" }); setAuth("login"); }}>Se déconnecter</button>
        </div>
      </header>
      {error ? <p className="adm-error">{error}</p> : null}
      <input
        type="search"
        className="adm-search"
        placeholder="Rechercher un client (nom, e-mail, téléphone, lieu)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.trim() ? <p className="adm-muted">{shown.length} résultat{shown.length > 1 ? "s" : ""} dans toutes les demandes</p> : null}
      <nav className="adm-chips">
        {TABS.map(([key, label, hint]) => (
          <button key={key} title={hint} className={`adm-chip ${QUIET.includes(key) ? "quiet" : ""} ${filter === key ? "on" : ""}`} onClick={() => setFilter(key)}>
            {label} <b>{counts[key] || 0}</b>
          </button>
        ))}
      </nav>
      {!query.trim() ? <p className="adm-hint">{TABS.find(([k]) => k === filter)?.[2]}</p> : null}
      {shown.length === 0 ? <p className="adm-muted">{query.trim() ? "Aucun client ne correspond à cette recherche." : "Aucune demande dans cette liste."}</p> : null}
      {/* Le statut n’est utile que dans les listes qui en mélangent plusieurs. */}
      <ul className="adm-list">
        {shown.map((it) => {
          const wait = daysAgo(it.createdAt);
          const late = buckets.get(it.id) === "relire" && wait >= 3;
          const meta = FORMULAS[(FORMULA_KEYS as string[]).includes(it.formula) ? (it.formula as FormulaKey) : "buffet"];
          return (
            <li key={it.id}>
              <a href={`/admin/${it.id}`} className="adm-row">
                <span className="adm-l1">
                  {offPeriod(it.eventDate) ? <span className="adm-off" title="Huguette est OFF à cette date">⛔ OFF</span> : null}
                  <strong>{it.name || "Sans nom"}</strong> — {it.eventType} · {it.eventDate ? formatDateShort(it.eventDate) : "date ?"} · {it.place || "lieu ?"}
                </span>
                <b className="adm-total">{formatEUR(it.total)}</b>
                <span className="adm-l2">
                  <span className="adm-origin">{SOURCE_LABEL[it.source] || it.source}</span>
                  {" · "}
                  <span className={late ? "adm-late" : ""}>
                    reçue le {receivedAt(it.createdAt)}{it.sentAt ? "" : ` (${wait === 0 ? "aujourd’hui" : `il y a ${wait} j`})`}
                  </span>
                  {it.sentAt ? ` · envoyé le ${formatDateShort(it.sentAt)}` : ""}
                  {" · "}{meta.label} · {it.adults} adulte{it.adults > 1 ? "s" : ""}{it.children ? ` + ${it.children} enf.` : ""}{it.providers ? ` + ${it.providers} prest.` : ""}
                </span>
                {buckets.get(it.id) === "relancer" && !query.trim() ? (
                  <button type="button" className="adm-btn adm-relance" onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRelaunched(it.id); }}>Relancé ✓</button>
                ) : showBadge ? <span className={`adm-badge s-${it.status}`}>{STATUS_LABEL[it.status] || it.status}</span> : <span />}
              </a>
            </li>
          );
        })}
      </ul>
      {creating ? <NewRequest onClose={() => setCreating(false)} /> : null}
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <form className="adm-login" onSubmit={async (e) => {
      e.preventDefault();
      setMsg("");
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
      if (res.ok) onDone(); else setMsg((await res.json()).error || "Erreur");
    }}>
      <h1>Espace devis</h1>
      <p className="adm-muted">Cuillère d’Or — accès réservé</p>
      <input type="password" autoFocus placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="adm-btn adm-gold" type="submit">Entrer</button>
      {msg ? <p className="adm-error">{msg}</p> : null}
    </form>
  );
}

function NewRequest({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", eventType: "Mariage", eventDate: "", place: "", formula: "buffet", adults: 80, children: 0, providers: 0, honorWine: true, message: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string | number | boolean) => setF((s) => ({ ...s, [k]: v }));
  return (
    <div className="adm-modal" onClick={onClose}>
      <form className="adm-card" onClick={(e) => e.stopPropagation()} onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        const res = await fetch("/api/admin/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
        const data = await res.json();
        if (res.ok) window.location.href = `/admin/${data.id}`; else setBusy(false);
      }}>
        <h2>Nouvelle demande</h2>
        <p className="adm-muted">Pour une demande reçue par téléphone, WhatsApp ou e-mail.</p>
        <div className="adm-grid">
          <label>Nom et prénom<input required value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
          <label>Téléphone<input value={f.phone} onChange={(e) => set("phone", e.target.value)} /></label>
          <label>E-mail<input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></label>
          <label>Type<input value={f.eventType} onChange={(e) => set("eventType", e.target.value)} /></label>
          <label>Date<input type="date" value={f.eventDate} onChange={(e) => set("eventDate", e.target.value)} /></label>
          <label>Lieu (adresse)<input value={f.place} onChange={(e) => set("place", e.target.value)} /></label>
          <label>Formule
            <select value={f.formula} onChange={(e) => set("formula", e.target.value)}>
              {FORMULA_KEYS.map((k) => <option key={k} value={k}>{FORMULAS[k].label}</option>)}
            </select>
          </label>
          <label>Adultes<input type="number" min={1} value={f.adults} onChange={(e) => set("adults", Number(e.target.value))} /></label>
        </div>
        <div className="adm-actions">
          <button type="button" className="adm-btn" onClick={onClose}>Annuler</button>
          <button className="adm-btn adm-gold" disabled={busy}>Créer et préparer le devis</button>
        </div>
      </form>
    </div>
  );
}

// Comparaison sans accents ni majuscules (« Bénédicte » = « benedicte »).
function norm(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
