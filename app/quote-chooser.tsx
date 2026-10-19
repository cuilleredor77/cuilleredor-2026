"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

type Choice = "event" | "brunch";
type FormulaId =
  | "buffet"
  | "plateau"
  | "assiette"
  | "aperitifs"
  | "brunch"
  | "barbecue"
  | "chef";
type EstimateOption = { id: string; label: string; amount: number };
type Estimate = {
  formulaId: FormulaId;
  formula: string;
  adults: number;
  children: number;
  providers: number;
  serviceId?: string;
  service: string;
  options: EstimateOption[];
  total: number | null;
};

const ENTRY = {
  formula: "541721221",
  eventGuests: "742135497",
  eventService: "689835794",
  eventOptions: "1272896191",
  eventTotal: "518078330",
  brunchGuests: "132311688",
  brunchOptions: "491582627",
  brunchTotal: "2050071486",
};

const FORMULA_FORM_VALUE: Record<FormulaId, string> = {
  buffet: "Service Buffet",
  plateau: "Service Plateau",
  assiette: "Service à l'assiette",
  aperitifs: "Apéritifs & vin d'honneur",
  brunch: "Brunch Signature",
  barbecue: "Barbecue Party",
  chef: "Chef à domicile",
};

// Formules pour lesquelles le vin d'honneur est une option (cf. lib/quote.ts).
const WITH_HONOR_WINE: FormulaId[] = ["buffet", "plateau", "assiette"];

const EVENT_TYPES = [
  "Mariage",
  "Anniversaire",
  "Baptême",
  "Événement d’entreprise",
  "Fête de famille",
  "Autre",
];

// Dernière estimation du simulateur (gardée même si le formulaire n'est pas encore affiché).
let liveEstimate: Estimate | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("cuillere:estimate", (event) => {
    liveEstimate = (event as CustomEvent<Estimate>).detail;
  });
}

function guestsLine(estimate: Estimate) {
  return `${estimate.adults} adulte${estimate.adults > 1 ? "s" : ""} · ${estimate.children} enfant${estimate.children > 1 ? "s" : ""} · ${estimate.providers} prestataire${estimate.providers > 1 ? "s" : ""}`;
}

function optionsLine(estimate: Estimate) {
  return estimate.options.length
    ? estimate.options.map((option) => option.label).join(" · ")
    : "Aucune option sélectionnée";
}

function totalValue(estimate: Estimate) {
  return estimate.total === null
    ? "Sur devis"
    : `${estimate.total.toLocaleString("fr-FR", { minimumFractionDigits: estimate.total % 1 ? 2 : 0 })} €`;
}

function buildFormUrl(baseUrl: string, choice: Choice, estimate: Estimate | null) {
  const params = new URLSearchParams();
  params.set("embedded", "true");
  if (estimate) {
    params.set("usp", "pp_url");
    params.set(`entry.${ENTRY.formula}`, FORMULA_FORM_VALUE[estimate.formulaId]);
    if (estimate.formulaId === "brunch") {
      params.set(`entry.${ENTRY.brunchGuests}`, guestsLine(estimate));
      params.set(`entry.${ENTRY.brunchOptions}`, optionsLine(estimate));
      // Le champ "Enveloppe budgétaire" (ex "Estimation totale") est rempli
      // par le client lui-même, pas pré-rempli avec le calcul du site.
    } else {
      params.set(`entry.${ENTRY.eventGuests}`, guestsLine(estimate));
      params.set(`entry.${ENTRY.eventService}`, estimate.service);
      params.set(`entry.${ENTRY.eventOptions}`, optionsLine(estimate));
    }
  } else if (choice === "brunch") {
    params.set("usp", "pp_url");
    params.set(`entry.${ENTRY.formula}`, "Brunch Signature");
  }
  return `${baseUrl}?${params.toString()}`;
}

type ServiceMode = "service" | "livraison" | "emporter";
const SERVICE_MODES: Array<[ServiceMode, string]> = [
  ["service", "Avec service sur place"],
  ["livraison", "Livraison sans service"],
  ["emporter", "À emporter (retrait sur place)"],
];

type Fields = {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  place: string;
  formula: FormulaId;
  adults: string;
  children: string;
  providers: string;
  honorWine: boolean;
  serviceMode: ServiceMode;
  budget: string;
  weddingPlanner: string;
  selection: string;
  message: string;
  website: string;
};

function fieldsFrom(choice: Choice, estimate: Estimate | null, previous?: Fields): Fields {
  const base: Fields = previous || {
    name: "",
    email: "",
    phone: "",
    eventType: "Mariage",
    eventDate: "",
    place: "",
    formula: "buffet",
    adults: "",
    children: "0",
    providers: "0",
    honorWine: true,
    serviceMode: "service",
    budget: "",
    weddingPlanner: "",
    selection: "",
    message: "",
    website: "",
  };
  if (estimate) {
    return {
      ...base,
      formula: estimate.formulaId,
      adults: String(estimate.adults || ""),
      children: String(estimate.children || 0),
      providers: String(estimate.providers || 0),
      honorWine: estimate.serviceId ? estimate.serviceId === "avec-vin" : true,
    };
  }
  if (choice === "brunch") return { ...base, formula: "brunch" };
  return base;
}

function NativeForm({
  choice,
  estimate,
  onFallback,
}: {
  choice: Choice;
  estimate: Estimate | null;
  onFallback: () => void;
}) {
  const [fields, setFields] = useState<Fields>(() => fieldsFrom(choice, estimate));
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    // Le simulateur peut envoyer une nouvelle estimation à tout moment : on la reporte sans effacer ce qui est déjà saisi.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFields((current) => fieldsFrom(choice, estimate, current));
  }, [choice, estimate]);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/demande", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...fields,
          adults: Number(fields.adults),
          children: Number(fields.children),
          providers: Number(fields.providers),
          honorWine: WITH_HONOR_WINE.includes(fields.formula) ? fields.honorWine : false,
          // L'estimation n'est jointe que si elle correspond encore à la formule envoyée.
          estimate: estimate && estimate.formulaId === fields.formula ? estimate : undefined,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus("error");
        setError(data.error || "L’envoi n’a pas abouti.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("L’envoi n’a pas abouti (connexion interrompue).");
    }
  }

  if (status === "sent") {
    return (
      <div className="native-form-done" role="status">
        <strong>Merci, votre demande est bien arrivée.</strong>
        <p>
          Votre devis personnalisé vous sera envoyé par e-mail à l’adresse{" "}
          {fields.email}, puis nous vous contacterons.
        </p>
      </div>
    );
  }

  const showHonorWine = WITH_HONOR_WINE.includes(fields.formula);

  return (
    <form className="native-form" onSubmit={submit}>
      <fieldset>
        <legend>Vous</legend>
        <label>
          Nom et prénom *
          <input required autoComplete="name" value={fields.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          E-mail *
          <input required type="email" autoComplete="email" value={fields.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label>
          Téléphone *
          <input required type="tel" autoComplete="tel" value={fields.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Votre événement</legend>
        <label>
          Type d’événement
          <select value={fields.eventType} onChange={(e) => set("eventType", e.target.value)}>
            {EVENT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Date *
          <input required type="date" min={today} value={fields.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
        </label>
        <label className="native-form-wide">
          Adresse complète du lieu de réception
          <input autoComplete="street-address" placeholder="ex. 12 rue des Lilas, 77240 Vert-Saint-Denis" value={fields.place} onChange={(e) => set("place", e.target.value)} />
          <small className="native-form-hint">
            Avec l’adresse complète, le déplacement est chiffré au plus juste. Avec la ville seule, il est
            estimé ; avec le département seul, il sera chiffré ensuite.
          </small>
        </label>
        {/* Déjà choisis dans la calculette : rappelés dans le bandeau doré au-dessus du formulaire */}
        {!estimate && (
          <>
        <label className="native-form-wide">
          Formule envisagée *
          <select required value={fields.formula} onChange={(e) => set("formula", e.target.value as FormulaId)}>
            {(Object.keys(FORMULA_FORM_VALUE) as FormulaId[]).map((id) => (
              <option key={id} value={id}>
                {FORMULA_FORM_VALUE[id]}
              </option>
            ))}
          </select>
        </label>
        {showHonorWine && (
          <label className="native-form-check native-form-wide">
            <input type="checkbox" checked={fields.honorWine} onChange={(e) => set("honorWine", e.target.checked)} />
            Avec vin d’honneur
          </label>
        )}
        <label>
          Adultes *
          <input required type="number" min={1} max={5000} inputMode="numeric" value={fields.adults} onChange={(e) => set("adults", e.target.value)} />
        </label>
        <label>
          Enfants (− 12 ans)
          <input type="number" min={0} max={5000} inputMode="numeric" value={fields.children} onChange={(e) => set("children", e.target.value)} />
        </label>
        <label>
          Prestataires (DJ, photographe…)
          <input type="number" min={0} max={5000} inputMode="numeric" value={fields.providers} onChange={(e) => set("providers", e.target.value)} />
        </label>
          </>
        )}
        <div className="native-form-wide native-form-radios" role="radiogroup" aria-label="Type de prestation">
          {SERVICE_MODES.map(([value, label]) => (
            <label key={value} className="native-form-check">
              <input type="radio" name="serviceMode" value={value} checked={fields.serviceMode === value} onChange={() => set("serviceMode", value)} />
              {label}
            </label>
          ))}
        </div>
        <label>
          Enveloppe budgétaire
          <input placeholder="ex. 6 000 €" value={fields.budget} onChange={(e) => set("budget", e.target.value)} />
        </label>
        <label>
          Wedding planner
          <select value={fields.weddingPlanner} onChange={(e) => set("weddingPlanner", e.target.value)}>
            <option value="">—</option>
            <option value="oui">Oui, déjà trouvé</option>
            <option value="recherche">En recherche</option>
            <option value="non">Non, pas prévu</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Vos envies</legend>
        <label className="native-form-wide">
          Plats choisis dans le catalogue
          <textarea
            rows={4}
            placeholder="Collez ici la liste reçue avec « Envoyer ma sélection », ou indiquez vos plats préférés."
            value={fields.selection}
            onChange={(e) => set("selection", e.target.value)}
          />
        </label>
        <label className="native-form-wide">
          Message
          <textarea rows={4} value={fields.message} onChange={(e) => set("message", e.target.value)} />
        </label>
      </fieldset>

      {/* Champ piège : invisible pour les personnes, rempli par les robots. */}
      <label className="native-form-trap" aria-hidden="true">
        Site web
        <input tabIndex={-1} autoComplete="off" value={fields.website} onChange={(e) => set("website", e.target.value)} />
      </label>

      {status === "error" && (
        <div className="native-form-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={onFallback}>
            Utiliser le formulaire de secours
          </button>
        </div>
      )}

      <button className="native-form-submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Envoi en cours…" : "Recevoir mon devis par e-mail"}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

export default function QuoteChooser({ formUrl }: { formUrl: string }) {
  const initialChoice = (): Choice =>
    typeof window !== "undefined" &&
    window.location.hash === "#formulaire-brunch"
      ? "brunch"
      : "event";
  const [choice, setChoice] = useState<Choice>(initialChoice);
  const [useGoogleForm, setUseGoogleForm] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  // Le devis par e-mail est une option qui se déplie sous l'estimation
  const [open, setOpen] = useState(false);
  const isEvent = choice === "event";
  const iframeSrc = useMemo(
    () => buildFormUrl(formUrl, choice, estimate),
    [formUrl, choice, estimate],
  );

  function choose(next: Choice) {
    setChoice((current) => {
      if (next !== current) {
        setFormLoaded(false);
      }
      return next;
    });
  }

  useEffect(() => {
    const selectFromLocation = () => {
      setEstimate(liveEstimate);
      if (/^#(devis|formulaire-)/.test(window.location.hash)) setOpen(true);
      if (window.location.hash === "#formulaire-brunch") choose("brunch");
      if (window.location.hash === "#formulaire-evenement") choose("event");
    };
    const selectFromCalculator = (event: Event) => {
      const detail = (
        event as CustomEvent<{ choice: Choice; estimate?: Estimate }>
      ).detail;
      setFormLoaded(false);
      choose(detail.choice);
      setEstimate(detail.estimate || null);
      setOpen(true);
    };
    const followCalculator = (event: Event) => {
      const detail = (event as CustomEvent<Estimate>).detail;
      choose(detail.formulaId === "brunch" ? "brunch" : "event");
      setEstimate(detail);
    };
    selectFromLocation();
    window.addEventListener("cuillere:estimate", followCalculator);
    window.addEventListener("hashchange", selectFromLocation);
    window.addEventListener("popstate", selectFromLocation);
    window.addEventListener("cuillere:quote", selectFromCalculator);
    return () => {
      window.removeEventListener("cuillere:estimate", followCalculator);
      window.removeEventListener("hashchange", selectFromLocation);
      window.removeEventListener("popstate", selectFromLocation);
      window.removeEventListener("cuillere:quote", selectFromCalculator);
    };
  }, []);

  return (
    <div className="quote-chooser">
      {!open && (
        <div className="quote-option">
          <div>
            <strong>Recevoir mon devis personnalisé par e-mail</strong>
            <p>
              Il reprend votre estimation ci-dessus, avec le contrat prêt à
              signer. Facultatif et sans engagement.
            </p>
          </div>
          <button type="button" onClick={() => setOpen(true)}>
            Recevoir mon devis par e-mail <ArrowRight size={16} />
          </button>
        </div>
      )}

      {open && (
      <div
        className="selected-form"
        id={isEvent ? "formulaire-evenement" : "formulaire-brunch"}
      >
        <div className="selected-form-heading">
          <span>Devis par e-mail</span>
          <div>
            <h3>Recevoir mon devis personnalisé</h3>
            <p>
              {estimate
                ? `Il reprend votre estimation ${estimate.formula} (${guestsLine(estimate)}).`
                : "Indiquez la date, le lieu, les convives et la formule envisagée."}
            </p>
            <p className="quote-required">
              Vous recevez votre devis par e-mail, puis nous vous contactons :
              c’est cette demande qui démarre les échanges.
            </p>
          </div>
        </div>
        {useGoogleForm ? (
          <div className="form-frame">
            {!formLoaded && (
              <div className="form-loading" role="status">
                <span aria-hidden="true" />
                <strong>Préparation de votre formulaire…</strong>
                <small>Quelques secondes suffisent.</small>
              </div>
            )}
            <iframe
              key={iframeSrc}
              className={formLoaded ? "is-loaded" : ""}
              src={iframeSrc}
              title="Demande de devis Cuillère d’Or"
              onLoad={() => setFormLoaded(true)}
            >
              Chargement du formulaire…
            </iframe>
          </div>
        ) : (
          <NativeForm
            choice={choice}
            estimate={estimate}
            onFallback={() => setUseGoogleForm(true)}
          />
        )}
        <p className="quote-privacy-note">
          En envoyant ce formulaire, vous acceptez l’utilisation de vos
          informations pour préparer votre proposition et votre prestation.{" "}
          <a href="/politique-confidentialite" target="_blank" rel="noreferrer">
            Politique de confidentialité
          </a>
          .{" "}
          <button
            type="button"
            className="quote-form-switch"
            onClick={() => setUseGoogleForm((current) => !current)}
          >
            {useGoogleForm
              ? "Revenir au formulaire du site"
              : "Le formulaire ne s’affiche pas bien ? Utiliser le formulaire de secours"}
          </button>
        </p>
      </div>
      )}
      <p className="quote-reassurance">
        Devis en ligne · Sans engagement · Vos informations servent
        uniquement à traiter votre demande.
      </p>
    </div>
  );
}
