"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ListChecks } from "lucide-react";

type Formula = "buffet" | "plateau" | "assiette" | "aperitifs" | "brunch";
type Service = "avec-vin" | "sans-vin";
type DishKit = "none" | "essentiel" | "complet" | "prestige";

const services: Record<Formula, Array<{ value: Service; label: string }>> = {
  buffet: [
    { value: "sans-vin", label: "Sans vin d’honneur" },
    { value: "avec-vin", label: "Avec vin d’honneur (+ 5 €/pers.)" },
  ],
  plateau: [
    { value: "sans-vin", label: "Sans vin d’honneur" },
    { value: "avec-vin", label: "Avec vin d’honneur (+ 5 €/pers.)" },
  ],
  assiette: [
    { value: "sans-vin", label: "Sans vin d’honneur" },
    { value: "avec-vin", label: "Avec vin d’honneur (+ 5 €/pers.)" },
  ],
  aperitifs: [{ value: "avec-vin", label: "10 pièces au choix" }],
  brunch: [{ value: "sans-vin", label: "Brunch Signature" }],
};
const MIN_GUESTS: Record<Formula, number> = {
  buffet: 30,
  plateau: 30,
  assiette: 30,
  aperitifs: 50,
  brunch: 50,
};
const formulaNames: Record<Formula, string> = {
  buffet: "Buffet",
  plateau: "Plateau",
  assiette: "Service à l’assiette",
  aperitifs: "Cocktail dînatoire & vin d’honneur",
  brunch: "Brunch Signature",
};
const CHILD_PRICE = 25;
const PROVIDER_PRICE = 30;
const HONOR_WINE_SUPPLEMENT = 5;

// Prix par adulte, service compris, selon le nombre total de convives
// (adultes + enfants + prestataires) : 30 à 199, 200 à 349, 350 et plus.
const TIER_PRICES: Record<"buffet" | "plateau" | "assiette", number[]> = {
  buffet: [45, 40, 35],
  plateau: [50, 45, 40],
  assiette: [70, 65, 60],
};

function unitPrice(
  formula: Formula,
  service: Service,
  totalGuests: number,
) {
  if (formula === "aperitifs") return 25;
  if (formula === "brunch") return 35;
  const range = totalGuests < 200 ? 0 : totalGuests < 350 ? 1 : 2;
  return (
    TIER_PRICES[formula][range] +
    (service === "avec-vin" ? HONOR_WINE_SUPPLEMENT : 0)
  );
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
        id: "extraMain",
        label: "Viande ou poisson en plus",
        unit: 5,
        unitLabel: "5 €/pers.",
        kind: "toggle",
        basis: (guests) => guests,
      },
      {
        id: "extraStarter",
        label: "Entrée ou dessert en plus (service à l’assiette)",
        unit: 5,
        unitLabel: "5 €/pers.",
        kind: "toggle",
        basis: (guests) => guests,
        help: "Avocat surprise sur glace carbonique : 8 €/pers., soit 3 € de plus que les autres entrées.",
      },
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
        label: "Forfait soft et eau (Coca-Cola, Fanta, Oasis, eau plate et gazeuse)",
        unit: 5,
        unitLabel: "5 €/pers.",
        kind: "toggle",
        basis: (_guests, totalGuests) => totalGuests,
      },
      {
        id: "cocktails",
        label: "Cocktails signature",
        unit: 10,
        unitLabel: "10 €/litre",
        kind: "qty",
        qtyLabel: "litre(s)",
        help: "1 litre pour environ 4 convives.",
      },
      {
        id: "drinksService",
        label: "Service des boissons",
        unit: 160,
        unitLabel: "160 €/serveur",
        kind: "toggle",
        basis: (_guests, totalGuests) => Math.max(1, Math.ceil(totalGuests / 50)),
        help: "1 serveur conseillé pour 50 convives, calculé automatiquement.",
      },
      {
        id: "cakeService",
        label: "Découpe et service du gâteau",
        unit: 150,
        unitLabel: "150 € le forfait",
        kind: "toggle",
        help: "Wedding cake par notre partenaire Love Lo Cake, dès 6,50 €/part (à commander directement).",
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
        label: "Réchaud de buffet (chafing dish)",
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
        label: "Installation complète (mise en place du lieu et du matériel)",
        unit: 150,
        unitLabel: "150 € le forfait",
        kind: "toggle",
      },
      {
        id: "dressing",
        label: "Dressage des tables (nappes, assiettes, verres et couverts)",
        unit: 250,
        unitLabel: "250 € le forfait",
        kind: "toggle",
        help: "Compris si la vaisselle est louée avec la cheffe.",
      },
      {
        id: "maitreHotel",
        label: "Maître d’hôtel (coordonne l’équipe et le lieu jusqu’à la fin de soirée)",
        unit: 160,
        unitLabel: "160 € le forfait",
        kind: "toggle",
      },
      {
        id: "waste",
        label: "Gestion des déchets alimentaires",
        unit: 50,
        unitLabel: "50 € le forfait",
        kind: "toggle",
        help: "Incluse dans le devis par défaut. À décocher uniquement si votre lieu de réception conserve les déchets alimentaires.",
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
  essentiel: "Essentiel (2 assiettes, verre à eau, verre à vin, couverts)",
  complet:
    "Complet (3 assiettes, 1 verre à eau, 1 verre à vin, 1 verre à champagne, couverts)",
  prestige: "Prestige (Kit Complet + sous-plat perlé)",
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
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [mobileBarVisible, setMobileBarVisible] = useState(false);
  const [formula, setFormula] = useState<Formula>("buffet");
  const [guests, setGuests] = useState(MIN_GUESTS.buffet);
  const [guestsText, setGuestsText] = useState<string | null>(null);
  const [service, setService] = useState<Service>("sans-vin");
  const [children, setChildren] = useState(0);
  const [providers, setProviders] = useState(0);
  const [optionValues, setOptionValues] = useState<Record<string, number>>(
    { waste: 1 },
  );
  const [dishKit, setDishKit] = useState<DishKit>("none");
  const [guestError, setGuestError] = useState("");
  useEffect(() => {
    const syncFormula = (event: Event) => {
      const next = (event as CustomEvent<Formula>).detail;
      setFormula(next);
      setService(services[next][0].value);
      const nextMin = MIN_GUESTS[next];
      setGuests((current) => (current < nextMin ? nextMin : current));
      setGuestError("");
    };
    window.addEventListener("cuillere:formula", syncFormula);
    return () => window.removeEventListener("cuillere:formula", syncFormula);
  }, []);
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setMobileBarVisible(entry.isIntersecting),
      { rootMargin: "-72px 0px -72px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const HEADER_OFFSET = 106;
    const DESKTOP_MIN_WIDTH = 1024;
    function update() {
      const body = bodyRef.current;
      const summary = summaryRef.current;
      if (!body || !summary) return;
      if (window.innerWidth < DESKTOP_MIN_WIDTH) {
        summary.style.position = "";
        summary.style.top = "";
        summary.style.left = "";
        summary.style.right = "";
        summary.style.bottom = "";
        summary.style.width = "";
        return;
      }
      const bodyRect = body.getBoundingClientRect();
      const width = summary.offsetWidth || 360;
      const height = summary.offsetHeight;
      if (bodyRect.top > HEADER_OFFSET) {
        summary.style.position = "";
        summary.style.top = "";
        summary.style.left = "";
        summary.style.right = "";
        summary.style.bottom = "";
        summary.style.width = "";
      } else if (bodyRect.bottom < HEADER_OFFSET + height) {
        summary.style.position = "absolute";
        summary.style.top = "auto";
        summary.style.bottom = "0";
        summary.style.right = "0";
        summary.style.left = "auto";
        summary.style.width = `${width}px`;
      } else {
        summary.style.position = "fixed";
        summary.style.top = `${HEADER_OFFSET}px`;
        summary.style.bottom = "auto";
        summary.style.left = `${bodyRect.right - width}px`;
        summary.style.width = `${width}px`;
      }
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function setOptionValue(id: string, value: number) {
    setOptionValues((current) => ({ ...current, [id]: value }));
  }

  const totalGuests = guests + children + providers;
  const price = useMemo(
    () => unitPrice(formula, service, totalGuests),
    [formula, service, totalGuests],
  );
  const mealTotal = price === null ? null : price * guests;

  const optionLines: Array<{ id: string; label: string; amount: number }> =
    [];
  if (children)
    optionLines.push({
      id: "children",
      label: `${children} repas enfant${children > 1 ? "s" : ""} (${CHILD_PRICE} €/pers.)`,
      amount: children * CHILD_PRICE,
    });
  if (providers)
    optionLines.push({
      id: "providers",
      label: `${providers} repas prestataire${providers > 1 ? "s" : ""} (${PROVIDER_PRICE} €/pers.)`,
      amount: providers * PROVIDER_PRICE,
    });
  for (const category of OPTION_CATEGORIES) {
    for (const def of category.options) {
      const value = optionValues[def.id] || 0;
      if (def.id === "dressing" && dishKit !== "none") continue;
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
    }
    setGuestError("");
    window.dispatchEvent(
      new CustomEvent<Formula>("cuillere:formula", { detail: next }),
    );
  }
  function changeGuests(rawValue: string) {
    setGuestsText(rawValue);
    if (rawValue.trim() === "") {
      setGuestError("");
      return;
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    if (value > 1000) {
      setGuests(1000);
      setGuestError(
        "Le maximum du simulateur est de 1 000 adultes. Au-delà, contactez-nous.",
      );
      return;
    }
    setGuests(Math.max(0, Math.floor(value)));
    setGuestError(
      value < minGuests ? `Le minimum est de ${minGuests} adultes.` : "",
    );
  }
  function commitGuests() {
    setGuests((current) => Math.min(1000, Math.max(minGuests, current)));
    setGuestsText(null);
    setGuestError("");
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
  function resetCalculator() {
    setFormula("buffet");
    setGuests(MIN_GUESTS.buffet);
    setGuestsText(null);
    setService(services.buffet[0].value);
    setChildren(0);
    setProviders(0);
    setOptionValues({ waste: 1 });
    setDishKit("none");
    setGuestError("");
  }

  return (
    <div
      ref={rootRef}
      className="pricing-calculator"
      id="calculateur"
      aria-labelledby="calculator-title"
    >
      <div className="calculator-heading">
        <div>
          <span>Estimation personnalisée</span>
          <h3 id="calculator-title">Calculez votre réception</h3>
        </div>
        <div className="calculator-heading-side">
          <p>
            Choisissez la formule et indiquez vos convives pour obtenir
            immédiatement un ordre de budget.
          </p>
          <button
            type="button"
            className="calculator-reset"
            onClick={resetCalculator}
          >
            Réinitialiser la calculette
          </button>
        </div>
      </div>
      <div className="calculator-body" ref={bodyRef}>
      <div className="calculator-main">
      <div className="calculator-controls">
        <div className="calculator-controls-row">
          <label>
            <span>Votre formule</span>
            <select
              value={formula}
              onChange={(e) => changeFormula(e.target.value as Formula)}
            >
              <option value="buffet">Buffet</option>
              <option value="plateau">Plateau</option>
              <option value="assiette">Service à l’assiette</option>
              <option value="aperitifs">Cocktail dînatoire & vin d’honneur</option>
              <option value="brunch">Brunch Signature</option>
            </select>
          </label>
          <label>
            <span>Vin d’honneur</span>
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
        </div>
        <div className="calculator-controls-row calculator-controls-row--people">
          <label>
            <span>Adultes</span>
            <input
              type="number"
              min={minGuests}
              max="1000"
              inputMode="numeric"
              value={guestsText ?? guests}
              onChange={(e) => changeGuests(e.target.value)}
              onBlur={commitGuests}
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
              Enfants de 5 à 12 ans · 25 €/personne.
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
              Photographe, DJ, wedding planner… · 30 €/personne.
            </small>
          </label>
        </div>
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
            {optionLines.length === 0
              ? "Boissons, fromages, vaisselle, mobilier…"
              : optionLines.length === 1
                ? `${optionLines[0].label.replace(/ \([^)]*\)\s*$/, "")}${optionLines[0].id === "waste" ? " — sélectionné par défaut" : ""} · ${optionLines[0].amount.toLocaleString("fr-FR", { minimumFractionDigits: optionLines[0].amount % 1 ? 2 : 0 })} €`
                : `${optionLines.length} options sélectionnées · ${optionsTotal.toLocaleString("fr-FR", { minimumFractionDigits: optionsTotal % 1 ? 2 : 0 })} €`}
          </small>
          <b aria-hidden="true">+</b>
        </summary>
        <div className="calculator-options">
          <div className="calculator-options-intro">
            <ListChecks size={18} />
            <p>
              Seule la gestion des déchets est incluse par défaut ; ajoutez
              uniquement les options utiles à votre réception.
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
                      {def.label}{" "}
                      <small>
                        ({def.unitLabel}
                        {def.id === "waste" ? " · sélectionné par défaut" : ""})
                      </small>
                      {def.help && (
                        <small className="calculator-field-help">
                          {def.help}
                        </small>
                      )}
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
            Camion frigorifique (location + km), photographe, vidéaste, DJ,
            décorateur et wedding planner : sur devis. Barbecue Party (60 €/pers.)
            et Chef à domicile (dès 95 €/pers.) : demandez votre devis.
          </p>
        </div>
      </details>

      </div>
      <div className="calculator-summary-sticky" ref={summaryRef}>
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
      {estimatedTotal !== null && (
        <ul className="calculator-breakdown">
          <li>
            <span>
              {guests} adulte{guests > 1 ? "s" : ""} × {price} €/pers. (
              {selectedService})
            </span>
            <span>
              {mealTotal!.toLocaleString("fr-FR", { minimumFractionDigits: mealTotal! % 1 ? 2 : 0 })}{" "}
              €
            </span>
          </li>
          {optionLines.map((line) => (
            <li key={line.id}>
              <span>{line.label}</span>
              <span>
                {line.amount.toLocaleString("fr-FR", { minimumFractionDigits: line.amount % 1 ? 2 : 0 })}{" "}
                €
              </span>
            </li>
          ))}
          <li className="calculator-breakdown-total">
            <span>Estimation</span>
            <span>
              {estimatedTotal.toLocaleString("fr-FR", { minimumFractionDigits: estimatedTotal % 1 ? 2 : 0 })}{" "}
              €
            </span>
          </li>
        </ul>
      )}
      <p className="calculator-disclaimer">
        Estimation non contractuelle. Le déplacement et le détail du devis
        sont calculés avec vous à partir de votre demande.
      </p>
      </div>
      </div>
      <div
        className={`calculator-mobile-bar${mobileBarVisible ? " is-visible" : ""}`}
        aria-hidden={!mobileBarVisible}
      >
        <span>
          Estimation :{" "}
          <strong>
            {estimatedTotal === null
              ? "Sur devis"
              : `${estimatedTotal.toLocaleString("fr-FR", { minimumFractionDigits: estimatedTotal % 1 ? 2 : 0 })} €`}
          </strong>
        </span>
        <a
          href={
            formula === "brunch"
              ? "#formulaire-brunch"
              : "#formulaire-evenement"
          }
          onClick={requestQuote}
          tabIndex={mobileBarVisible ? 0 : -1}
        >
          Continuer <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}
