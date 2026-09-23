"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";

type Choice = "event" | "brunch";
type FormulaId = "buffet" | "plateau" | "assiette" | "aperitifs" | "brunch";
type EstimateOption = { id: string; label: string; amount: number };
type Estimate = {
  formulaId: FormulaId;
  formula: string;
  adults: number;
  children: number;
  providers: number;
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
  buffet: "Buffet",
  plateau: "Plateau",
  assiette: "Service à l'assiette",
  aperitifs: "Apéritifs & vin d'honneur",
  brunch: "Brunch Signature",
};

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

export default function QuoteChooser({
  formUrl,
  whatsapp,
}: {
  formUrl: string;
  whatsapp: string;
}) {
  const initialChoice = (): Choice =>
    typeof window !== "undefined" &&
    window.location.hash === "#formulaire-brunch"
      ? "brunch"
      : "event";
  const [choice, setChoice] = useState<Choice>(initialChoice);
  const [formLoaded, setFormLoaded] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
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
      setEstimate(null);
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
    };
    selectFromLocation();
    window.addEventListener("hashchange", selectFromLocation);
    window.addEventListener("popstate", selectFromLocation);
    window.addEventListener("cuillere:quote", selectFromCalculator);
    return () => {
      window.removeEventListener("hashchange", selectFromLocation);
      window.removeEventListener("popstate", selectFromLocation);
      window.removeEventListener("cuillere:quote", selectFromCalculator);
    };
  }, []);

  return (
    <div className="quote-chooser">
      {estimate && (
        <div className="quote-estimate-summary">
          <span>Votre réception</span>
          <div>
            <strong>{estimate.formula}</strong>
            <p>{guestsLine(estimate)}</p>
            {estimate.options.length > 0 && <p>{optionsLine(estimate)}</p>}
          </div>
          <div>
            <strong>{totalValue(estimate)}</strong>
            <p>Déplacement calculé avec vous · estimation non contractuelle</p>
          </div>
          <a href="#tarifs">Modifier mon estimation</a>
        </div>
      )}

      <div className="quote-help">
        <div>
          <MessageCircle size={22} />
          <p>
            <strong>Vous hésitez sur la formule ?</strong>
            <span>
              Posez-nous votre question avant de compléter la demande.
            </span>
          </p>
        </div>
        <a href={whatsapp} target="_blank" rel="noreferrer">
          Demander conseil sur WhatsApp <ArrowRight size={16} />
        </a>
      </div>

      <div
        className="selected-form"
        id={isEvent ? "formulaire-evenement" : "formulaire-brunch"}
      >
        <div className="selected-form-heading">
          <span>Formulaire</span>
          <div>
            <h3>Votre demande de devis</h3>
            <p>
              {estimate
                ? `Votre estimation ${estimate.formula} est conservée pendant votre demande.`
                : "Indiquez la date, le lieu, les convives et la formule envisagée."}
            </p>
          </div>
        </div>
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
        <p className="quote-privacy-note">
          En envoyant ce formulaire, vous acceptez l’utilisation de vos
          informations pour préparer votre proposition et votre prestation.{" "}
          <a href="/politique-confidentialite" target="_blank" rel="noreferrer">
            Politique de confidentialité
          </a>
          .
        </p>
      </div>
      <p className="quote-reassurance">
        Réponse sous 48 à 72 h · Sans engagement · Vos informations servent
        uniquement à traiter votre demande.
      </p>
    </div>
  );
}
