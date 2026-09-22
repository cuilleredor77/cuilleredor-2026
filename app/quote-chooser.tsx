"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";

type Choice = "event" | "brunch";
type Estimate = {
  formula: string;
  guests: number;
  service: string;
  options?: string;
  total: number | null;
  travelIncluded: boolean;
};

export default function QuoteChooser({
  eventForm,
  brunchForm,
  whatsapp,
}: {
  eventForm: string;
  brunchForm: string;
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
      {estimate ? (
        <div className="quote-estimate-summary">
          <span>Votre réception</span>
          <div>
            <strong>{estimate.formula}</strong>
            <p>
              {estimate.guests} convives · {estimate.service}
            </p>
            {estimate.options && <p>{estimate.options}</p>}
          </div>
          <div>
            <strong>
              {estimate.total === null
                ? "Sur devis"
                : `${estimate.total.toLocaleString("fr-FR", { minimumFractionDigits: estimate.total % 1 ? 2 : 0 })} €`}
            </strong>
            <p>
              {estimate.travelIncluded
                ? "Déplacement inclus"
                : "Hors déplacement"}{" "}
              · estimation non contractuelle
            </p>
          </div>
          <a href="#tarifs">Modifier mon estimation</a>
        </div>
      ) : (
        <fieldset className="quote-simple-choice">
          <legend>Vous arrivez directement ici ?</legend>
          <label className={isEvent ? "active" : ""}>
            <input
              type="radio"
              name="quote-choice"
              checked={isEvent}
              onChange={() => choose("event")}
            />
            <span>
              <strong>Un événement</strong>
              <small>Mariage, anniversaire, entreprise ou vin d’honneur</small>
            </span>
          </label>
          <label className={!isEvent ? "active" : ""}>
            <input
              type="radio"
              name="quote-choice"
              checked={!isEvent}
              onChange={() => choose("brunch")}
            />
            <span>
              <strong>Un brunch</strong>
              <small>Brunch Signature et lendemain de mariage</small>
            </span>
          </label>
        </fieldset>
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
          <span>{isEvent ? "Formulaire événement" : "Formulaire brunch"}</span>
          <div>
            <h3>
              {isEvent
                ? "Votre demande de devis"
                : "Votre demande Brunch Signature"}
            </h3>
            <p>
              {estimate
                ? `Votre estimation ${estimate.formula} est conservée pendant votre demande.`
                : isEvent
                  ? "Indiquez la date, le lieu, les convives et la formule envisagée."
                  : "Indiquez la date, le lieu et le nombre de convives."}
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
            key={choice}
            className={formLoaded ? "is-loaded" : ""}
            src={isEvent ? eventForm : brunchForm}
            title={
              isEvent
                ? "Demande de devis Cuillère d’Or pour une réception ou un événement"
                : "Demande de devis Brunch Signature Cuillère d’Or"
            }
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
        Réponse sous 48 h · Sans engagement · Vos informations servent
        uniquement à traiter votre demande.
      </p>
    </div>
  );
}
