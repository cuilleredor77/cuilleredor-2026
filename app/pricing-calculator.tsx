"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

type Formula = "buffet" | "plateau" | "assiette" | "aperitifs" | "brunch";
type Service = "avec-vin" | "sans-vin" | "sans-service";
const services: Record<Formula, Array<{ value: Service; label: string }>> = {
  buffet: [
    { value: "avec-vin", label: "Avec vin d’honneur" },
    { value: "sans-vin", label: "Sans vin d’honneur" },
    { value: "sans-service", label: "Sans service" },
  ],
  plateau: [
    { value: "avec-vin", label: "Avec vin d’honneur" },
    { value: "sans-vin", label: "Sans vin d’honneur" },
  ],
  assiette: [
    { value: "avec-vin", label: "Avec vin d’honneur" },
    { value: "sans-vin", label: "Sans vin d’honneur" },
  ],
  aperitifs: [{ value: "avec-vin", label: "Vin d’honneur inclus" }],
  brunch: [{ value: "sans-vin", label: "Brunch Signature" }],
};
const formulaNames: Record<Formula, string> = {
  buffet: "Buffet",
  plateau: "Plateau",
  assiette: "Service à l’assiette",
  aperitifs: "Apéritifs & vin d’honneur",
  brunch: "Brunch Signature",
};

function unitPrice(formula: Formula, guests: number, service: Service) {
  if (formula === "aperitifs") return 25;
  if (formula === "brunch") return 30;
  if (formula === "assiette") {
    if (guests > 350) return null;
    return guests < 200
      ? service === "avec-vin"
        ? 70
        : 65
      : service === "avec-vin"
        ? 65
        : 60;
  }
  const range = guests < 200 ? 0 : guests < 350 ? 1 : 2;
  if (formula === "plateau")
    return service === "avec-vin" ? [50, 45, 40][range] : [45, 40, 35][range];
  return {
    "avec-vin": [45, 40, 35],
    "sans-vin": [40, 35, 30],
    "sans-service": [35, 30, 25],
  }[service][range];
}

export default function PricingCalculator() {
  const [formula, setFormula] = useState<Formula>("buffet");
  const [guests, setGuests] = useState(100);
  const [service, setService] = useState<Service>("avec-vin");
  const [children, setChildren] = useState(0);
  const [providers, setProviders] = useState(0);
  const [guestError, setGuestError] = useState("");
  useEffect(() => {
    const syncFormula = (event: Event) => {
      const next = (event as CustomEvent<Formula>).detail;
      setFormula(next);
      setService(services[next][0].value);
    };
    window.addEventListener("cuillere:formula", syncFormula);
    return () => window.removeEventListener("cuillere:formula", syncFormula);
  }, []);

  const totalGuests = guests + children + providers;
  const price = useMemo(
    () => unitPrice(formula, totalGuests, service),
    [formula, totalGuests, service],
  );
  const mealTotal = price === null ? null : price * guests;
  const estimatedTotal =
    mealTotal === null ? null : mealTotal + children * 20 + providers * 20 + 50;
  const selectedService =
    services[formula].find((item) => item.value === service)?.label || "";
  const optionLines: Array<{ label: string; amount: number }> = [
    { label: "Gestion des déchets", amount: 50 },
  ];
  if (children)
    optionLines.push({
      label: `${children} repas enfant${children > 1 ? "s" : ""}`,
      amount: children * 20,
    });
  if (providers)
    optionLines.push({
      label: `${providers} repas prestataire${providers > 1 ? "s" : ""}`,
      amount: providers * 20,
    });

  function changeFormula(next: Formula) {
    setFormula(next);
    setService(services[next][0].value);
    window.dispatchEvent(
      new CustomEvent<Formula>("cuillere:formula", { detail: next }),
    );
  }
  function changeGuests(rawValue: string) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 10) {
      setGuests(10);
      setGuestError("Le minimum est de 10 adultes.");
    } else if (value > 1000) {
      setGuests(1000);
      setGuestError(
        "Le maximum du simulateur est de 1 000 adultes. Au-delà, contactez-nous.",
      );
    } else {
      setGuests(Math.floor(value));
      setGuestError("");
    }
  }
  function requestQuote(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const choice = formula === "brunch" ? "brunch" : "event";
    const hash =
      choice === "brunch" ? "#formulaire-brunch" : "#formulaire-evenement";
    window.dispatchEvent(
      new CustomEvent("cuillere:quote", {
        detail: {
          choice,
          estimate: {
            formula: formulaNames[formula],
            guests: totalGuests,
            service: selectedService,
            options: optionLines.map((line) => line.label).join(" · "),
            total: estimatedTotal,
            travelIncluded: false,
          },
        },
      }),
    );
    window.history.pushState(null, "", hash);
    document
      .getElementById("devis")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="pricing-calculator" id="calculateur" aria-labelledby="calculator-title">
      <div className="calculator-heading">
        <div>
          <span>Estimation personnalisée</span>
          <h3 id="calculator-title">Calculez votre réception</h3>
        </div>
        <p>
          Choisissez la formule et indiquez vos convives pour obtenir
          immédiatement un ordre de budget.
        </p>
      </div>
      <div className="calculator-controls">
        <label>
          <span>Votre formule</span>
          <select
            value={formula}
            onChange={(e) => changeFormula(e.target.value as Formula)}
          >
            <option value="buffet">Buffet</option>
            <option value="plateau">Plateau</option>
            <option value="assiette">Service à l’assiette</option>
            <option value="aperitifs">Apéritifs & vin d’honneur</option>
            <option value="brunch">Brunch Signature</option>
          </select>
        </label>
        <label>
          <span>Adultes</span>
          <input
            type="number"
            min="10"
            max="1000"
            inputMode="numeric"
            value={guests}
            onChange={(e) => changeGuests(e.target.value)}
            aria-invalid={Boolean(guestError)}
            aria-describedby="adultes-aide"
          />
          <small
            id="adultes-aide"
            className={
              guestError ? "calculator-field-error" : "calculator-field-help"
            }
          >
            {guestError || "Entre 10 et 1 000 adultes."}
          </small>
        </label>
        <label>
          <span>Enfants</span>
          <input
            type="number"
            min="0"
            max="1000"
            inputMode="numeric"
            value={children}
            onChange={(e) =>
              setChildren(
                Math.min(1000, Math.max(0, Number(e.target.value) || 0)),
              )
            }
          />
          <small className="calculator-field-help">
            Repas adapté aux 5-12 ans.
          </small>
        </label>
        <label>
          <span>Prestataires</span>
          <input
            type="number"
            min="0"
            max="1000"
            inputMode="numeric"
            value={providers}
            onChange={(e) =>
              setProviders(
                Math.min(1000, Math.max(0, Number(e.target.value) || 0)),
              )
            }
          />
          <small className="calculator-field-help">
            Photographe, DJ, vidéaste…
          </small>
        </label>
        <label>
          <span>Niveau de service</span>
          <select
            value={service}
            disabled={formula === "brunch"}
            onChange={(e) => setService(e.target.value as Service)}
          >
            {services[formula].map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="calculator-guest-total">
          <span>Total des convives</span>
          <strong>{totalGuests}</strong>
          <small>
            {guests} adulte{guests > 1 ? "s" : ""} · {children} enfant
            {children > 1 ? "s" : ""} · {providers} prestataire
            {providers > 1 ? "s" : ""}
          </small>
        </div>
      </div>
      <div className="calculator-initial-result" aria-live="polite">
        <div>
          <span>Votre réception</span>
          <strong>{formulaNames[formula]}</strong>
          <small>
            {totalGuests} convives · {selectedService}
          </small>
        </div>
        <div>
          <span>Votre estimation</span>
          <strong>
            {estimatedTotal === null
              ? "Sur devis"
              : `${estimatedTotal.toLocaleString("fr-FR", { minimumFractionDigits: estimatedTotal % 1 ? 2 : 0 })} €`}
          </strong>
          <small>Repas spécifiques et déchets inclus · hors déplacement</small>
        </div>
        <div className="calculator-initial-actions">
          <a
            className="calculator-quote-cta"
            href={
              formula === "brunch"
                ? "#formulaire-brunch"
                : "#formulaire-evenement"
            }
            onClick={requestQuote}
          >
            Demander mon devis personnalisé <ArrowRight size={17} />
          </a>
          <a className="calculator-secondary-link" href="#carte">
            Voir les plats <ArrowRight size={17} />
          </a>
        </div>
      </div>
      <p className="calculator-disclaimer">
        Estimation non contractuelle. Le déplacement et le détail du devis
        sont calculés avec vous à partir de votre demande.
      </p>
    </div>
  );
}
