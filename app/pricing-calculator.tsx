"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, ExternalLink, MapPin } from "lucide-react";

type Formula = "buffet" | "plateau" | "assiette" | "aperitifs" | "brunch";
type Service = "avec-vin" | "sans-vin" | "sans-service";
type Dishware = "none" | "essential" | "complete";
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

function Quantity({
  label,
  price,
  note,
  value,
  onChange,
}: {
  label: string;
  price: string;
  note?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="calculator-quantity">
      <span>
        <strong>{label}</strong>
        <small>{price}</small>
        {note && <small className="calculator-option-help">{note}</small>}
      </span>
      <input
        type="number"
        min="0"
        max="1000"
        inputMode="numeric"
        value={value}
        onChange={(event) =>
          onChange(Math.min(1000, Math.max(0, Number(event.target.value) || 0)))
        }
        aria-label={`${label}, quantité`}
      />
    </label>
  );
}

export default function PricingCalculator() {
  const [personalisationTarget, setPersonalisationTarget] =
    useState<HTMLElement | null>(null);
  const [formula, setFormula] = useState<Formula>("buffet");
  const [guests, setGuests] = useState(100);
  const [service, setService] = useState<Service>("avec-vin");
  const [dishware, setDishware] = useState<Dishware>("none");
  const [softDrinks, setSoftDrinks] = useState(false);
  const [oven, setOven] = useState(false);
  const [dryIce, setDryIce] = useState(false);
  const [cake, setCake] = useState(false);
  const [standingTables, setStandingTables] = useState(0);
  const [chargers, setChargers] = useState(0);
  const [chafing, setChafing] = useState(0);
  const [drinkServers, setDrinkServers] = useState(0);
  const [children, setChildren] = useState(0);
  const [providers, setProviders] = useState(0);
  const [eventAddress, setEventAddress] = useState("");
  const [roundTripKm, setRoundTripKm] = useState(0);
  const [guestError, setGuestError] = useState("");
  useEffect(
    () =>
      setPersonalisationTarget(
        document.getElementById("personalisation-calculateur"),
      ),
    [],
  );
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
  const dishwareTotal =
    dishware === "essential"
      ? guests * 7
      : dishware === "complete"
        ? guests * 10
        : 0;
  const optionsTotal =
    50 +
    dishwareTotal +
    (softDrinks ? guests * 3.8 : 0) +
    (oven ? 150 : 0) +
    (dryIce ? 30 : 0) +
    (cake ? 150 : 0) +
    standingTables * 15 +
    chargers * 3 +
    chafing * 25 +
    drinkServers * 160 +
    children * 20 +
    providers * 20;
  const travelTotal = roundTripKm * 1.7;
  const estimatedTotal =
    mealTotal === null ? null : mealTotal + optionsTotal + travelTotal;
  const firstEstimate =
    mealTotal === null ? null : mealTotal + children * 20 + providers * 20 + 50;
  const selectedService =
    services[formula].find((item) => item.value === service)?.label || "";
  const origin = "8 Allée des Bois, 77240 Vert-Saint-Denis, France";
  const mapsUrl = eventAddress.trim()
    ? `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(eventAddress.trim())}/${encodeURIComponent(origin)}/`
    : `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/`;
  const optionLines: Array<{ label: string; amount: number }> = [
    { label: "Gestion des déchets", amount: 50 },
  ];
  if (dishwareTotal)
    optionLines.push({
      label:
        dishware === "essential"
          ? "Vaisselle essentielle"
          : "Vaisselle complète",
      amount: dishwareTotal,
    });
  if (softDrinks)
    optionLines.push({ label: "Boissons soft", amount: guests * 3.8 });
  if (oven) optionLines.push({ label: "Location d’étuve", amount: 150 });
  if (dryIce) optionLines.push({ label: "Glace carbonique", amount: 30 });
  if (cake) optionLines.push({ label: "Service wedding cake", amount: 150 });
  if (standingTables)
    optionLines.push({
      label: `${standingTables} mange-debout`,
      amount: standingTables * 15,
    });
  if (chargers)
    optionLines.push({
      label: `${chargers} sous-plat${chargers > 1 ? "s" : ""} perlé${chargers > 1 ? "s" : ""}`,
      amount: chargers * 3,
    });
  if (chafing)
    optionLines.push({
      label: `${chafing} chafing dish${chafing > 1 ? "es" : ""}`,
      amount: chafing * 25,
    });
  if (drinkServers)
    optionLines.push({
      label: `${drinkServers} serveur${drinkServers > 1 ? "s" : ""} boissons`,
      amount: drinkServers * 160,
    });
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
            travelIncluded: roundTripKm > 0,
          },
        },
      }),
    );
    window.history.pushState(null, "", hash);
    document
      .getElementById("devis")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const personalisationPanel = (
    <div className="pricing-calculator personalization-calculator">
      <div className="calculator-heading">
        <div>
          <span>Options & services complémentaires</span>
          <h3>Affinez votre estimation</h3>
        </div>
        <p>
          Ajoutez uniquement ce dont votre réception a besoin. Chaque choix met
          à jour le total.
        </p>
      </div>
      <details className="calculator-advanced">
        <summary>
          <span>Ajouter des options</span>
          <small>Vaisselle, boissons, étuve, matériel et serveurs</small>
          <b aria-hidden="true">+</b>
        </summary>
        <div className="calculator-options">
          <div className="calculator-options-heading">
            <span>Options complémentaires</span>
            <p>
              Les options sont facultatives et décochées par défaut. La gestion
              des déchets à 50 € est incluse systématiquement.
            </p>
          </div>
          <div className="calculator-option-grid">
            <label>
              <span>Vaisselle</span>
              <select
                value={dishware}
                onChange={(event) =>
                  setDishware(event.target.value as Dishware)
                }
              >
                <option value="none">Aucune</option>
                <option value="essential">Kit essentiel · 7 €/pers.</option>
                <option value="complete">Kit complet · 10 €/pers.</option>
              </select>
              {dishware !== "none" && (
                <small className="calculator-option-help">
                  {dishware === "essential"
                    ? "2 assiettes, 2 verres et couverts inclus."
                    : "3 assiettes, 3 verres et couverts inclus."}
                </small>
              )}
            </label>
            <label className="calculator-check">
              <input
                type="checkbox"
                checked={softDrinks}
                onChange={(e) => setSoftDrinks(e.target.checked)}
              />
              <span>
                <strong>Boissons soft</strong>
                <small>3,80 € / personne</small>
              </span>
            </label>
            <label className="calculator-check">
              <input
                type="checkbox"
                checked={oven}
                onChange={(e) => setOven(e.target.checked)}
              />
              <span>
                <strong>Location d’étuve</strong>
                <small>150 €</small>
                <small className="calculator-option-help">
                  À réserver au moins 72 h avant.
                </small>
              </span>
            </label>
            <label className="calculator-check">
              <input
                type="checkbox"
                checked={dryIce}
                onChange={(e) => setDryIce(e.target.checked)}
              />
              <span>
                <strong>Glace carbonique</strong>
                <small>30 €</small>
              </span>
            </label>
            <label className="calculator-check">
              <input
                type="checkbox"
                checked={cake}
                onChange={(e) => setCake(e.target.checked)}
              />
              <span>
                <strong>Service wedding cake</strong>
                <small>150 €</small>
              </span>
            </label>
            <div className="calculator-check calculator-default">
              <Check size={18} />
              <span>
                <strong>Gestion des déchets</strong>
                <small>50 € · incluse systématiquement</small>
              </span>
            </div>
          </div>
          <details className="calculator-more">
            <summary>Ajouter du matériel ou des serveurs</summary>
            <div className="calculator-quantities">
              <Quantity
                label="Mange-debout"
                price="15 € / unité"
                note="Housse et nappe comprises."
                value={standingTables}
                onChange={setStandingTables}
              />
              <Quantity
                label="Sous-plat perlé"
                price="3 € / unité"
                value={chargers}
                onChange={setChargers}
              />
              <Quantity
                label="Chafing dish"
                price="25 € / unité"
                value={chafing}
                onChange={setChafing}
              />
              <Quantity
                label="Serveur boissons"
                price="160 € / serveur"
                value={drinkServers}
                onChange={setDrinkServers}
              />
            </div>
          </details>
        </div>
      </details>
      <div className="calculator-travel">
        <div className="calculator-travel-heading">
          <MapPin size={20} />
          <div>
            <span>Frais de déplacement</span>
            <h4>Calculez la distance aller-retour</h4>
            <p>Départ et retour : 8 allée des Bois, 77240 Vert-Saint-Denis.</p>
          </div>
        </div>
        <div className="calculator-travel-controls">
          <label className="calculator-address">
            <span>Adresse de l’événement</span>
            <input
              type="text"
              value={eventAddress}
              onChange={(e) => setEventAddress(e.target.value)}
              placeholder="Ex. La Réthorée, 77120 Giremoutiers"
            />
          </label>
          <a
            className="calculator-maps-link"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir l’aller-retour sur Google Maps <ExternalLink size={15} />
          </a>
          <label className="calculator-km">
            <span>Distance totale aller-retour</span>
            <div>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={roundTripKm || ""}
                onChange={(e) =>
                  setRoundTripKm(Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="0"
              />
              <strong>km AR</strong>
            </div>
          </label>
        </div>
        <p className="calculator-travel-help">
          Tarif appliqué : <strong>1,70 € / km aller-retour</strong>.
        </p>
        {roundTripKm === 0 && (
          <p className="calculator-travel-warning">
            <strong>Déplacement non inclus.</strong> Renseignez les kilomètres
            pour compléter l’estimation.
          </p>
        )}
      </div>
      <div className="calculator-breakdown" aria-live="polite">
        <div>
          <span>Formule / repas</span>
          <strong>
            {mealTotal === null
              ? "Sur devis"
              : `${mealTotal.toLocaleString("fr-FR")} €`}
          </strong>
          <small>
            {formulaNames[formula]} ·{" "}
            {price === null
              ? "plus de 350 convives"
              : `${price} € × ${guests} adulte${guests > 1 ? "s" : ""}`}
          </small>
        </div>
        <div>
          <span>Options & repas spécifiques</span>
          <strong>
            {optionsTotal.toLocaleString("fr-FR", {
              minimumFractionDigits: optionsTotal % 1 ? 2 : 0,
            })}{" "}
            €
          </strong>
          <ul className="calculator-cost-lines">
            {optionLines.map((line) => (
              <li key={line.label}>
                <span>{line.label}</span>
                <strong>
                  {line.amount.toLocaleString("fr-FR", {
                    minimumFractionDigits: line.amount % 1 ? 2 : 0,
                  })}{" "}
                  €
                </strong>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <span>Déplacement</span>
          <strong>
            {travelTotal.toLocaleString("fr-FR", {
              minimumFractionDigits: travelTotal % 1 ? 2 : 0,
            })}{" "}
            €
          </strong>
          <small>
            {roundTripKm > 0 ? `${roundTripKm} km AR × 1,70 €` : "À compléter"}
          </small>
        </div>
      </div>
      <div className="calculator-result">
        <div>
          <span>
            {roundTripKm > 0
              ? "Estimation totale"
              : "Estimation hors déplacement"}
          </span>
          <strong>
            {estimatedTotal === null
              ? "Tarif sur devis"
              : `${estimatedTotal.toLocaleString("fr-FR", { minimumFractionDigits: estimatedTotal % 1 ? 2 : 0 })} €`}
          </strong>
          <small>
            {roundTripKm > 0
              ? "Déplacement inclus"
              : "Ajoutez la distance pour compléter votre budget"}
          </small>
        </div>
        <a
          href={
            formula === "brunch"
              ? "#formulaire-brunch"
              : "#formulaire-evenement"
          }
          onClick={requestQuote}
        >
          Demander mon devis personnalisé <ArrowRight size={17} />
        </a>
      </div>
      <p className="calculator-disclaimer">
        Estimation non contractuelle. Le devis définitif dépendra des choix et
        informations transmis.
      </p>
    </div>
  );

  return (
    <>
    <div className="pricing-calculator" id="calculateur" aria-labelledby="calculator-title">
        <div className="calculator-heading">
          <div>
            <span>Estimation personnalisée</span>
            <h3 id="calculator-title">Calculez votre réception</h3>
          </div>
          <p>
            Choisissez la formule et indiquez vos convives pour obtenir
            immédiatement un premier ordre de budget.
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
            <span>Première estimation</span>
            <strong>
              {firstEstimate === null
                ? "Sur devis"
                : `${firstEstimate.toLocaleString("fr-FR", { minimumFractionDigits: firstEstimate % 1 ? 2 : 0 })} €`}
            </strong>
            <small>
              Repas spécifiques et déchets inclus · hors options et déplacement
            </small>
          </div>
          <a href="#carte">
            Voir les plats <ArrowRight size={17} />
          </a>
        </div>
        <p className="calculator-disclaimer">
          Estimation non contractuelle. Ajoutez ensuite uniquement les options
          dont vous avez besoin.
        </p>
      </div>
      {personalisationTarget &&
        createPortal(personalisationPanel, personalisationTarget)}
    </>
  );
}
