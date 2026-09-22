"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ListChecks } from "lucide-react";

type Formula = "buffet" | "plateau" | "assiette" | "aperitifs" | "brunch";
type Service = "avec-vin" | "sans-vin" | "sans-service";
type DishKit = "none" | "essentiel" | "complet" | "prestige";

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
const MIN_GUESTS: Record<Formula, number> = {
  buffet: 10,
  plateau: 10,
  assiette: 10,
  aperitifs: 30,
  brunch: 30,
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
    if (guests >= 350) return null;
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

type OptionDef = {
  id: string;
  label: string;
  unit: number;
  unitLabel: string;
  kind: "toggle" | "qty";
  basis?: (guests: number, totalGuests: number) => number;
  qtyLabel?: string;
  help?: string;
};

const OPTION_CATEGORIES: Array<{ title: string; options: OptionDef[] }> = [
  {
    title: "Repas et boissons",
    options: [
      {
        id: "cheese",
        label: "Assiette de fromages avant le dessert",
        unit: 9,
        unitLabel: "9 €/pers.",
        kind: "toggle",
        basis: (guests) => guests,
      },
      {
        id: "drinks",
        label: "Forfait boissons sans alcool (colas, sodas, eaux)",
        unit: 3.8,
        unitLabel: "3,80 €/pers.",
        kind: "toggle",
        basis: (_guests, totalGuests) => totalGuests,
      },
      {
        id: "drinksService",
        label: "Service des boissons toute la soirée",
        unit: 160,
        unitLabel: "160 €/serveur",
        kind: "qty",
        qtyLabel: "serveur(s)",
        help: "1 serveur recommandé pour 50 convives.",
      },
      {
        id: "cakeParts",
        label: "Wedding cake",
        unit: 6.5,
        unitLabel: "dès 6,50 €/part",
        kind: "qty",
        qtyLabel: "part(s)",
      },
      {
        id: "cakeService",
        label: "Présentation, découpe et service du gâteau",
        unit: 150,
        unitLabel: "150 € le forfait",
        kind: "toggle",
      },
    ],
  },
  {
    title: "Vaisselle et linge",
    options: [
      {
        id: "napkin",
        label: "Serviette en tissu",
        unit: 2,
        unitLabel: "2 €/pers.",
        kind: "toggle",
        basis: (_guests, totalGuests) => totalGuests,
      },
      {
        id: "placemats",
        label: "Sous-plat perlé",
        unit: 3,
        unitLabel: "3 €/unité",
        kind: "qty",
        qtyLabel: "unité(s)",
      },
      {
        id: "tablecloths",
        label: "Nappe",
        unit: 15,
        unitLabel: "15 €/unité",
        kind: "qty",
        qtyLabel: "unité(s)",
      },
    ],
  },
  {
    title: "Mobilier, matériel et services",
    options: [
      {
        id: "standingTables",
        label: "Mange-debout (housse et nappe incluses)",
        unit: 15,
        unitLabel: "15 €/unité",
        kind: "qty",
        qtyLabel: "unité(s)",
      },
      {
        id: "chafingDishes",
        label: "Chafing dish",
        unit: 25,
        unitLabel: "25 €/unité",
        kind: "qty",
        qtyLabel: "unité(s)",
      },
      {
        id: "warmer",
        label: "Étuve professionnelle",
        unit: 150,
        unitLabel: "150 € le forfait",
        kind: "toggle",
      },
      {
        id: "setup",
        label: "Installation et désinstallation",
        unit: 150,
        unitLabel: "150 € le forfait",
        kind: "toggle",
      },
      {
        id: "dressing",
        label: "Dressage",
        unit: 250,
        unitLabel: "250 € le forfait",
        kind: "toggle",
      },
      {
        id: "waste",
        label: "Gestion des déchets alimentaires (hors verre)",
        unit: 50,
        unitLabel: "50 € le forfait",
        kind: "toggle",
      },
    ],
  },
];

const dishKitPrices: Record<DishKit, number> = {
  none: 0,
  essentiel: 7,
  complet: 10,
  prestige: 13,
};
const dishKitLabels: Record<DishKit, string> = {
  none: "Aucune",
  essentiel: "Essentiel (2 assiettes, 1 verre à eau, 1 verre à vin, couverts)",
  complet:
    "Complet (3 assiettes, 1 verre à eau, 1 verre à vin, 1 verre à champagne, couverts)",
  prestige: "Prestige (3 assiettes, sous-plat perlé, 3 verres, couverts)",
};

function optionAmount(
  def: OptionDef,
  value: number,
  guests: number,
  totalGuests: number,
) {
  if (def.kind === "toggle") {
    if (!value) return 0;
    const multiplier = def.basis ? def.basis(guests, totalGuests) : 1;
    return def.unit * multiplier;
  }
  return def.unit * value;
}

export default function PricingCalculator() {
  const [formula, setFormula] = useState<Formula>("buffet");
  const [guests, setGuests] = useState(100);
  const [service, setService] = useState<Service>("avec-vin");
  const [children, setChildren] = useState(0);
  const [providers, setProviders] = useState(0);
  const [optionValues, setOptionValues] = useState<Record<string, number>>(
    {},
  );
  const [dishKit, setDishKit] = useState<DishKit>("none");
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

  function setOptionValue(id: string, value: number) {
    setOptionValues((current) => ({ ...current, [id]: value }));
  }

  const totalGuests = guests + children + providers;
  const price = useMemo(
    () => unitPrice(formula, guests, service),
    [formula, guests, service],
  );
  const mealTotal = price === null ? null : price * guests;

  const optionLines: Array<{ id: string; label: string; amount: number }> =
    [];
  if (children)
    optionLines.push({
      id: "children",
      label: `${children} repas enfant${children > 1 ? "s" : ""} (20 €/pers.)`,
      amount: children * 20,
    });
  if (providers)
    optionLines.push({
      id: "providers",
      label: `${providers} repas prestataire${providers > 1 ? "s" : ""} (20 €/pers.)`,
      amount: providers * 20,
    });
  for (const category of OPTION_CATEGORIES) {
    for (const def of category.options) {
      const value = optionValues[def.id] || 0;
      const amount = optionAmount(def, value, guests, totalGuests);
      if (amount <= 0) continue;
      const qtyPart = def.kind === "qty" ? `${value} ${def.qtyLabel} · ` : "";
      optionLines.push({
        id: def.id,
        label: `${def.label} (${qtyPart}${def.unitLabel})`,
        amount,
      });
    }
  }
  if (dishKit !== "none")
    optionLines.push({
      id: "dishKit",
      label: `Vaisselle ${dishKit} (${totalGuests} kits × ${dishKitPrices[dishKit]} €)`,
      amount: totalGuests * dishKitPrices[dishKit],
    });

  const optionsTotal = optionLines.reduce((sum, line) => sum + line.amount, 0);
  const estimatedTotal =
    mealTotal === null ? null : mealTotal + optionsTotal;
  const selectedService =
    services[formula].find((item) => item.value === service)?.label || "";
  const minGuests = MIN_GUESTS[formula];

  function changeFormula(next: Formula) {
    setFormula(next);
    setService(services[next][0].value);
    const nextMin = MIN_GUESTS[next];
    if (guests < nextMin) {
      setGuests(nextMin);
      setGuestError("");
    }
    window.dispatchEvent(
      new CustomEvent<Formula>("cuillere:formula", { detail: next }),
    );
  }
  function changeGuests(rawValue: string) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < minGuests) {
      setGuests(minGuests);
      setGuestError(`Le minimum est de ${minGuests} adultes.`);
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
            formulaId: formula,
            formula: formulaNames[formula],
            adults: guests,
            children,
            providers,
            totalGuests,
            serviceId: service,
            service: selectedService,
            options: optionLines,
            optionsTotal,
            total: estimatedTotal,
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
            min={minGuests}
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
            {guestError || `Entre ${minGuests} et 1 000 adultes.`}
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
            Repas adapté aux 3-12 ans · 20 €/personne.
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
            Photographe, DJ, vidéaste… · 20 €/personne.
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

      <details className="calculator-options-toggle">
        <summary>
          <span>Ajouter des options</span>
          <small>
            {optionLines.length > 0
              ? `${optionLines.length} option${optionLines.length > 1 ? "s" : ""} sélectionnée${optionLines.length > 1 ? "s" : ""} · ${optionsTotal.toLocaleString("fr-FR", { minimumFractionDigits: optionsTotal % 1 ? 2 : 0 })} €`
              : "Fromages, boissons, vaisselle, mobilier…"}
          </small>
          <b aria-hidden="true">+</b>
        </summary>
        <div className="calculator-options">
          <div className="calculator-options-intro">
            <ListChecks size={18} />
            <p>
              Rien n’est inclus par défaut : ajoutez uniquement les options
              utiles à votre réception.
            </p>
          </div>
          {OPTION_CATEGORIES.map((category) => (
            <div className="calculator-option-group" key={category.title}>
              <h5>{category.title}</h5>
              {category.title === "Vaisselle et linge" && (
                <label className="calculator-option-select">
                  <span>Location de vaisselle ({totalGuests} convives)</span>
                  <select
                    value={dishKit}
                    onChange={(e) => setDishKit(e.target.value as DishKit)}
                  >
                    <option value="none">Aucune</option>
                    <option value="essentiel">Essentiel — 7 €/kit</option>
                    <option value="complet">Complet — 10 €/kit</option>
                    <option value="prestige">Prestige — 13 €/kit</option>
                  </select>
                  <small className="calculator-field-help">
                    {dishKitLabels[dishKit]}
                  </small>
                </label>
              )}
              {category.options.map((def) =>
                def.kind === "toggle" ? (
                  <label className="calculator-option-toggle" key={def.id}>
                    <input
                      type="checkbox"
                      checked={Boolean(optionValues[def.id])}
                      onChange={(e) =>
                        setOptionValue(def.id, e.target.checked ? 1 : 0)
                      }
                    />
                    <span>
                      {def.label} <small>({def.unitLabel})</small>
                    </span>
                  </label>
                ) : (
                  <label className="calculator-option-qty" key={def.id}>
                    <span>
                      {def.label} <small>({def.unitLabel})</small>
                    </span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={optionValues[def.id] || ""}
                      onChange={(e) =>
                        setOptionValue(
                          def.id,
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                      placeholder="0"
                    />
                    {def.help && (
                      <small className="calculator-field-help">
                        {def.help}
                      </small>
                    )}
                  </label>
                ),
              )}
            </div>
          ))}
          <p className="calculator-option-note">
            Camion frigorifique, photographe, vidéaste, DJ, décorateur et
            wedding planner : sur devis, à discuter directement avec nous.
          </p>
        </div>
      </details>

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
          <small>
            {optionLines.length > 0
              ? "Repas et options sélectionnées inclus · hors déplacement"
              : "Repas spécifiques inclus · hors options et déplacement"}
          </small>
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
