"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FORMULAS, FORMULA_KEYS, formatDateShort, formatEUR, type FormulaKey } from "../../lib/quote";

type Item = {
  id: number; createdAt: string; status: string; name: string; email: string; phone: string;
  eventType: string; eventDate: string; place: string; formula: string; adults: number;
  children: number; providers: number; total: number; sentAt: string | null; hasQuote: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  nouvelle: "Nouvelle", en_cours: "En cours", devis_pret: "Devis prêt", envoye: "Envoyé",
  signe: "Signé", acompte: "Acompte reçu", archivee: "Archivée",
};
const TODO = ["nouvelle", "en_cours", "devis_pret"];

const daysAgo = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

export default function AdminHome() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [auth, setAuth] = useState<"loading" | "login" | "ok">("loading");
  const [filter, setFilter] = useState<string>("todo");
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

  const counts = useMemo(() => {
    const c: Record<string, number> = { todo: 0, all: items?.length ?? 0 };
    for (const it of items || []) {
      c[it.status] = (c[it.status] || 0) + 1;
      if (TODO.includes(it.status)) c.todo += 1;
    }
    return c;
  }, [items]);

  const shown = useMemo(() => {
    const q = norm(query.trim());
    // Une recherche porte sur toutes les demandes, quel que soit l’onglet choisi.
    const list = (items || []).filter((it) =>
      q
        ? norm([it.name, it.email, it.phone, it.place, it.eventType].join(" ")).includes(q) || norm(it.phone || "").replace(/\s/g, "").includes(q.replace(/\s/g, ""))
        : filter === "all" ? true : filter === "todo" ? TODO.includes(it.status) : it.status === filter,
    );
    // les demandes les plus anciennes d'abord : ce sont celles qui attendent depuis le plus longtemps
    return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [items, filter, query]);

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
        {[["todo", "À traiter"], ["envoye", "Envoyés"], ["signe", "Signés"], ["acompte", "Acompte reçu"], ["archivee", "Archivées"], ["all", "Toutes"]].map(([key, label]) => (
          <button key={key} className={`adm-chip ${filter === key ? "on" : ""}`} onClick={() => setFilter(key)}>
            {label} <b>{counts[key] || 0}</b>
          </button>
        ))}
      </nav>
      {shown.length === 0 ? <p className="adm-muted">{query.trim() ? "Aucun client ne correspond à cette recherche." : "Aucune demande dans cette liste."}</p> : null}
      <ul className="adm-list">
        {shown.map((it) => {
          const wait = daysAgo(it.createdAt);
          const late = TODO.includes(it.status) && wait >= 3;
          const meta = FORMULAS[(FORMULA_KEYS as string[]).includes(it.formula) ? (it.formula as FormulaKey) : "buffet"];
          return (
            <li key={it.id}>
              <a href={`/admin/${it.id}`} className="adm-row">
                <div className="adm-main">
                  <strong>{it.name || "Sans nom"}</strong>
                  <span>{it.eventType} · {it.eventDate ? formatDateShort(it.eventDate) : "date ?"} · {it.place || "lieu ?"}</span>
                  <span>{meta.label} · {it.adults} adulte{it.adults > 1 ? "s" : ""}{it.children ? ` + ${it.children} enf.` : ""}{it.providers ? ` + ${it.providers} prest.` : ""}</span>
                </div>
                <div className="adm-side">
                  <span className={`adm-badge s-${it.status}`}>{STATUS_LABEL[it.status] || it.status}</span>
                  <b>{formatEUR(it.total)}</b>
                  <small className={late ? "adm-late" : ""}>
                    {it.sentAt ? `envoyé le ${formatDateShort(it.sentAt)}` : wait === 0 ? "reçue aujourd’hui" : `reçue il y a ${wait} j`}
                  </small>
                </div>
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
