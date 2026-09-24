"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ListChecks } from "lucide-react";

type Formula =
  | "buffet"
  | "plateau"
  | "assiette"
  | "aperitifs"
  | "brunch"
  | "barbecue"
  | "chef";
type Service = "avec-vin" | "sans-vin";
type DishKit = "none" | "essentiel" | "complet" | "prestige";

const services: Record<Formula, Array<{ value: Service; label: string }>> = {
  buffet: [
    { value: "avec-vin", label: "Avec vin d’honneur" },
    { value: "sans-vin", label: "Sans vin d’honneur" },
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
  barbecue: [{ value: "sans-vin", label: "Barbecue Party" }],
  chef: [{ value: "sans-vin", label: "Chef à domicile · tout compris" }],
};
const MIN_GUESTS: Record<Formula, number> = {
  buffet: 30,
  plateau: 30,
  assiette: 30,
  aperitifs: 50,
  brunch: 50,
  barbecue: 30,
  chef: 20,
};
const CHILD_PRICE = 25;
const PROVIDER_PRICE = 30;
const HONOR_WINE_SUPPLEMENT = 5;
const formulaNames: Record<Formula, string> = {
  buffet: "Buffet",
  plateau: "Plateau",
  assiette: "Service à l’assiette",
  aperitifs: "Apéritifs & vin d’honneur",
  brunch: "Brunch Signature",
  barbecue: "Barbecue Party",
  chef: "Chef à domicile",
};

function unitPrice(
  formula: Formula,
  service: Service,
  totalGuests: number,
) {
  if (formula === "aperitifs") return 25;
  if (formula === "brunch") return 35;
  if (formula === "barbecue") return 60;
  if (formula === "chef") return 95;
  const range = totalGuests < 200 ? 0 : totalGuests < 350 ? 1 : 2;
  const base = {
    buffet: [45, 40, 35],
    plateau: [50, 45, 40],
    assiette: [70, 65, 60],
  }[formula][range];
  return service === "avec-vin" ? base + HONOR_WINE_SUPPLEMENT : base;
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
        label: "Assiette d'assortiment de 3 fromages",
        unit: 9,
        unitLabel: "9 €/pers.",
        kind: "toggle",
        basis: (guests) => guests,
      },
      {
        id: "drinks",
        label: "Forfait boissons sans alcool (colas, sodas, eaux)",
        unit: 5,
        unitLabel: "5 €/pers.",
        kind: "toggle",
        basis: (_guests, totalGuests) => totalGuests,
      },
      {
        id: "drinksService",
        label: "Service des boissons toute la soirée",
        unit: 160,
        unitLabel: "160 €/serveur",
        kind: "toggle",
        basis: (_guests, totalGuests) => Math.max(1, Math.ceil(totalGuests / 50)),
        help: "1 serveur par tranche de 50 convives, calculé automatiquement.",
      },
      {
        id: "cocktails",
        label: "Cocktails (1 litre pour environ 4 convives)",
        unit: 10,
        unitLabel: "10 €/litre",
        kind: "qty",
        qtyLabel: "litre(s)",
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
        id: "maitreHotel",
        label: "Maître d’hôtel",
        unit: 160,
        unitLabel: "160 €",
        kind: "toggle",
        help: "Coordonne l’équipe et le lieu jusqu’à la fin de soirée.",
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
        help: "Incluse par défaut. À décocher uniquement si votre lieu de réception conserve les déchets alimentaires.",
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
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [mobileBarVisible, setMobileBarVisible] = useState(false);
  const [formula, setFormula] = useState<Formula>("buffet");
  const [guests, setGuests] = useState(MIN_GUESTS.buffet);
  const [service, setService] = useState<Service>("avec-vin");
  const [children, setChildren] = useState(0);
  const [providers, setProviders] = useState(0);
  const [extraPieces, setExtraPieces] = useState(0);
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
      if (next !== "brunch" && next !== "aperitifs") setExtraPieces(0);
      if (next === "chef") {
        setChildren(0);
        setProviders(0);
      }
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

  const isChef = formula === "chef";
  const totalGuests = isChef ? guests : guests + children + providers;
  const price = useMemo(
    () => unitPrice(formula, service, totalGuests),
    [formula, service, totalGuests],
  );
  const mealTotal = price === null ? null : price * guests;

  const optionLines: Array<{ id: string; label: string; amount: number }> =
    [];
  if (children && !isChef)
    optionLines.push({
      id: "children",
      label: `${children} repas enfant${children > 1 ? "s" : ""} (${CHILD_PRICE} €/pers.)`,
      amount: children * CHILD_PRICE,
    });
  if (providers && !isChef)
    optionLines.push({
      id: "providers",
      label: `${providers} repas prestataire${providers > 1 ? "s" : ""} (${PROVIDER_PRICE} €/pers.)`,
      amount: providers * PROVIDER_PRICE,
    });
  if ((formula === "brunch" || formula === "aperitifs") && extraPieces)
    optionLines.push({
      id: "extraPieces",
      label: `${extraPieces} pièce${extraPieces > 1 ? "s" : ""} supplémentaire${extraPieces > 1 ? "s" : ""} au-delà des 10 incluses (2,50 €/pièce)`,
      amount: extraPieces * 2.5,
    });
  for (const category of isChef ? [] : OPTION_CATEGORIES) {
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
  if (dishKit !== "none" && !isChef)
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
    if (next !== "brunch" && next !== "aperitifs") setExtraPieces(0);
    if (next === "chef") {
      setChildren(0);
      setProviders(0);
    }
    setGuestError("");
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
  function resetCalculator() {
    setFormula("buffet");
    setGuests(MIN_GUESTS.buffet);
    setService(services.buffet[0].value);
    setChildren(0);
    setProviders(0);
    setExtraPieces(0);
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
              <option value="aperitifs">Apéritifs & vin d’honneur</option>
              <option value="brunch">Brunch Signature</option>
              <option value="barbecue">Barbecue Party</option>
              <option value="chef">Chef à domicile</option>
            </select>
          </label>
          <label>
            <span>Niveau de service</span>
            <select
              value={service}
              disabled={
                formula === "brunch" ||
                formula === "barbecue" ||
                formula === "chef"
              }
              onChange={(e) => setService(e.target.value as Service)}
            >
              {services[formula].map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          {(formula === "brunch" || formula === "aperitifs") && (
            <label>
              <span>Pièces supplémentaires</span>
              <input
                type="number"
                min="0"
                max="1000"
                inputMode="numeric"
                value={extraPieces}
                onChange={(e) =>
                  setExtraPieces(
                    Math.min(1000, Math.max(0, Number(e.target.value) || 0)),
                  )
                }
              />
              <small className="calculator-field-help">
                10 pièces incluses par personne, réparties comme vous voulez
                entre salé et sucré · 2,50 €/pièce au-delà.
              </small>
            </label>
          )}
        </div>
        <div className="calculator-controls-row calculator-controls-row--people">
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
          {!isChef && (
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
              Repas adapté aux 5-12 ans · 25 €/personne.
            </small>
          </label>
          )}
          {!isChef && (
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
              Photographe, DJ, vidéaste… · 30 €/personne.
            </small>
          </label>
          )}
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

      {!isChef && (
      <details className="calculator-options-toggle">
        <summary>
          <span>Ajouter des options</span>
          <small>
            {optionLines.length === 0
              ? "Fromages, boissons, vaisselle, mobilier…"
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
            Camion frigorifique, photographe, vidéaste, DJ, décorateur et
            wedding planner : sur devis, à discuter directement avec nous.
          </p>
        </div>
      </details>
      )}
      {isChef && (
        <p className="calculator-option-note">
          Vaisselle, nappage et service inclus. Seuls les frais de déplacement
          s’ajoutent.
        </p>
      )}

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
              {guests} adulte{guests > 1 ? "s" : ""} × {isChef ? "dès " : ""}
              {price} €/pers. ({selectedService})
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
