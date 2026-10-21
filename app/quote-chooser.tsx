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

type Lang = "fr" | "en";

// Valeurs envoyées au back-office (français) + libellés affichés en anglais.
const EVENT_TYPES: Array<[string, string]> = [
  ["Mariage", "Wedding"],
  ["Anniversaire", "Birthday"],
  ["Baptême", "Christening"],
  ["Événement d’entreprise", "Corporate event"],
  ["Fête de famille", "Family celebration"],
  ["Autre", "Other"],
];

const FORMULA_LABEL_EN: Record<FormulaId, string> = {
  buffet: "Buffet",
  plateau: "Platter service",
  assiette: "Plated service",
  aperitifs: "Cocktail reception",
  brunch: "Signature Brunch",
  barbecue: "Barbecue Party",
  chef: "Private chef",
};

const T = {
  fr: {
    adult: ["adulte", "adultes"],
    child: ["enfant", "enfants"],
    provider: ["prestataire", "prestataires"],
    noOption: "Aucune option sélectionnée",
    onQuote: "Sur devis",
    locale: "fr-FR",
    serviceModes: {
      service: "Avec service sur place",
      livraison: "Livraison sans service",
      emporter: "À emporter (retrait sur place)",
    },
    sendFailed: "L’envoi n’a pas abouti.",
    sendFailedConn: "L’envoi n’a pas abouti (connexion interrompue).",
    thanks: "Merci, votre demande est bien arrivée.",
    thanksBefore: "Votre devis personnalisé vous sera envoyé par e-mail à l’adresse",
    thanksAfter: ", puis nous vous contacterons.",
    you: "Vous",
    name: "Nom et prénom *",
    email: "E-mail *",
    phone: "Téléphone *",
    yourEvent: "Votre événement",
    eventType: "Type d’événement",
    date: "Date *",
    place: "Adresse complète du lieu de réception",
    placePh: "ex. 12 rue des Lilas, 77240 Vert-Saint-Denis",
    placeHint:
      "Avec l’adresse complète, le déplacement est chiffré au plus juste. Avec la ville seule, il est estimé ; avec le département seul, il sera chiffré ensuite.",
    formula: "Formule envisagée *",
    honorWine: "Avec vin d’honneur",
    adults: "Adultes *",
    children: "Enfants (− 12 ans)",
    providers: "Prestataires (DJ, photographe…)",
    serviceType: "Type de prestation",
    notes: "Précisions (facultatif)",
    notesPh: "Allergies, contraintes du lieu, horaires…",
    trap: "Site web",
    fallback: "Utiliser le formulaire de secours",
    sending: "Envoi en cours…",
    submit: "Enregistrer et recevoir mon devis par e-mail",
    badge: "Devis par e-mail",
    title: "Enregistrer mon estimation",
    resumes: "Il reprend votre estimation",
    askInfo: "Indiquez la date, le lieu, les convives et la formule envisagée.",
    required:
      "Il ne manque que ce qui sert à chiffrer votre devis. Vous le recevez par e-mail, puis nous vous contactons.",
    preparing: "Préparation de votre formulaire…",
    fewSeconds: "Quelques secondes suffisent.",
    iframeTitle: "Demande de devis Cuillère d’Or",
    loading: "Chargement du formulaire…",
    privacy:
      "En envoyant ce formulaire, vous acceptez l’utilisation de vos informations pour préparer votre proposition et votre prestation.",
    privacyLink: "Politique de confidentialité",
    backToSite: "Revenir au formulaire du site",
    useFallback: "Le formulaire ne s’affiche pas bien ? Utiliser le formulaire de secours",
    reassurance:
      "Devis en ligne · Sans engagement · Vos informations servent uniquement à traiter votre demande.",
  },
  en: {
    adult: ["adult", "adults"],
    child: ["child", "children"],
    provider: ["vendor", "vendors"],
    noOption: "No options selected",
    onQuote: "On quote",
    locale: "en-GB",
    serviceModes: {
      service: "With on-site service",
      livraison: "Delivery without service",
      emporter: "Collection (pick-up on site)",
    },
    sendFailed: "Your request could not be sent.",
    sendFailedConn: "Your request could not be sent (connection lost).",
    thanks: "Thank you, your request has been received.",
    thanksBefore: "Your personalised quote will be sent by email to",
    thanksAfter: ", and we will then be in touch.",
    you: "About you",
    name: "Full name *",
    email: "Email *",
    phone: "Telephone *",
    yourEvent: "Your event",
    eventType: "Type of event",
    date: "Date *",
    place: "Full address of the venue",
    placePh: "e.g. 12 rue des Lilas, 77240 Vert-Saint-Denis",
    placeHint:
      "With the full address, travel is costed as precisely as possible. With the town alone, it is estimated; with the département alone, it will be costed afterwards.",
    formula: "Preferred formula *",
    honorWine: "With cocktail reception",
    adults: "Adults *",
    children: "Children (under 12)",
    providers: "Vendors (DJ, photographer…)",
    serviceType: "Type of service",
    notes: "Additional details (optional)",
    notesPh: "Allergies, venue constraints, timings…",
    trap: "Website",
    fallback: "Use the backup form",
    sending: "Sending…",
    submit: "Save and receive my quote by email",
    badge: "Quote by email",
    title: "Save my estimate",
    resumes: "It carries over your estimate for",
    askInfo: "Please tell us the date, the venue, the number of guests and your preferred formula.",
    required:
      "We only ask for what we need to price your quote. You will receive it by email, and we will then get in touch.",
    preparing: "Preparing your form…",
    fewSeconds: "This will only take a few seconds.",
    iframeTitle: "Quote request – Cuillère d’Or",
    loading: "Loading the form…",
    privacy:
      "By submitting this form, you agree to your information being used to prepare your proposal and your event.",
    privacyLink: "Privacy policy",
    backToSite: "Back to the website form",
    useFallback: "Form not displaying properly? Use the backup form",
    reassurance:
      "Online quote · No obligation · Your information is used solely to process your request.",
  },
} as const;

// Dernière estimation du simulateur (gardée même si le formulaire n'est pas encore affiché).
let liveEstimate: Estimate | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("cuillere:estimate", (event) => {
    liveEstimate = (event as CustomEvent<Estimate>).detail;
  });
}

// Affichage visiteur : lang ; préremplissage du formulaire Google (back-office) : toujours en français.
function guestsLine(estimate: Estimate, lang: Lang = "fr") {
  const t = T[lang];
  const plural = (n: number, forms: readonly [string, string]) => forms[n > 1 ? 1 : 0];
  return `${estimate.adults} ${plural(estimate.adults, t.adult)} · ${estimate.children} ${plural(estimate.children, t.child)} · ${estimate.providers} ${plural(estimate.providers, t.provider)}`;
}

function optionsLine(estimate: Estimate) {
  return estimate.options.length
    ? estimate.options.map((option) => option.label).join(" · ")
    : "Aucune option sélectionnée";
}

function totalValue(estimate: Estimate, lang: Lang = "fr") {
  return estimate.total === null
    ? T[lang].onQuote
    : `${estimate.total.toLocaleString(T[lang].locale, { minimumFractionDigits: estimate.total % 1 ? 2 : 0 })} €`;
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
const SERVICE_MODES: ServiceMode[] = ["service", "livraison", "emporter"];

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
  lang,
}: {
  choice: Choice;
  estimate: Estimate | null;
  onFallback: () => void;
  lang: Lang;
}) {
  const t = T[lang];
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
          // Marqueur de langue pour le back-office (champ message libre déjà existant).
          message: lang === "en" ? `Langue : anglais${fields.message ? `\n${fields.message}` : ""}` : fields.message,
          // L'estimation n'est jointe que si elle correspond encore à la formule envoyée.
          estimate: estimate && estimate.formulaId === fields.formula ? estimate : undefined,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus("error");
        setError(data.error || t.sendFailed);
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setError(t.sendFailedConn);
    }
  }

  if (status === "sent") {
    return (
      <div className="native-form-done" role="status">
        <strong>{t.thanks}</strong>
        <p>
          {t.thanksBefore}{" "}
          {fields.email}{t.thanksAfter}
        </p>
      </div>
    );
  }

  const showHonorWine = WITH_HONOR_WINE.includes(fields.formula);

  return (
    <form className="native-form" onSubmit={submit}>
      <fieldset>
        <legend>{t.you}</legend>
        <label>
          {t.name}
          <input required autoComplete="name" value={fields.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          {t.email}
          <input required type="email" autoComplete="email" value={fields.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label>
          {t.phone}
          <input required type="tel" autoComplete="tel" value={fields.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
      </fieldset>

      <fieldset>
        <legend>{t.yourEvent}</legend>
        <label>
          {t.eventType}
          <select value={fields.eventType} onChange={(e) => set("eventType", e.target.value)}>
            {EVENT_TYPES.map(([type, labelEn]) => (
              <option key={type} value={type}>
                {lang === "en" ? labelEn : type}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.date}
          <input required type="date" min={today} value={fields.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
        </label>
        <label className="native-form-wide">
          {t.place}
          <input autoComplete="street-address" placeholder={t.placePh} value={fields.place} onChange={(e) => set("place", e.target.value)} />
          <small className="native-form-hint">
            {t.placeHint}
          </small>
        </label>
        {/* Déjà choisis dans la calculette : rappelés dans le bandeau doré au-dessus du formulaire */}
        {!estimate && (
          <>
        <label className="native-form-wide">
          {t.formula}
          <select required value={fields.formula} onChange={(e) => set("formula", e.target.value as FormulaId)}>
            {(Object.keys(FORMULA_FORM_VALUE) as FormulaId[]).map((id) => (
              <option key={id} value={id}>
                {lang === "en" ? FORMULA_LABEL_EN[id] : FORMULA_FORM_VALUE[id]}
              </option>
            ))}
          </select>
        </label>
        {showHonorWine && (
          <label className="native-form-check native-form-wide">
            <input type="checkbox" checked={fields.honorWine} onChange={(e) => set("honorWine", e.target.checked)} />
            {t.honorWine}
          </label>
        )}
        <label>
          {t.adults}
          <input required type="number" min={1} max={5000} inputMode="numeric" value={fields.adults} onChange={(e) => set("adults", e.target.value)} />
        </label>
        <label>
          {t.children}
          <input type="number" min={0} max={5000} inputMode="numeric" value={fields.children} onChange={(e) => set("children", e.target.value)} />
        </label>
        <label>
          {t.providers}
          <input type="number" min={0} max={5000} inputMode="numeric" value={fields.providers} onChange={(e) => set("providers", e.target.value)} />
        </label>
          </>
        )}
        <div className="native-form-wide native-form-radios" role="radiogroup" aria-label={t.serviceType}>
          {SERVICE_MODES.map((value) => (
            <label key={value} className="native-form-check">
              <input type="radio" name="serviceMode" value={value} checked={fields.serviceMode === value} onChange={() => set("serviceMode", value)} />
              {t.serviceModes[value]}
            </label>
          ))}
        </div>
        <label className="native-form-wide">
          {t.notes}
          <textarea
            rows={3}
            placeholder={t.notesPh}
            value={fields.message}
            onChange={(e) => set("message", e.target.value)}
          />
        </label>
      </fieldset>

      {/* Champ piège : invisible pour les personnes, rempli par les robots. */}
      <label className="native-form-trap" aria-hidden="true">
        {t.trap}
        <input tabIndex={-1} autoComplete="off" value={fields.website} onChange={(e) => set("website", e.target.value)} />
      </label>

      {status === "error" && (
        <div className="native-form-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={onFallback}>
            {t.fallback}
          </button>
        </div>
      )}

      <button className="native-form-submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? t.sending : t.submit}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

export default function QuoteChooser({ formUrl, lang = "fr" }: { formUrl: string; lang?: Lang }) {
  const t = T[lang];
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
      {open && (
      <div
        className="selected-form"
        id={isEvent ? "formulaire-evenement" : "formulaire-brunch"}
      >
        <div className="selected-form-heading">
          <span>{t.badge}</span>
          <div>
            <h3>{t.title}</h3>
            <p>
              {estimate
                ? `${t.resumes} ${lang === "en" ? FORMULA_LABEL_EN[estimate.formulaId] : estimate.formula} (${guestsLine(estimate, lang)}).`
                : t.askInfo}
            </p>
            <p className="quote-required">
              {t.required}
            </p>
          </div>
        </div>
        {useGoogleForm ? (
          <div className="form-frame">
            {!formLoaded && (
              <div className="form-loading" role="status">
                <span aria-hidden="true" />
                <strong>{t.preparing}</strong>
                <small>{t.fewSeconds}</small>
              </div>
            )}
            <iframe
              key={iframeSrc}
              className={formLoaded ? "is-loaded" : ""}
              src={iframeSrc}
              title={t.iframeTitle}
              onLoad={() => setFormLoaded(true)}
            >
              {t.loading}
            </iframe>
          </div>
        ) : (
          <NativeForm
            choice={choice}
            estimate={estimate}
            onFallback={() => setUseGoogleForm(true)}
            lang={lang}
          />
        )}
        <p className="quote-privacy-note">
          {t.privacy}{" "}
          <a href="/politique-confidentialite" target="_blank" rel="noreferrer">
            {t.privacyLink}
          </a>
          .{" "}
          <button
            type="button"
            className="quote-form-switch"
            onClick={() => setUseGoogleForm((current) => !current)}
          >
            {useGoogleForm ? t.backToSite : t.useFallback}
          </button>
        </p>
      </div>
      )}
      {open && (
        <p className="quote-reassurance">
          {t.reassurance}
        </p>
      )}
    </div>
  );
}
