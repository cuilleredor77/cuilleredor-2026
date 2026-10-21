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

type Lang = "fr" | "en";
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
  chef: 12,
};
// Libellés anglais des services (les valeurs/ids restent en français pour le formulaire).
const SERVICE_EN: Record<string, string> = {
  "Avec vin d’honneur": "With cocktail reception",
  "Sans vin d’honneur": "Without cocktail reception",
  "Vin d’honneur inclus": "Cocktail reception included",
  "Brunch Signature": "Signature Brunch",
  "Barbecue Party": "Barbecue Party",
  "Chef à domicile · tout compris": "Private chef · all-inclusive",
};
const BELOW_MIN_WHATSAPP_EN =
  "https://wa.me/33783748971?text=Hello%20Cuill%C3%A8re%20d%27Or%2C%20my%20event%20has%20fewer%20guests%20than%20the%20catalogue%20minimum.%20Is%20that%20possible%3F";
const BELOW_MIN_MAILTO_EN =
  "mailto:contact@cuilleredor.fr?subject=Enquiry%20about%20a%20small%20event&body=Hello%2C%0A%0AMy%20event%20has%20fewer%20guests%20than%20the%20catalogue%20minimum.%20Is%20that%20possible%3F%0A%0ADate%3A%0AVenue%3A%0ANumber%20of%20guests%3A%0APreferred%20formula%3A";
const BELOW_MIN_WHATSAPP =
  "https://wa.me/33783748971?text=Bonjour%20Cuill%C3%A8re%20d%27Or%2C%20mon%20%C3%A9v%C3%A9nement%20compte%20moins%20d%27invit%C3%A9s%20que%20le%20minimum%20du%20catalogue.%20Est-ce%20possible%20%3F";
const BELOW_MIN_MAILTO =
  "mailto:contact@cuilleredor.fr?subject=Demande%20pour%20un%20petit%20%C3%A9v%C3%A9nement&body=Bonjour%2C%0A%0AMon%20%C3%A9v%C3%A9nement%20compte%20moins%20d%27invit%C3%A9s%20que%20le%20minimum%20du%20catalogue.%20Est-ce%20possible%20%3F%0A%0ADate%20%3A%0ALieu%20%3A%0ANombre%20d%27invit%C3%A9s%20%3A%0AFormule%20souhait%C3%A9e%20%3A";
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

const formulaNamesEn: Record<Formula, string> = {
  buffet: "Buffet",
  plateau: "Platter service",
  assiette: "Plated service",
  aperitifs: "Cocktail reception",
  brunch: "Signature Brunch",
  barbecue: "Barbecue Party",
  chef: "Private chef",
};
// Montant : « 1 234,50 € » en français, « €1,234.50 » en anglais.
function fmtMoney(n: number, lang: Lang) {
  const s = n.toLocaleString(lang === "en" ? "en-GB" : "fr-FR", {
    minimumFractionDigits: n % 1 ? 2 : 0,
  });
  return lang === "en" ? `€${s}` : `${s} €`;
}

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
  return base;
}

type OptionDef = {
  id: string;
  label: string;
  unit: number;
  unitLabel: string;
  kind: "toggle" | "qty";
  /** tableGuests = adultes + enfants (base de la vaisselle et du linge, sans les prestataires). */
  basis?: (guests: number, totalGuests: number, tableGuests: number) => number;
  qtyLabel?: string;
  help?: string;
  /** Option proposée seulement pour certaines formules (ex. cocktails avec un vin d’honneur). */
  when?: (formula: Formula, service: Service) => boolean;
};

// Traductions anglaises des options (ids inchangés).
const OPTION_EN: Record<
  string,
  { label: string; unitLabel: string; help?: string; qtyLabel?: string }
> = {
  cheese: { label: "Platter of 3 assorted cheeses", unitLabel: "€9/guest" },
  drinks: {
    label: "Soft drinks package (colas, sodas, water)",
    unitLabel: "€5/guest",
  },
  drinksService: {
    label: "Drinks service all evening",
    unitLabel: "€160/server",
    help: "1 server per 50 guests, calculated automatically.",
  },
  honorCocktails: {
    label: "4 cocktails of your choice per guest (cocktail reception)",
    unitLabel: "€5/guest",
  },
  cocktails: {
    label: "Additional cocktails, beyond the 4 included (1 litre for about 4 guests)",
    unitLabel: "€10/litre",
    qtyLabel: "litre(s)",
  },
  cakeService: {
    label: "Cake presentation, cutting and service",
    unitLabel: "€150 flat fee",
  },
  napkin: { label: "Cloth napkin", unitLabel: "€2/guest" },
  placemats: { label: "Beaded charger plate", unitLabel: "€3/unit" },
  standingTables: {
    label: "Cocktail table (cover and tablecloth included)",
    unitLabel: "€15/unit",
    qtyLabel: "unit(s)",
  },
  chafingDishes: { label: "Chafing dish", unitLabel: "€25/unit", qtyLabel: "unit(s)" },
  warmer: { label: "Professional warming cabinet", unitLabel: "€150 flat fee" },
  maitreHotel: {
    label: "Maître d’hôtel",
    unitLabel: "€160",
    help: "Coordinates the team and the venue until the end of the evening.",
  },
  setup: { label: "Set-up and clear-down", unitLabel: "€150 flat fee" },
  dressing: { label: "Plating and presentation", unitLabel: "€250 flat fee" },
  waste: {
    label: "Food waste management (excluding glass)",
    unitLabel: "€50 flat fee",
    help: "Included by default. Untick only if your venue handles food waste itself.",
  },
};
const CATEGORY_EN: Record<string, string> = {
  "Repas et boissons": "Food and drinks",
  "Vaisselle et linge": "Tableware and linen",
  "Mobilier, matériel et services": "Furniture, equipment and services",
};
const DISH_KIT_EN: Record<DishKit, { name: string; label: string }> = {
  none: { name: "None", label: "None" },
  essentiel: {
    name: "Essential",
    label: "Essential (2 plates, 1 water glass, 1 wine glass, cutlery)",
  },
  complet: {
    name: "Complete",
    label:
      "Complete (3 plates, 1 water glass, 1 wine glass, 1 champagne flute, cutlery)",
  },
  prestige: {
    name: "Prestige",
    label: "Prestige (3 plates, beaded charger plate, 3 glasses, cutlery)",
  },
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
        id: "honorCocktails",
        label: "4 cocktails au choix par personne (vin d’honneur ou cocktail dînatoire)",
        unit: 5,
        unitLabel: "5 €/pers.",
        kind: "toggle",
        basis: (guests) => guests,
        when: (formula, service) => service === "avec-vin" && ["buffet", "plateau", "assiette", "aperitifs"].includes(formula),
      },
      {
        id: "cocktails",
        label: "Cocktails supplémentaires, au-delà des 4 cocktails (1 litre pour environ 4 convives)",
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
        basis: (_guests, _totalGuests, tableGuests) => tableGuests,
      },
      {
        id: "placemats",
        label: "Sous-plat perlé",
        unit: 3,
        unitLabel: "3 €/unité",
        kind: "toggle",
        basis: (_guests, _totalGuests, tableGuests) => tableGuests,
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
  tableGuests: number,
) {
  if (def.kind === "toggle") {
    if (!value) return 0;
    const multiplier = def.basis ? def.basis(guests, totalGuests, tableGuests) : 1;
    return def.unit * multiplier;
  }
  return def.unit * value;
}

// Champ nombre (enfants, prestataires) : « 02 » redevient « 2 ». React ne réécrit pas
// le champ quand la valeur numérique est déjà la bonne, donc on le fait ici.
function countValue(input: HTMLInputElement): number {
  const n = Math.min(1000, Math.max(0, Math.floor(Number(input.value)) || 0));
  if (input.value !== "" && input.value !== String(n)) input.value = String(n);
  return n;
}

export default function PricingCalculator({
  lang = "fr",
}: { lang?: Lang } = {}) {
  const en = lang === "en";
  // Version affichée d'une option (les ids et libellés français restent la donnée envoyée au devis).
  const show = (def: OptionDef): OptionDef =>
    en ? { ...def, ...OPTION_EN[def.id] } : def;
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [mobileBarVisible, setMobileBarVisible] = useState(false);
  const [formula, setFormula] = useState<Formula>("buffet");
  const [guests, setGuests] = useState(MIN_GUESTS.buffet);
  const [service, setService] = useState<Service>("avec-vin");
  const [children, setChildren] = useState(0);
  const [providers, setProviders] = useState(0);
  const [optionValues, setOptionValues] = useState<Record<string, number>>(
    { waste: 1 },
  );
  const [dishKit, setDishKit] = useState<DishKit>("none");
  const [guestError, setGuestError] = useState("");
  const [guestsText, setGuestsText] = useState<string | null>(null);
  const [guestsFocused, setGuestsFocused] = useState(false);
  useEffect(() => {
    const syncFormula = (event: Event) => {
      const next = (event as CustomEvent<Formula>).detail;
      setFormula(next);
      setService(services[next][0].value);
      const nextMin = MIN_GUESTS[next];
      setGuests((current) => (current < nextMin ? nextMin : current));
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
  const tableGuests = isChef ? guests : guests + children;
  const price = useMemo(
    () => unitPrice(formula, service, totalGuests),
    [formula, service, totalGuests],
  );
  const mealTotal = price === null ? null : price * guests;

  const optionLines: Array<{
    id: string;
    label: string;
    shown: string;
    amount: number;
  }> = [];
  if (
    service === "avec-vin" &&
    (formula === "buffet" || formula === "plateau" || formula === "assiette")
  )
    optionLines.push({
      id: "honorWine",
      label: "Vin d’honneur, 10 pièces au choix",
      shown: en
        ? "Cocktail reception, 10 bites of your choice"
        : "Vin d’honneur, 10 pièces au choix",
      amount: guests * HONOR_WINE_SUPPLEMENT,
    });
  if (children && !isChef)
    optionLines.push({
      id: "children",
      label: `${children} repas enfant${children > 1 ? "s" : ""} (${CHILD_PRICE} €/pers.)`,
      shown: en
        ? `${children} ${children > 1 ? "children’s meals" : "child’s meal"} (€${CHILD_PRICE}/guest)`
        : `${children} repas enfant${children > 1 ? "s" : ""} (${CHILD_PRICE} €/pers.)`,
      amount: children * CHILD_PRICE,
    });
  if (providers && !isChef)
    optionLines.push({
      id: "providers",
      label: `${providers} repas prestataire${providers > 1 ? "s" : ""} (${PROVIDER_PRICE} €/pers.)`,
      shown: en
        ? `${providers} vendor meal${providers > 1 ? "s" : ""} (€${PROVIDER_PRICE}/guest)`
        : `${providers} repas prestataire${providers > 1 ? "s" : ""} (${PROVIDER_PRICE} €/pers.)`,
      amount: providers * PROVIDER_PRICE,
    });
  for (const category of isChef ? [] : OPTION_CATEGORIES) {
    for (const def of category.options) {
      if (def.when && !def.when(formula, service)) continue;
      const value = optionValues[def.id] || 0;
      const amount = optionAmount(def, value, guests, totalGuests, tableGuests);
      if (amount <= 0) continue;
      const qtyPart = def.kind === "qty" ? `${value} ${def.qtyLabel} · ` : "";
      // Un forfait affiche déjà son montant à droite : pas de « (50 € le forfait) » en doublon.
      const isFlat = !qtyPart && def.unitLabel.endsWith("le forfait");
      const d = show(def);
      const qtyShown = qtyPart ? `${value} ${d.qtyLabel} · ` : "";
      optionLines.push({
        id: def.id,
        label: isFlat ? def.label : `${def.label} (${qtyPart}${def.unitLabel})`,
        shown: isFlat ? d.label : `${d.label} (${qtyShown}${d.unitLabel})`,
        amount,
      });
    }
  }
  if (dishKit !== "none" && !isChef)
    optionLines.push({
      id: "dishKit",
      label: `Vaisselle ${dishKit} (${tableGuests} kits × ${dishKitPrices[dishKit]} €)`,
      shown: en
        ? `${DISH_KIT_EN[dishKit].name} tableware (${tableGuests} kits × €${dishKitPrices[dishKit]})`
        : `Vaisselle ${dishKit} (${tableGuests} kits × ${dishKitPrices[dishKit]} €)`,
      amount: tableGuests * dishKitPrices[dishKit],
    });

  const optionsTotal = optionLines.reduce((sum, line) => sum + line.amount, 0);
  // « Ajouter des options » ne compte que les vraies options (pas le vin d'honneur, les enfants ni les prestataires)
  const extraLines = optionLines.filter(
    (line) => !["honorWine", "children", "providers"].includes(line.id),
  );
  const extrasTotal = extraLines.reduce((sum, line) => sum + line.amount, 0);
  const estimatedTotal =
    mealTotal === null ? null : mealTotal + optionsTotal;
  const selectedService =
    services[formula].find((item) => item.value === service)?.label || "";
  const serviceShown = (label: string) =>
    en ? SERVICE_EN[label] || label : label;
  const minGuests = MIN_GUESTS[formula];

  function changeFormula(next: Formula) {
    setFormula(next);
    setService(services[next][0].value);
    const nextMin = MIN_GUESTS[next];
    if (guests < nextMin) {
      setGuests(nextMin);
    }
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
    setGuestsText(rawValue);
    if (rawValue.trim() === "") {
      setGuests(0);
      setGuestError("");
      return;
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    if (value > 1000) {
      setGuests(1000);
      setGuestsText("1000");
      setGuestError(
        en
          ? "The calculator’s maximum is 1,000 adults. Beyond that, please contact us."
          : "Le maximum du simulateur est de 1 000 adultes. Au-delà, contactez-nous.",
      );
      return;
    }
    setGuests(Math.max(0, Math.floor(value)));
    setGuestError("");
  }
  function commitGuests() {
    setGuestsFocused(false);
    setGuestsText(null);
    if (guests < 1) setGuests(minGuests);
  }
  // Le minimum porte sur le total des convives (adultes, enfants et
  // prestataires compris), comme indiqué dans la FAQ et le catalogue.
  const belowMin = guests > 0 && totalGuests < minGuests;
  const showBelowMin = belowMin && (!guestsFocused || guests >= 10);
  const minGuestsLabel = en
    ? isChef
      ? `${minGuests} guests`
      : `${minGuests} guests in total`
    : isChef
      ? `${minGuests} convives`
      : `${minGuests} convives au total`;
  const estimate = {
    formulaId: formula,
    formula: formulaNames[formula],
    adults: guests,
    children,
    providers,
    totalGuests,
    serviceId: service,
    service: selectedService,
    options: optionLines.map(({ id, label, amount }) => ({ id, label, amount })),
    optionsTotal,
    total: estimatedTotal,
  };
  // Dès que la personne a touché au simulateur, le formulaire de demande reprend ses chiffres (sans attendre le bouton).
  const estimateKey = JSON.stringify(estimate);
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("cuillere:estimate", { detail: JSON.parse(estimateKey) }),
    );
  }, [estimateKey]);

  function requestQuote(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const choice = formula === "brunch" ? "brunch" : "event";
    const hash =
      choice === "brunch" ? "#formulaire-brunch" : "#formulaire-evenement";
    window.dispatchEvent(
      new CustomEvent("cuillere:quote", { detail: { choice, estimate } }),
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
          <span>{en ? "Personalised estimate" : "Estimation personnalisée"}</span>
          <h3 id="calculator-title">
            {en ? "Calculate the cost of your reception" : "Calculez votre réception"}
          </h3>
        </div>
        <div className="calculator-heading-side">
          <p>
            {en
              ? "Choose your formula and enter your guest numbers for an instant budget estimate."
              : "Choisissez la formule et indiquez vos convives pour obtenir immédiatement un ordre de budget."}
          </p>
          <button
            type="button"
            className="calculator-reset"
            onClick={resetCalculator}
          >
            {en ? "Reset the calculator" : "Réinitialiser la calculette"}
          </button>
        </div>
      </div>
      <div className="calculator-body" ref={bodyRef}>
      <div className="calculator-main">
      <div className="calculator-controls">
        <div className="calculator-controls-row">
          <label>
            <span>{en ? "Your formula" : "Votre formule"}</span>
            <select
              value={formula}
              onChange={(e) => changeFormula(e.target.value as Formula)}
            >
              {en ? (
                <>
                  <option value="buffet">Buffet</option>
                  <option value="plateau">Platter service</option>
                  <option value="assiette">Plated service</option>
                  <option value="aperitifs">Cocktail reception</option>
                  <option value="brunch">Signature Brunch</option>
                  <option value="barbecue">Barbecue Party</option>
                  <option value="chef">Private chef</option>
                </>
              ) : (
                <>
                  <option value="buffet">Buffet</option>
                  <option value="plateau">Plateau</option>
                  <option value="assiette">Service à l’assiette</option>
                  <option value="aperitifs">Apéritifs & vin d’honneur</option>
                  <option value="brunch">Brunch Signature</option>
                  <option value="barbecue">Barbecue Party</option>
                  <option value="chef">Chef à domicile</option>
                </>
              )}
            </select>
          </label>
          {/* Choix utile seulement pour buffet, plateau et assiette (avec ou sans vin d'honneur) */}
          {services[formula].length > 1 ? (
            <label>
              <span>{en ? "Cocktail reception" : "Vin d’honneur"}</span>
              <select
                value={service}
                onChange={(e) => setService(e.target.value as Service)}
              >
                {services[formula].map((item) => (
                  <option key={item.value} value={item.value}>
                    {serviceShown(item.label)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <div className="calculator-controls-row calculator-controls-row--people">
          <label>
            <span>{en ? "Adults" : "Adultes"}</span>
            <input
              type="number"
              min="1"
              max="1000"
              inputMode="numeric"
              value={guestsText ?? guests}
              onChange={(e) => changeGuests(e.target.value)}
              onFocus={() => setGuestsFocused(true)}
              onBlur={commitGuests}
              aria-invalid={Boolean(guestError)}
              aria-describedby="adultes-aide"
            />
            <small
              id="adultes-aide"
              className={
                guestError
                  ? "calculator-field-error"
                  : showBelowMin
                    ? "calculator-field-warning"
                    : "calculator-field-help"
              }
            >
              {guestError ||
                (showBelowMin ? (
                  en ? (
                    <>
                      Fewer than {minGuestsLabel}: please contact us directly
                      on{" "}
                      <a href={BELOW_MIN_WHATSAPP_EN} target="_blank" rel="noreferrer">
                        WhatsApp
                      </a>{" "}
                      or by <a href={BELOW_MIN_MAILTO_EN}>email</a> and we
                      will look into what is possible.
                    </>
                  ) : (
                    <>
                      Moins de {minGuestsLabel} : contactez-nous directement
                      sur{" "}
                      <a href={BELOW_MIN_WHATSAPP} target="_blank" rel="noreferrer">
                        WhatsApp
                      </a>{" "}
                      ou par{" "}
                      <a href={BELOW_MIN_MAILTO}>e-mail</a> pour étudier la
                      possibilité.
                    </>
                  )
                ) : en ? (
                  isChef
                    ? `Between ${minGuests} and 1,000 guests.`
                    : `From ${minGuestsLabel}, children and vendors included.`
                ) : (
                  isChef
                    ? `Entre ${minGuests} et 1 000 convives.`
                    : `Dès ${minGuestsLabel}, enfants et prestataires compris.`
                ))}
            </small>
          </label>
          {!isChef && (
          <label>
            <span>{en ? "Children" : "Enfants"}</span>
            <input
              type="number"
              min="0"
              max="1000"
              inputMode="numeric"
              value={children}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setChildren(countValue(e.target))}
            />
            <small className="calculator-field-help">
              {en
                ? "Meal adapted for ages 5-12 · €25/guest."
                : "Repas adapté aux 5-12 ans · 25 €/personne."}
            </small>
          </label>
          )}
          {!isChef && (
          <label>
            <span>{en ? "Vendors" : "Prestataires"}</span>
            <input
              type="number"
              min="0"
              max="1000"
              inputMode="numeric"
              value={providers}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setProviders(countValue(e.target))}
            />
            <small className="calculator-field-help">
              {en
                ? "Photographer, DJ, videographer… · €30/guest."
                : "Photographe, DJ, vidéaste… · 30 €/personne."}
            </small>
          </label>
          )}
        </div>
      </div>

      {!isChef && (
      <details className="calculator-options-toggle">
        <summary>
          <span>{en ? "Add options" : "Ajouter des options"}</span>
          <small>
            {extraLines.length === 0
              ? en
                ? "Cheese, drinks, tableware, furniture…"
                : "Fromages, boissons, vaisselle, mobilier…"
              : extraLines.length === 1
                ? `${extraLines[0].shown.replace(/ \([^)]*\)\s*$/, "")}${extraLines[0].id === "waste" ? (en ? " — selected by default" : " — sélectionné par défaut") : ""} · ${fmtMoney(extraLines[0].amount, lang)}`
                : `${extraLines.length} ${en ? "options selected" : "options sélectionnées"} · ${fmtMoney(extrasTotal, lang)}`}
          </small>
          <b aria-hidden="true">+</b>
        </summary>
        <div className="calculator-options">
          <div className="calculator-options-intro">
            <ListChecks size={18} />
            <p>
              {en
                ? "Only waste management is included by default; add just the options you need for your reception."
                : "Seule la gestion des déchets est incluse par défaut ; ajoutez uniquement les options utiles à votre réception."}
            </p>
          </div>
          {OPTION_CATEGORIES.map((category) => (
            <div className="calculator-option-group" key={category.title}>
              <h5>{en ? CATEGORY_EN[category.title] : category.title}</h5>
              {category.title === "Vaisselle et linge" && (
                <label className="calculator-option-select">
                  <span>
                    {en
                      ? `Tableware hire (${tableGuests} guests, excluding vendors)`
                      : `Location de vaisselle (${tableGuests} convives, hors prestataires)`}
                  </span>
                  <select
                    value={dishKit}
                    onChange={(e) => setDishKit(e.target.value as DishKit)}
                  >
                    {en ? (
                      <>
                        <option value="none">None</option>
                        <option value="essentiel">Essential — €7/kit</option>
                        <option value="complet">Complete — €10/kit</option>
                        <option value="prestige">Prestige — €13/kit</option>
                      </>
                    ) : (
                      <>
                        <option value="none">Aucune</option>
                        <option value="essentiel">Essentiel — 7 €/kit</option>
                        <option value="complet">Complet — 10 €/kit</option>
                        <option value="prestige">Prestige — 13 €/kit</option>
                      </>
                    )}
                  </select>
                  <small className="calculator-field-help">
                    {en ? DISH_KIT_EN[dishKit].label : dishKitLabels[dishKit]}
                  </small>
                </label>
              )}
              {category.options.filter((def) => !def.when || def.when(formula, service)).map((def) =>
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
                      {show(def).label}{" "}
                      <small>
                        ({show(def).unitLabel}
                        {def.id === "waste"
                          ? en
                            ? " · selected by default"
                            : " · sélectionné par défaut"
                          : ""}
                        )
                      </small>
                      {def.help && (
                        <small className="calculator-field-help">
                          {show(def).help}
                        </small>
                      )}
                    </span>
                  </label>
                ) : (
                  <label className="calculator-option-qty" key={def.id}>
                    <span>
                      {show(def).label} <small>({show(def).unitLabel})</small>
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
                        {show(def).help}
                      </small>
                    )}
                  </label>
                ),
              )}
            </div>
          ))}
          <p className="calculator-option-note">
            {en
              ? "Refrigerated van, photographer, videographer, DJ, decorator and wedding planner: available on quotation, to be discussed directly with us."
              : "Camion frigorifique, photographe, vidéaste, DJ, décorateur et wedding planner : sur devis, à discuter directement avec nous."}
          </p>
        </div>
      </details>
      )}
      {isChef && (
        <p className="calculator-option-note">
          {en
            ? "Tableware, linen and service included. Only travel costs are added."
            : "Vaisselle, nappage et service inclus. Seuls les frais de déplacement s’ajoutent."}
        </p>
      )}

      </div>
      <div className="calculator-summary-sticky" ref={summaryRef}>
      {estimatedTotal !== null && (
        <ul className="calculator-breakdown">
          <li>
            <span>
              {en ? (
                <>
                  {guests} adult{guests > 1 ? "s" : ""} × {isChef ? "from " : ""}
                  €{price}/guest
                </>
              ) : (
                <>
                  {guests} adulte{guests > 1 ? "s" : ""} × {isChef ? "dès " : ""}
                  {price} €/pers.
                </>
              )}
            </span>
            <span>{fmtMoney(mealTotal!, lang)}</span>
          </li>
          {optionLines.map((line) => (
            <li key={line.id}>
              <span>{line.shown}</span>
              <span>{fmtMoney(line.amount, lang)}</span>
            </li>
          ))}
          <li className="calculator-breakdown-total">
            <span>{en ? "Estimate" : "Estimation"}</span>
            <span>{fmtMoney(estimatedTotal, lang)}</span>
          </li>
        </ul>
      )}
      <div className="calculator-initial-result" aria-live="polite">
        <div>
          <span>{en ? "Your reception" : "Votre réception"}</span>
          <strong>{en ? formulaNamesEn[formula] : formulaNames[formula]}</strong>
          <small>
            {totalGuests} {en ? "guests" : "convives"} ·{" "}
            {serviceShown(selectedService)}
          </small>
        </div>
        <div>
          <span>{en ? "Your estimate" : "Votre estimation"}</span>
          <strong>
            {estimatedTotal === null
              ? en
                ? "On quotation"
                : "Sur devis"
              : fmtMoney(estimatedTotal, lang)}
          </strong>
          <small>
            {optionLines.length > 0
              ? en
                ? "Meals and selected options included · excluding travel"
                : "Repas et options sélectionnées inclus · hors déplacement"
              : en
                ? "Specific meals included · excluding options and travel"
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
            {en ? "Save and receive my quote" : "Enregistrer et recevoir mon devis"}{" "}
            <ArrowRight size={17} />
          </a>
          <a className="calculator-secondary-link" href="#carte">
            {en ? "View the dishes" : "Voir les plats"} <ArrowRight size={17} />
          </a>
        </div>
      </div>
      <p className="calculator-disclaimer">
        {en
          ? "Non-binding estimate. Travel and the detailed quote are worked out with you based on your enquiry."
          : "Estimation non contractuelle. Le déplacement et le détail du devis sont calculés avec vous à partir de votre demande."}
      </p>
      </div>
      </div>
      <div
        className={`calculator-mobile-bar${mobileBarVisible ? " is-visible" : ""}`}
        aria-hidden={!mobileBarVisible}
      >
        <span>
          {en ? "Estimate:" : "Estimation :"}{" "}
          <strong>
            {estimatedTotal === null
              ? en
                ? "On quotation"
                : "Sur devis"
              : fmtMoney(estimatedTotal, lang)}
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
          {en ? "Continue" : "Continuer"} <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}
