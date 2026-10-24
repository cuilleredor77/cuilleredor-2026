import {
  ArrowRight,
  ArrowUp,
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react";
import HashScrollFix from "../hash-scroll-fix";
import PricingCalculator from "../pricing-calculator";
import PricingGrids from "../pricing-grids";
import QuoteChooser from "../quote-chooser";
import CatalogueTabs from "../catalogue-tabs";
import FormulaExperience from "../formula-experience";
import LiseuseOverlay from "../liseuse-overlay";
import MenuItemsPreview from "../menu-items-preview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedding & event caterer in Paris and Île-de-France | Cuillère d’Or",
  description: "Plan your reception with Cuillère d’Or: cocktail reception, buffet, platter and plated service, Signature Brunch. 2027-2028 prices and tailored quotes.",
  alternates: { canonical: "/en", languages: { fr: "/", en: "/en" } },
  openGraph: { locale: "en_GB", url: "/en", title: "Wedding & event caterer in Paris and Île-de-France | Cuillère d’Or" },
};

const QUOTE_FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLSdgBezVdjmGFxCTjhBvonBf870csBIy79wLWkPZPq_03I7YUQ/viewform";
const WHATSAPP =
  "https://wa.me/33783748971?text=Hello%20Cuill%C3%A8re%20d%27Or%2C%20I%27d%20like%20to%20talk%20about%20a%20reception.";

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 4v10.2a4.8 4.8 0 1 1-4-4.73" />
      <path d="M15 4c.7 2.2 2.1 3.7 4 4.2" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ResponsiveImage({
  base,
  alt,
  sizes,
  width,
  height,
  loading = "lazy",
}: {
  base: string;
  alt: string;
  sizes: string;
  width: number;
  height: number;
  loading?: "lazy" | "eager";
}) {
  return (
    <img
      src={`${base}-900.webp`}
      srcSet={`${base}-480.webp 480w, ${base}-900.webp 900w, ${base}-1200.webp 1200w`}
      sizes={sizes}
      width={width}
      height={height}
      alt={alt}
      loading={loading}
      decoding="async"
    />
  );
}

function MenuCategory({
  category,
  keyPrefix,
}: {
  category: { title: string; image?: string; alt?: string; items: string[] };
  keyPrefix: string;
}) {
  return (
    // Volet ouvert sur ordinateur ; refermé sur mobile (voir hash-scroll-fix) pour raccourcir la page.
    <details className="formula-menu-category-flat" open>
      <summary><h4>{category.title}</h4></summary>
      <MenuItemsPreview items={category.items} keyPrefix={keyPrefix} en />
    </details>
  );
}

const offers = [
  {
    number: "01",
    title: "Buffet",
    tone: "Generous & sociable",
    image: "/brochettes",
    imageAlt: "Generous buffet prepared by Cuillère d’Or",
    description:
      "A plentiful buffet, regularly replenished, where each guest creates their own plate at their leisure.",
    firstLabel: "Menu",
    firstValue: "2 meats · 2 fish · 4 sides · 1 vegetable",
    secondLabel: "Prices",
    secondValue: "Reduced rates for larger receptions",
    price: "€35 to €45",
    wineNote: "+€5 per guest with a cocktail reception",
    suffix: "/ guest · from 30 guests",
    cta: "Choose the buffet",
  },
  {
    number: "02",
    title: "Platter service",
    tone: "Effortless & comfortable",
    image: "/realisation",
    imageAlt: "Selection of Cuillère d’Or dishes served on platters",
    description:
      "All the variety of our buffet menu, beautifully arranged on sharing platters and brought to your table, so conversations flow uninterrupted.",
    firstLabel: "Menu",
    firstValue: "2 meats · 2 fish · 4 sides · 1 vegetable",
    secondLabel: "Ideal for",
    secondValue: "Elegant receptions with smooth, relaxed table service",
    price: "€40 to €50",
    priceNote: "Reduced rates for larger receptions",
    wineNote: "+€5 per guest with a cocktail reception",
    suffix: "/ guest · from 30 guests",
    cta: "Choose platter service",
  },
  {
    number: "03",
    title: "Plated service",
    tone: "Elegant & refined",
    image: "/assiette-traiteur",
    imageAlt: "Dish plated for a seated dinner",
    description:
      "Every dish is individually plated and served in harmony with the pace of your celebration.",
    firstLabel: "Menu",
    firstValue: "Starter · main course · side · dessert",
    secondLabel: "Ideal for",
    secondValue: "Weddings, gala dinners and formal receptions",
    price: "€60 to €70",
    priceNote: "Reduced rates for larger receptions",
    wineNote: "+€5 per guest with a cocktail reception",
    suffix: "/ guest · from 30 guests",
    cta: "Choose plated service",
  },
  {
    number: "04",
    title: "Canapés & drinks reception",
    tone: "Festive & elegant",
    image: "/hero-bouchee",
    imageAlt: "Cuillère d’Or canapé creation",
    description:
      "Choose ten savoury or sweet creations to begin your celebration. Cocktails are available as an optional extra.",
    firstLabel: "Includes",
    firstValue: "10 savoury or sweet bites of your choice",
    secondLabel: "Ideal for",
    secondValue: "Wedding cocktail receptions, drinks receptions and corporate events",
    price: "€25",
    suffix: "/ guest · from 50 guests",
    cta: "Choose canapés",
  },
  {
    number: "05",
    title: "Signature Brunch",
    tone: "Indulgent & relaxed",
    image: "/brunch/brunch-signature",
    imageAlt: "Cuillère d’Or Signature Brunch",
    description:
      "A complete selection of savoury and sweet favourites, perfect for extending the celebrations and bringing everyone together again.",
    firstLabel: "Includes",
    firstValue:
      "Pastries · pancakes · eggs · drinks · 10 bites of your choice",
    secondLabel: "Ideal for",
    secondValue: "Post-wedding brunches and daytime family celebrations",
    price: "€35",
    suffix: "/ guest · from 50 guests",
    cta: "Choose the brunch",
    href: "#formulaire-brunch",
  },
  {
    number: "06",
    title: "Barbecue Party",
    tone: "Relaxed & festive",
    image: "/poissons-grilles",
    imageAlt: "Cuillère d’Or barbecue grill",
    description:
      "Generous freshly grilled dishes served in a relaxed atmosphere, perfect for sunny days.",
    firstLabel: "Includes",
    firstValue: "Grills · salads · sides",
    secondLabel: "Ideal for",
    secondValue: "Birthdays, family celebrations and gatherings with friends",
    price: "€60",
    suffix: "/ guest · from 30 guests",
    cta: "Choose the barbecue",
  },
  {
    number: "07",
    title: "Private chef at home",
    tone: "Exclusive dining",
    image: "/service",
    imageAlt: "Table service by a Cuillère d’Or private chef",
    description:
      "A fully catered dining experience in the comfort of your home: Chef Huguette takes care of the food, the tableware and the service.",
    firstLabel: "Includes",
    firstValue: "Amuse-bouche · starter · main course · dessert · tableware · service",
    secondLabel: "Ideal for",
    secondValue: "Entertaining at home without having to organise a thing",
    price: "from €95",
    suffix: "/ guest · from 12 guests",
    cta: "Choose a private chef",
  },
];

const offerFormula: Record<string, string> = {
  "01": "buffet",
  "02": "plateau",
  "03": "assiette",
  "04": "aperitifs",
  "05": "brunch",
  "06": "barbecue",
  "07": "chef",
};

// En tête du menu ouvert : la présentation de la formule (autrefois sur la carte)
function OfferRecap({ formula }: { formula: string }) {
  const offer = offers.find((o) => offerFormula[o.number] === formula);
  if (!offer) return null;
  // « Tarifs » rejoint le tarif plutôt que de faire doublon
  const tarifs = offer.secondLabel === "Prices";
  return (
    <div className="offer-recap">
      <p>{offer.description}</p>
      <dl>
        <div>
          <dt>{offer.firstLabel}</dt>
          <dd>{offer.firstValue}</dd>
        </div>
        {tarifs ? null : (
          <div>
            <dt>{offer.secondLabel}</dt>
            <dd>{offer.secondValue}</dd>
          </div>
        )}
        <div>
          <dt>Price</dt>
          <dd>
            {offer.price} {offer.suffix}
            {tarifs ? (
              <>
                <br />
                {offer.secondValue}
              </>
            ) : null}
            {"priceNote" in offer && offer.priceNote ? (
              <>
                <br />
                {offer.priceNote}
              </>
            ) : null}
            {"wineNote" in offer && offer.wineNote ? (
              <>
                <br />
                {offer.wineNote}
              </>
            ) : null}
          </dd>
        </div>
      </dl>
    </div>
  );
}

// Noms repris du catalogue 2027-2028 (même ordre, même orthographe).
const savoury = [
  { name: "Fried plantain", image: "/plantains-480.webp" },
  { name: "Mini burger with pikliz, plantain and chicken", image: "/dishes/burger-pikliz.webp" },
  { name: "Mini salmon burger with aioli sauce", image: "/dishes/burger-saumon.webp" },
  { name: "Mini tomato and tarragon cake with smoked mascarpone", image: "/dishes/mini-cake-tomate.webp" },
  { name: "Sweet potato and king prawn croquette with mango coulis and bird’s eye chilli", image: "/dishes/croquette-gambas.webp" },
  { name: "Salt cod croquette with green curry cream", image: "/dishes/croquette-morue.webp" },
  { name: "Yam croquette with red pepper cream", image: "/dishes/croquette-igname.webp" },
  { name: "Fried plantain with pulled beef and barbecue sauce", image: "/dishes/banane-boeuf.webp" },
  { name: "Turmeric tartlet with mango and guacamole", image: "/dishes/tartelette-curcuma.webp" },
  { name: "Mini beef burger", image: "/dishes/mini-burger.webp" },
  { name: "Mini salmon brioche roll", image: "/dishes/navette-saumon.webp" },
  { name: "Beef or vegetable samosa", image: "/dishes/samoussa.webp" },
  { name: "Chicken spring roll or tuna pastel pastry", image: "/dishes/nems-pastels.webp" },
  { name: "Mini chicken or beef skewer", image: "/dishes/mini-brochettes.webp" },
  { name: "Mini wrap", image: "/dishes/mini-wraps.webp" },
  { name: "Prawn tempura", image: "/dishes/tempuras.webp" },
  { name: "Vegetarian tartlet", image: "/dishes/tartelettes-vegetariennes.webp" },
  { name: "Seared watermelon with cucumber and feta · seasonal", image: "/dishes/pasteque-feta.webp" },
  { name: "Mini quiche Lorraine", image: "/dishes/mini-quiche-lorraine.webp" },
  { name: "Grilled king prawns or chicken tenders", image: "/dishes/gambas-tenders.webp" },
  { name: "Foie gras sphere with hibiscus and coconut · December to March", image: "/dishes/foie-gras-hibiscus.webp" },
  { name: "Tomato and mozzarella skewer", image: "/dishes/tomate-mozzarella.webp" },
];
const sweet = [
  { name: "Molten chocolate cake with whipped cream and cocoa", image: "/dishes/mi-cuit-chocolat.webp" },
  { name: "Reimagined rice pudding with rice pearls and caramel", image: "/dishes/riz-au-lait.webp" },
  { name: "Speculoos tiramisu", image: "/dishes/tiramisu.webp" },
  { name: "Seasonal fruit skewer or dessert verrine", image: "/dishes/fruits-saison.webp" },
  { name: "Classic panko-crusted rice fritter", image: "/dishes/beignets-riz-panko.webp" },
  { name: "Banana panko-crusted rice fritter", image: "/dishes/beignets-banane.webp" },
  { name: "Rustic French apple cake", image: "/dishes/tot-fait-pommes.webp" },
  { name: "Red berry or tropical fruit panna cotta", image: "/dishes/panna-cotta.webp" },
];

const buffetCategories = [
  {
    title: "Meats · choose 2",
    image: "/brochettes-480.webp",
    alt: "Meat skewers prepared by Cuillère d’Or",
    items: ["Beef skewers", "Mutton", "Chargrilled chicken"],
  },
  {
    title: "Fish · choose 2",
    image: "/poissons-grilles-480.webp",
    alt: "Grilled fish prepared by Cuillère d’Or",
    items: [
      "Fried sea bream",
      "Chargrilled pangasius",
      "Fried catfish",
      "Nile perch (capitaine)",
      "Sea bass",
      "Salt cod",
    ],
  },
  {
    title: "Sides · choose 4",
    image: "/plantains-480.webp",
    alt: "Plantains plated by Cuillère d’Or",
    items: [
      "Plantain",
      "White rice, tomato rice, Cantonese-style fried rice or curry rice",
      "Cassava (kwanga)",
      "Fritters",
      "Attiéké (fermented cassava couscous)",
    ],
  },
  {
    title: "Vegetables · choose 1",
    image: "/realisation-480.webp",
    alt: "Assortment of Cuillère d’Or dishes and vegetables",
    items: [
      "Spinach in sauce, with or without smoked fish",
      "Saka-saka / pondu (cassava leaves)",
      "Seasonal vegetables",
    ],
  },
];

const platedCategories = [
  {
    title: "Starters",
    image: "/assiette-traiteur-480.webp",
    alt: "Starter plated by Cuillère d’Or",
    items: [
      "Pan-seared king prawns with smoked carrot tagliatelle",
      "Crab quesadillas with sweetcorn cream and crispy polenta",
      "Plantain with three-pepper sauce and pulled beef",
      "Salmon tartare with mango salsa and guacamole",
      "Soft-boiled egg with mushroom cream, morels and chive oil",
      "Charred avocado with pan-seared king prawns and guacamole cream",
    ],
  },
  {
    title: "Meat main courses",
    image: "/brochettes-480.webp",
    alt: "Meat prepared by Cuillère d’Or",
    items: [
      "Spice-roasted lamb chop",
      "Beef fillet with chimichurri sauce",
      "Honey-glazed duck confit",
      "Cajun-marinated, caramelised lamb shank",
      "Seven-hour slow-cooked spiced beef chuck",
      "Braised chicken supreme with creamy poulette sauce",
      "Herb- and pistachio-crusted rack of veal",
    ],
  },
  {
    title: "Fish main courses",
    image: "/poissons-grilles-480.webp",
    alt: "Fish plated by Cuillère d’Or",
    items: [
      "Salmon fillet with cauliflower and passion fruit, coconut, turmeric and star anise sauce",
      "Sea bream fillet",
      "Red mullet ballotine with roasted vegetables, okra and cauliflower",
      "Pangasius fillet with three-pepper sauce",
    ],
  },
  {
    title: "Side dishes",
    image: "/plantains-480.webp",
    alt: "Cuillère d’Or plantain side",
    items: [
      "Golden turmeric and curry rice",
      "Potato galette",
      "Attiéké with seasonal vegetables",
      "Sweet potato mille-feuille with Madagascan vanilla",
      "Basmati rice with coconut milk, ginger and lemongrass",
      "Potato gratin",
      "Green beans sautéed with butter and parsley",
      "Sautéed seasonal vegetables",
      "Thiéb rice with vegetables",
    ],
  },
  {
    title: "Desserts",
    image: "/dishes/panna-cotta.webp",
    alt: "Cuillère d’Or panna cotta dessert",
    items: [
      "Red berry cheesecake with berry coulis",
      "Red berry or tropical fruit panna cotta",
      "Caramelised French toast brioche, passion fruit, rose whipped cream and pistachios",
    ],
  },
];

const menuSection = (
  name: string,
  categories: Array<{ title: string; items: string[] }>,
) => ({
  "@type": "MenuSection",
  name,
  hasMenuSection: categories.map((category) => ({
    "@type": "MenuSection",
    name: category.title,
    hasMenuItem: category.items.map((item) => ({
      "@type": "MenuItem",
      name: item,
    })),
  })),
});

const MENU_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Menu",
  name: "Cuillère d’Or catering menu 2027-2028",
  inLanguage: "en",
  url: "https://cuilleredor.fr/en#carte",
  provider: { "@type": "FoodEstablishment", name: "Cuillère d’Or" },
  hasMenuSection: [
    menuSection("Buffet and platter service", buffetCategories),
    menuSection("Plated service", platedCategories),
    menuSection("Cocktail reception", [
      { title: "Savoury creations", items: savoury.map((item) => item.name) },
      { title: "Sweet treats", items: sweet.map((item) => item.name) },
    ]),
    menuSection("Signature Brunch", [
      {
        title: "Included for everyone",
        items: [
          "Bread, butter and jams",
          "Mini pastries",
          "Pancakes and toppings",
          "Scrambled or fried eggs",
          "Tea, coffee, hot chocolate, water and fruit juices",
        ],
      },
    ]),
  ],
};

const barbecueCategories = [
  {
    title: "On the menu",
    items: ["Chargrilled meat", "Live fritter-making station", "Your choice of 5 savoury or sweet bites"],
  },
  { title: "Salads", items: ["Pickled vegetables", "Tomato and mozzarella"] },
  {
    title: "From the grill",
    items: [
      "Beef skewer",
      "Chicken skewer",
      "Grilled sea bass",
      "Merguez sausages or chipolatas",
    ],
  },
  { title: "Sides", items: ["Rice", "Plantain", "Bread"] },
];

const chefCategories = [
  {
    title: "Everything is included",
    items: [
      "Amuse-bouche as your guests arrive",
      "Individually plated and served starter, main course and dessert",
      "Elegant table setting: crockery, cutlery and table linen provided, with the table laid by our team",
      "Dedicated front-of-house and kitchen team",
    ],
  },
];

const faqItems = [
  {
    question: "Which package should I choose for my event?",
    answer:
      "Compare our seven packages in the “Packages” section: each one describes its atmosphere and price range. If you are unsure which option is best, message us on WhatsApp and we will recommend the most suitable one based on your guest count and preferred reception style.",
  },
  {
    question: "What is the minimum number of guests?",
    answer:
      "Our services are available for events with at least 30 guests, including adults, children and vendors. A minimum of 50 guests applies to a standalone cocktail reception or Signature Brunch.",
  },
  {
    question: "How do I reserve a date?",
    answer:
      "Send us your enquiry with the date, venue, guest count and preferred package. We will then send you a personalised proposal. Your booking is confirmed upon receipt of the signed quote and the deposit.",
  },
  {
    question: "What are your payment terms?",
    answer: "",
    lines: [
      "Deposit: 30% upon signing the quote",
      "Remaining balance: 70%, due two months before the event",
      "Events taking place in fewer than 60 days: payment in full upon signing",
      "Security deposit: €250, paid with the balance and refunded after the event, unless equipment is damaged, broken or lost (no security deposit for deliveries or collections)",
      "Bank transfer or cash",
    ],
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "All cancellations must be submitted in writing. More than 90 days before the event, amounts already paid are retained. Between 90 and 30 days before the event, 50% of the total amount becomes payable. Less than 30 days before the event, the full amount is payable. If Cuillère d’Or cancels (except in cases of force majeure), you will receive a full refund.",
  },
  {
    question: "What does the cocktail reception include?",
    answer:
      "The cocktail reception includes 10 savoury or sweet bites of your choice and service throughout. Cocktails are optional (€10 per litre, about 4 guests per litre).",
  },
  {
    question: "Can the menu be customised?",
    answer:
      "Yes. We can adapt your menu to allergies, intolerances, special dietary requirements and cultural preferences. Please let us know when you request your quote so that we can suggest suitable alternatives.",
  },
  {
    question: "What is included in the price?",
    answer:
      "Depending on the package: team set-up, preparation of the catering area, presentation of the dishes, service, replenishment, clearing and cleaning of the catering area. Options and travel costs are shown separately in the quote.",
  },
  {
    question: "When should I send the schedule of the day?",
    answer:
      "Ideally four to six weeks before the event: key timings, seating plan if applicable, entertainment, speeches and important moments. Changes can still be made up to two weeks before the event.",
  },
  {
    question: "Do you cater at all types of venues?",
    answer:
      "Yes. We cater at châteaux, estates, reception halls, private venues, gardens, unusual locations and private homes. We check access, available space and the necessary utilities in advance.",
  },
  {
    question: "How are travel expenses calculated?",
    answer:
      "They are calculated from Vert-Saint-Denis at €1.90 per round-trip kilometre (tolls and parking included) and shown on a separate line of the quote. Beyond 250 km, accommodation costs are added, to be agreed with the chef. Events outside Île-de-France and abroad are considered on request.",
  },
  {
    question: "Do you offer bespoke services?",
    answer:
      "Yes. Alongside the buffet, platter service, plated service, canapés and brunch, we offer the Barbecue Party: €60 per guest, grills cooked live, provided the venue allows barbecues. And Private chef at home: from €95 per guest, from 12 guests, with amuse-bouche, starter, main course, dessert, tableware, linen and service included. Travel costs extra. For any special request, ask for a quote.",
  },
  {
    question: "Is there a security deposit or overtime charge?",
    answer:
      "A €250 security deposit is paid with the balance and refunded after the event, unless equipment is damaged, broken or lost. No security deposit for deliveries or collections. Beyond 30 minutes of overtime, €80 per hour or part thereof and per server. The number of guests is fixed 60 days before the event: after that it can only go up.",
  },
  {
    question: "How does a tasting session work?",
    answer:
      "Tastings are by appointment at Chez Lina restaurant in Brunoy. They let you sample a representative selection, refine your menu and talk with the chef. They cost €70 per person, not deductible from the final quote, in shared sessions of 2 to 10 people (1 to 1.5 hours), between 3pm and 6pm or after 9pm. On the menu: the chef’s canapés (5 pieces) followed by the meal of your choice. Free cancellation up to 48 hours before.",
  },
  {
    question: "Can Chez Lina restaurant be hired for a private event?",
    answer:
      "Yes. Chez Lina restaurant (29 rue de Montgeron, Brunoy) and its outdoor area can be hired for any private event, with or without Cuillère d’Or or Chez Lina catering. Private hire is quoted on request. The restaurant is open Tuesday to Friday from 11:45am to 2:45pm and 6:45pm to 11:45pm, Saturday from 11:45am to 11:45pm, and closed on Sundays and Mondays.",
  },
];
const FAQ_VISIBLE_COUNT = 5;

export default function HomeEn() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(MENU_JSON_LD) }}
      />
      <HashScrollFix />
      <FormulaExperience />
      <LiseuseOverlay lang="en" />
      <header className="site-header">
        <a
          className="brand"
          href="#accueil"
          aria-label="Cuillère d’Or - home"
        >
          <img
            src="/logo-cuillere-dor.png?v=2"
            width="711"
            height="209"
            alt="Cuillère d’Or - A taste of paradise"
          />
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#formules">Packages</a>
          <a href="#calculateur">Prices</a>
          <a href="#feuilleter">Catalogue</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact</a>
          <a href="/" hrefLang="fr" lang="fr" className="lang-switch">FR</a>
        </nav>
        <a className="header-cta" href="#calculateur">
          <span className="header-cta-long">Estimate my event</span>
          <span className="header-cta-short">Estimate</span>
        </a>
        <details className="mobile-menu">
          <summary aria-label="Open or close the menu">
            <span className="mobile-menu-open" aria-hidden="true">☰</span>
            <span className="mobile-menu-close" aria-hidden="true">✕</span>
            <span className="mobile-menu-label">Menu</span>
          </summary>
          <nav>
            <a href="#formules">Packages</a>
            <a href="#calculateur">Prices & estimate</a>
            <a href="#feuilleter">Catalogue</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
            <a href="/" hrefLang="fr" lang="fr">Version française</a>
          </nav>
        </details>
      </header>

      <section className="hero" id="accueil">
        <div className="hero-image">
          {/* Mobile : photo verticale pour remplir l’écran sans zoom ; ordinateur : plantains. */}
          <picture>
            <source media="(max-width: 720px)" srcSet="/hero-plating-900.webp 900w, /hero-plating-1200.webp 1200w" sizes="100vw" />
            <ResponsiveImage
              base="/plantains"
              sizes="100vw"
              width={1200}
              height={797}
              alt="Dish plated by Cuillère d’Or"
              loading="eager"
            />
          </picture>
        </div>
        <div className="hero-content">
          <p className="eyebrow">Catering · Catalogue <span className="nowrap">2027 · 2028</span></p>
          <h1>
            <span className="sr-only">
              Event catering in the Paris region —{" "}
            </span>
            Taste as a
            <br />
            <em>signature.</em>
          </h1>
          <p className="hero-copy">
            Wedding, birthday or corporate event: we bring together the menu,
            the service and the thoughtful details that make your celebration
            truly exceptional.
          </p>
          <div className="hero-actions">
            <a className="button button-gold" href="#calculateur">
              Estimate my event <ArrowRight size={17} />
            </a>
          </div>
          <a
            className="hero-awards"
            href="https://www.mariages.net/traiteur-mariage/cuillere-dor--e310106"
            target="_blank"
            rel="noopener"
          >
            <span className="hero-awards-badges">
              <img
                src="/awards/mariages-net-wedding-awards-2025.jpg"
                width={447}
                height={447}
                loading="lazy"
                alt="Mariages.net Wedding Awards 2025"
              />
              <img
                className="round"
                src="/awards/mariages-net-wedding-awards-2026.png"
                width={223}
                height={223}
                loading="lazy"
                alt="Mariages.net Wedding Awards 2026"
              />
            </span>
            <span>Mariages.net award winner <span className="nowrap">2025 &amp; 2026</span></span>
          </a>
          <div className="hero-facts">
            <span>
              <Users size={20} aria-hidden="true" /> From 30 guests
            </span>
            <span>
              <MapPin size={20} aria-hidden="true" /> Paris region, throughout
              France and internationally
            </span>
            <span>
              <Clock3 size={20} aria-hidden="true" /> Online quote
            </span>
          </div>
        </div>
      </section>

      <section className="maison" id="maison">
        <div className="maison-portrait">
          <ResponsiveImage
            base="/huguette"
            sizes="(max-width: 720px) 100vw, 46vw"
            width={900}
            height={506}
            alt="Huguette MVUNDA-KILOLA, founder and chef of Cuillère d’Or"
          />
          <div className="chef-caption">
            <strong>Huguette MVUNDA-KILOLA</strong>
            <span>Founder & chef</span>
          </div>
        </div>
        <div className="maison-copy">
          <p className="eyebrow">The chef behind Cuillère d’Or</p>
          <h2>
            Cuisine that brings people together.
            <br />
            <em>A team that takes care of every detail.</em>
          </h2>
          <p>
            Huguette designs every celebration around your guests, your tastes
            and the flow of your special day. Her team prepares, plates and
            serves each dish with the same dedication, so you can enjoy every
            moment of your event.
          </p>
          <div className="maison-promises">
            <div>
              <strong>Tailor-made</strong>
              <span>A service designed around your celebration</span>
            </div>
            <div>
              <strong>Prepared in Brunoy</strong>
              <span>Carefully crafted recipes from our professional kitchen</span>
            </div>
            <div>
              <strong>With you until the big day</strong>
              <span>One point of contact, from quote to service</span>
            </div>
          </div>
          <div className="maison-awards">
            <div className="maison-awards-badges">
              <img
                src="/awards/mariages-net-wedding-awards-2025.jpg"
                width={447}
                height={447}
                loading="lazy"
                alt="Mariages.net Wedding Awards 2025"
              />
              <img
                className="round"
                src="/awards/mariages-net-wedding-awards-2026.png"
                width={223}
                height={223}
                loading="lazy"
                alt="Mariages.net Wedding Awards 2026"
              />
            </div>
            <p>
              Winner of the Mariages.net Wedding Awards in both 2025
              and 2026.{" "}
              <a
                href="https://www.mariages.net/traiteur-mariage/cuillere-dor--e310106"
                target="_blank"
                rel="noopener"
              >
                Read reviews from our couples on Mariages.net
              </a>
            </p>
          </div>
          <div className="maison-bottom">
            <p className="maison-address">
              <MapPin size={16} /> Professional kitchen · 29 rue de Montgeron, Brunoy
            </p>
            <a href="#devis">
              Get my quote <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      <section className="intro section-pad">
        <div>
          <p className="eyebrow dark">Packages & menus</p>
          <h2>
            How would you like
            <br />
            <em>your guests served?</em>
          </h2>
        </div>
        <div className="intro-copy">
          <p>
            Choose your preferred style of reception and its menu opens just
            below. You can then estimate your event and receive a personalised
            quote by email.
          </p>
        </div>
      </section>

      <section className="offers offers-picker" id="formules">
        {offers.map((offer) => (
          <a
            className="offer-card"
            href="#carte"
            id={offer.number === "05" ? "brunch" : undefined}
            key={offer.number}
            data-select-formula={offerFormula[offer.number]}
            data-formula-target="menu"
            aria-controls="carte"
          >
            <div className="offer-visual">
              <ResponsiveImage
                base={offer.image}
                sizes="(max-width: 720px) 50vw, (max-width: 1050px) 25vw, 15vw"
                width={900}
                height={506}
                alt={offer.imageAlt}
              />
            </div>
            <div className="offer-top">
              <span>{offer.number}</span>
              <span>{offer.tone}</span>
            </div>
            <h3>{offer.title}</h3>
            <div className="offer-price">
              {offer.price} <small>{offer.suffix}</small>
            </div>
            <span className="offer-open" aria-hidden="true">
              See the menu <ArrowRight size={14} />
            </span>
          </a>
        ))}
      </section>

      <section className="catalogue section-pad formula-panel" id="carte">
        <CatalogueTabs
          plats={
            <div className="menu-showcase">
              <div className="formula-menu-list">
                <details id="menu-aperitifs" data-menu-formula="aperitifs">
                  <summary>
                    <span>04</span>
                    <div>
                      <strong>Canapés & drinks reception</strong>
                      <small>
                        10 bites of your choice · savoury or sweet ·
                        cocktails optional
                      </small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <OfferRecap formula="aperitifs" />
                    <p className="formula-menu-note">
                      Choose freely from our 30 creations, all offered at the same
                      price.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#calculateur"
                      data-select-formula="aperitifs"
                    >
                      Estimate my event{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="/liseuse/?lang=en#p=9"
                      data-liseuse="9"
                    >
                      See photos of this menu in the catalogue{" "}
                      <ArrowRight size={14} />
                    </a>
                    <div className="formula-dishes-flat">
                      <div className="formula-menu-categories aperitif-menu-categories">
                        <div className="formula-menu-category-flat"><h4>Savoury creations · {savoury.length} choices</h4>
                            <MenuItemsPreview items={savoury.map((item) => item.name)} keyPrefix="menu-savoury" en wrap />
                          </div>
                        <div className="formula-menu-category-flat"><h4>Sweet treats · {sweet.length} choices</h4>
                            <MenuItemsPreview items={sweet.map((item) => item.name)} keyPrefix="menu-sweet" en wrap />
                          </div>
                      </div>
                    </div>
                    <p className="formula-menu-note menu-season-note">
                      The foie gras sphere is available from December to
                      March.
                    </p>
                  </div>
                </details>
                <details data-menu-formula="plateau">
                  <summary>
                    <span>02</span>
                    <div>
                      <strong>Platter service</strong>
                      <small>
                        2 meats · 2 fish · 4 sides · 1 vegetable
                      </small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <OfferRecap formula="plateau" />
                    <p className="formula-menu-note">
                      The buffet menu, presented on platters and brought to the
                      table.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#calculateur"
                      data-select-formula="plateau"
                    >
                      Estimate my event{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="/liseuse/?lang=en#p=6"
                      data-liseuse="6"
                    >
                      See photos of this menu in the catalogue{" "}
                      <ArrowRight size={14} />
                    </a>
                    <div className="formula-dishes-flat">
                      <div className="formula-menu-categories">
                        {buffetCategories.map((category) => (
                          <MenuCategory
                            key={`plateau-${category.title}`}
                            category={category}
                            keyPrefix="plateau"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
                <details data-menu-formula="assiette">
                  <summary>
                    <span>03</span>
                    <div>
                      <strong>Plated service</strong>
                      <small>
                        Starter · main course · side · dessert
                      </small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <OfferRecap formula="assiette" />
                    <p className="formula-menu-note">
                      Compose a complete meal, plated and served
                      individually.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#calculateur"
                      data-select-formula="assiette"
                    >
                      Estimate my event{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="/liseuse/?lang=en#p=7"
                      data-liseuse="7"
                    >
                      See photos of this menu in the catalogue{" "}
                      <ArrowRight size={14} />
                    </a>
                    <div className="formula-dishes-flat">
                      <div className="formula-menu-categories">
                        {platedCategories.map((category) => (
                          <MenuCategory
                            key={category.title}
                            category={category}
                            keyPrefix="assiette"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
                <details data-menu-formula="buffet">
                  <summary>
                    <span>01</span>
                    <div>
                      <strong>Buffet</strong>
                      <small>
                        2 meats · 2 fish · 4 sides · 1 vegetable
                      </small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <OfferRecap formula="buffet" />
                    <p className="formula-menu-note">
                      Choose from each category to compose your
                      buffet.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#calculateur"
                      data-select-formula="buffet"
                    >
                      Estimate my event{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="/liseuse/?lang=en#p=6"
                      data-liseuse="6"
                    >
                      See photos of this menu in the catalogue{" "}
                      <ArrowRight size={14} />
                    </a>
                    <div className="formula-dishes-flat">
                      <div className="formula-menu-categories">
                        {buffetCategories.map((category) => (
                          <MenuCategory
                            key={`buffet-${category.title}`}
                            category={category}
                            keyPrefix="buffet"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
                <details data-menu-formula="brunch">
                  <summary>
                    <span>05</span>
                    <div>
                      <strong>Signature Brunch</strong>
                      <small>A generous brunch selection plus 10 bites of your choice</small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <OfferRecap formula="brunch" />
                    <a
                      className="formula-choose-cta"
                      href="#calculateur"
                      data-select-formula="brunch"
                    >
                      Estimate my event{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="/liseuse/?lang=en#p=12"
                      data-liseuse="12"
                    >
                      See photos of this menu in the catalogue{" "}
                      <ArrowRight size={14} />
                    </a>
                    <div className="formula-dishes-flat">
                      <div className="formula-menu-categories brunch-menu">
                        <div className="formula-menu-category-flat"><h4>Brunch essentials, included for every guest</h4>
                            <ul>
                              <li>Bread, butter and preserves</li>
                              <li>Mini pastries (croissants, pains au chocolat)</li>
                              <li>Pancakes with toppings of your choice (Nutella, jam, caramel)</li>
                              <li>Scrambled or fried eggs</li>
                              <li>Tea, coffee, hot chocolate, water, orange and apple juice</li>
                              <li>Plus 10 savoury or sweet bites of your choice</li>
                            </ul>
                          </div>
                      </div>
                    </div>
                  </div>
                </details>
                <details data-menu-formula="barbecue">
                  <summary>
                    <span>06</span>
                    <div>
                      <strong>Barbecue Party</strong>
                      <small>
                        Freshly grilled food, prepared live · €60 per guest
                      </small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <OfferRecap formula="barbecue" />
                    <p className="formula-menu-note">
                      A relaxed and festive way to celebrate outdoors. Food is
                      grilled live and guests help themselves. The venue must
                      permit barbecues.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#calculateur"
                      data-select-formula="barbecue"
                    >
                      Estimate my event{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="/liseuse/?lang=en#p=14"
                      data-liseuse="14"
                    >
                      See photos of this menu in the catalogue{" "}
                      <ArrowRight size={14} />
                    </a>
                    <div className="formula-dishes-flat">
                      <div className="formula-menu-categories">
                        {barbecueCategories.map((category) => (
                          <MenuCategory
                            key={`bbq-${category.title}`}
                            category={category}
                            keyPrefix="bbq"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
                <details data-menu-formula="chef">
                  <summary>
                    <span>07</span>
                    <div>
                      <strong>Private chef at home</strong>
                      <small>A complete dining experience at home · from €95 per guest</small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <OfferRecap formula="chef" />
                    <p className="formula-menu-note">
                      The sophistication of a fine restaurant or luxury hotel at
                      your own table, table linen included. From 12 guests,
                      excluding travel expenses.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#calculateur"
                      data-select-formula="chef"
                    >
                      Estimate my event{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="/liseuse/?lang=en#p=15"
                      data-liseuse="15"
                    >
                      See photos of this menu in the catalogue{" "}
                      <ArrowRight size={14} />
                    </a>
                    <div className="formula-dishes-flat">
                      <div className="formula-menu-categories">
                        {chefCategories.map((category) => (
                          <MenuCategory
                            key={`chef-${category.title}`}
                            category={category}
                            keyPrefix="chef"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          }
        />
      </section>

      <section className="pricing section-pad" id="tarifs">
        <div className="pricing-heading">
          <p className="eyebrow dark">Estimate your event</p>
          <p className="pricing-help">
            <Phone size={17} aria-hidden="true" />
            <span>
              Can’t decide between two packages? Call us on{" "}
              <a href="tel:+33783748971">+33 7 83 74 89 71</a>.
            </span>
          </p>
        </div>
        <PricingCalculator lang="en" />
        <PricingGrids lang="en" />
        <div className="quote-inline" id="devis">
          <QuoteChooser formUrl={QUOTE_FORM} lang="en" />
        </div>
      </section>

      <section className="catalogue-preview section-pad" id="feuilleter">
        <div className="catalogue-preview-copy">
          <p className="eyebrow dark">Catalogue 2027-2028</p>
          <h2>
            Explore our
            <br />
            <em>catalogue.</em>
          </h2>
          <p>
            Discover all our services, page by page: dishes, pricing,
            optional extras and terms. Select your favourite dishes, then
            download the full catalogue or your selection as a PDF.
          </p>
          <div className="catalogue-preview-actions">
            <a className="button button-gold" href="https://catalogue.cuilleredor.fr/?lang=en" target="_blank" rel="noreferrer">
              Browse the catalogue <ArrowRight size={17} />
            </a>
            <a
              className="button button-dark"
              href="/catalogue/Cuillere-dOr-Catalogue-2027-2028-EN.pdf?v=20"
              download
            >
              Download the PDF
            </a>
          </div>
          <p className="catalogue-preview-note">
            <a href="https://catalogue.cuilleredor.fr/?lang=en" target="_blank" rel="noreferrer">Choose my dishes online</a>
            {" · "}
            <a href="/catalogue/Cuillere-dOr-Catalogue-2027-2028-FR.pdf?v=20" download>French PDF</a>
            {" · "}
            <a href="/catalogue/Cuillere-dOr-Catalogue-2027-2028-EN-HD-print.pdf?v=20" download>High resolution for printing (18 MB)</a>
          </p>
        </div>
        <a
          className="catalogue-cover-button"
          id="liseuse"
          href="https://catalogue.cuilleredor.fr/?lang=en"
          target="_blank"
          rel="noreferrer"
          aria-label="Browse the catalogue"
        >
          <img
            src="/catalogue-apercu-couverture.webp"
            width="911"
            height="1287"
            alt="Cover of the Cuillère d’Or 2027-2028 catalogue"
            loading="lazy"
            decoding="async"
          />
          <span>
            Browse <ArrowRight size={15} />
          </span>
        </a>
      </section>

      <section className="faq section-pad" id="faq" aria-labelledby="faq-title">
        <div className="faq-heading">
          <div>
            <p className="eyebrow dark">Frequently asked questions</p>
            <h2 id="faq-title">
              Everything you need to know
              <br />
              <em>before your event.</em>
            </h2>
          </div>
          <div>
            <p>
              Packages, bookings, planning and tasting sessions: find the
              essential answers to help you prepare for your celebration with
              confidence.
            </p>
            <a className="faq-ask" href={WHATSAPP} target="_blank" rel="noreferrer">
              <span className="faq-ask-question">Still have a question?</span>{" "}
              <span className="faq-ask-cta">
                <span>Message us on WhatsApp</span> <ArrowRight size={15} />
              </span>
            </a>
          </div>
        </div>
        <div className="faq-list">
          {faqItems.slice(0, FAQ_VISIBLE_COUNT).map((item, index) => (
            <details key={item.question}>
              <summary>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item.question}
              </summary>
              {item.lines ? (
                <ul>
                  {item.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p>{item.answer}</p>
              )}
            </details>
          ))}
          <details className="faq-more">
            <summary>
              <span aria-hidden="true" />
              See the other {faqItems.length - FAQ_VISIBLE_COUNT} questions
            </summary>
            <div className="faq-more-list">
              {faqItems.slice(FAQ_VISIBLE_COUNT).map((item, index) => (
                <details key={item.question}>
                  <summary>
                    <span>
                      {String(index + 1 + FAQ_VISIBLE_COUNT).padStart(2, "0")}
                    </span>
                    {item.question}
                  </summary>
                  {item.lines ? (
                    <ul>
                      {item.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{item.answer}</p>
                  )}
                </details>
              ))}
            </div>
          </details>
        </div>
      </section>

      <section className="contact" id="contact">
        <div>
          <p className="eyebrow dark">A question before you decide?</p>
          <h2>
            We’re here
            <br />
            <em>to help.</em>
          </h2>
          <p>
            Questions about our packages, your venue or planning? Message us
            on WhatsApp. Already know what you need? Request your quote
            directly.
          </p>
          <div className="contact-actions">
            <a className="button button-gold" href="#devis">
              Get my quote <ArrowRight size={17} />
            </a>
            <a
              className="button button-dark"
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={17} /> Ask a question
            </a>
          </div>
        </div>
        <address>
          <a href="tel:+33783748971">
            <Phone size={19} /> +33 7 83 74 89 71
          </a>
          <a href="mailto:contact@cuilleredor.fr">
            <Mail size={19} /> contact@cuilleredor.fr
          </a>
          <span>
            <MapPin size={19} />
            <span>
              <small>Correspondence address</small>8 allée des Bois, 77240
              Vert-Saint-Denis, France
            </span>
          </span>
          <p className="contact-delay">Response within 48 hours, quotes included.</p>
        </address>
      </section>

      {/* Mobile : barre de contact toujours visible (remplace la flèche « remonter »). */}
      <nav className="mobile-contact-bar" aria-label="Contact Cuillère d’Or">
        <a href="#calculateur" className="primary">Estimate</a>
        <a href="https://wa.me/33783748971" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href="tel:+33783748971">Call</a>
      </nav>

      <div className="floating-actions" aria-label="Quick actions">
        <a
          className="back-to-top"
          href="#accueil"
          aria-label="Back to the top of the page"
          title="Back to top"
        >
          <ArrowUp size={20} />
        </a>
      </div>

      <footer>
        <div className="footer-brand">
          <strong>Cuillère d’Or</strong>
          <p>Catering service &amp; professional kitchen in Brunoy.</p>
          <small>
            Huguette MVUNDA-KILOLA · Sole proprietor · SIREN 889 933 800
          </small>
        </div>
        <div className="footer-action">
          <span>Your celebration starts here</span>
          <a href="#devis">
            Get my quote <ArrowRight size={16} />
          </a>
          <nav className="footer-legal" aria-label="Legal information">
            <a href="/catalogue/Cuillere-dOr-Catalogue-2027-2028-EN.pdf?v=20">Catalogue PDF</a>
            <a href="/en/legal-notice">Legal notice</a>
            <a href="/en/privacy-policy">Privacy policy</a>
            <a href="/" hrefLang="fr" lang="fr">Version française</a>
          </nav>
        </div>
        <nav className="footer-socials" aria-label="Social media and contact">
          <a
            href="https://www.instagram.com/cuillere.dor/"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Cuillère d’Or on Instagram, opens in a new tab"
          >
            <InstagramIcon />
            <span>Instagram</span>
            <ExternalLink size={14} />
          </a>
          <a
            href="https://www.tiktok.com/@cuillere.dor"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Cuillère d’Or on TikTok, opens in a new tab"
          >
            <TikTokIcon />
            <span>TikTok</span>
            <ExternalLink size={14} />
          </a>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer"
            aria-label="Contact Cuillère d’Or on WhatsApp, opens in a new tab"
          >
            <MessageCircle size={18} />
            <span>WhatsApp</span>
            <ExternalLink size={14} />
          </a>
        </nav>
        <p className="footer-copy">
          © 2026 CUILLÈRE D’OR · CULINARY EXCELLENCE.
        </p>
      </footer>
    </main>
  );
}
