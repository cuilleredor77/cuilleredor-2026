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
import HashScrollFix from "./hash-scroll-fix";
import PricingCalculator from "./pricing-calculator";
import PricingGrids from "./pricing-grids";
import QuoteChooser from "./quote-chooser";
import CatalogueTabs from "./catalogue-tabs";
import FormulaExperience from "./formula-experience";

const QUOTE_FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLSdgBezVdjmGFxCTjhBvonBf870csBIy79wLWkPZPq_03I7YUQ/viewform";
const WHATSAPP =
  "https://wa.me/33783748971?text=Bonjour%20Cuill%C3%A8re%20d%27Or%2C%20je%20souhaite%20%C3%A9changer%20au%20sujet%20d%27une%20r%C3%A9ception.";

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
    <div className="formula-menu-category-flat">
      <h4>{category.title}</h4>
      <ul>
        {category.items.map((item) => (
          <li key={`${keyPrefix}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const offers = [
  {
    number: "01",
    title: "Buffet",
    tone: "Convivial & généreux",
    image: "/brochettes",
    imageAlt: "Buffet généreux préparé par Cuillère d’Or",
    description:
      "Une table abondante et réapprovisionnée, où chacun compose son assiette à son rythme.",
    firstLabel: "Composition",
    firstValue: "2 viandes · 2 poissons · 4 accompagnements · 1 légume",
    secondLabel: "Tarifs",
    secondValue: "Tarifs dégressifs pour les grandes réceptions",
    price: "35 à 45 €",
    wineNote: "+5 € par personne avec vin d’honneur",
    suffix: "/ personne · dès 30 convives",
    cta: "Choisir le buffet",
  },
  {
    number: "02",
    title: "Plateau",
    tone: "Fluide & confortable",
    image: "/realisation",
    imageAlt: "Sélection de plats Cuillère d’Or présentée sur plateaux",
    description:
      "Le menu du buffet, présenté sur plateaux et apporté à table, sans interrompre les échanges entre convives.",
    firstLabel: "Composition",
    firstValue: "2 viandes · 2 poissons · 4 accompagnements · 1 légume",
    secondLabel: "Idéal pour",
    secondValue: "Réception élégante avec un service fluide",
    price: "40 à 50 €",
    wineNote: "+5 € par personne avec vin d’honneur",
    suffix: "/ personne · dès 30 convives",
    cta: "Choisir le plateau",
  },
  {
    number: "03",
    title: "À l’assiette",
    tone: "Élégant & raffiné",
    image: "/assiette-traiteur",
    imageAlt: "Plat dressé pour un service à l’assiette",
    description:
      "Chaque assiette est dressée et servie individuellement, au rythme de votre réception.",
    firstLabel: "Composition",
    firstValue: "Entrée · plat · garniture · dessert",
    secondLabel: "Idéal pour",
    secondValue: "Mariage, dîner de gala et réception formelle",
    price: "60 à 70 €",
    wineNote: "+5 € par personne avec vin d’honneur",
    suffix: "/ personne · dès 30 convives",
    cta: "Choisir le service à l’assiette",
  },
  {
    number: "04",
    title: "Apéritifs",
    tone: "Cocktail",
    image: "/hero-bouchee",
    imageAlt: "Création apéritive Cuillère d’Or",
    description:
      "Dix pièces salées ou sucrées au choix pour ouvrir votre réception. Cocktails en option.",
    firstLabel: "Comprend",
    firstValue: "10 pièces salées ou sucrées au choix",
    secondLabel: "Idéal pour",
    secondValue: "Vin d’honneur, cocktail et événement d’entreprise",
    price: "25 €",
    suffix: "/ personne · dès 50 convives",
    cta: "Choisir les apéritifs",
  },
  {
    number: "05",
    title: "Brunch Signature",
    tone: "Généreux & convivial",
    image: "/brunch/brunch-signature",
    imageAlt: "Brunch Signature Cuillère d’Or",
    description:
      "Une formule complète, salée et sucrée, pour prolonger les retrouvailles en toute simplicité.",
    firstLabel: "Comprend",
    firstValue:
      "Viennoiseries · pancakes · œufs · boissons · 10 pièces au choix",
    secondLabel: "Idéal pour",
    secondValue: "Lendemains de mariage et réceptions familiales en journée",
    price: "35 €",
    suffix: "/ personne · dès 50 convives",
    cta: "Choisir le brunch",
    href: "#formulaire-brunch",
  },
  {
    number: "06",
    title: "Barbecue Party",
    tone: "Convivial & festif",
    image: "/poissons-grilles",
    imageAlt: "Grillades de barbecue Cuillère d’Or",
    description:
      "Des grillades généreuses cuites en direct, dans une ambiance décontractée, pour les beaux jours.",
    firstLabel: "Comprend",
    firstValue: "Grillades · salades · accompagnements",
    secondLabel: "Idéal pour",
    secondValue: "Anniversaires, fêtes de famille, repas entre amis",
    price: "60 €",
    suffix: "/ personne · dès 30 convives",
    cta: "Choisir le barbecue",
  },
  {
    number: "07",
    title: "Chef à domicile",
    tone: "Haut de gamme",
    image: "/service",
    imageAlt: "Service à table pour un chef à domicile Cuillère d’Or",
    description:
      "Une offre clé en main chez vous : la cheffe Huguette apporte la cuisine, la vaisselle et le service.",
    firstLabel: "Comprend",
    firstValue: "Amuse-bouche · entrée · plat · dessert · vaisselle · service",
    secondLabel: "Idéal pour",
    secondValue: "Réception chez vous, sans rien à organiser",
    price: "dès 95 €",
    suffix: "/ personne · dès 20 couverts",
    cta: "Choisir le chef à domicile",
  },
];

// Noms repris du catalogue 2027-2028 (même ordre, même orthographe).
const savoury = [
  { name: "Plantain frit", image: "/plantains-480.webp" },
  { name: "Mini-burger pikliz, plantain et poulet", image: "/dishes/burger-pikliz.webp" },
  { name: "Mini-burger au saumon, sauce aïoli", image: "/dishes/burger-saumon.webp" },
  { name: "Mini-cake tomate et estragon, mascarpone fumé", image: "/dishes/mini-cake-tomate.webp" },
  { name: "Croquette de patate douce, gambas, coulis mangue, piment d’oiseau", image: "/dishes/croquette-gambas.webp" },
  { name: "Croquette de morue, crème de curry vert", image: "/dishes/croquette-morue.webp" },
  { name: "Croquette d’igname, crème de poivron rouge", image: "/dishes/croquette-igname.webp" },
  { name: "Banane frite, effiloché de bœuf, sauce barbecue", image: "/dishes/banane-boeuf.webp" },
  { name: "Tartelette au curcuma, mangue, guacamole", image: "/dishes/tartelette-curcuma.webp" },
  { name: "Mini-burger au bœuf", image: "/dishes/mini-burger.webp" },
  { name: "Navette au saumon", image: "/dishes/navette-saumon.webp" },
  { name: "Samoussa au bœuf ou aux légumes", image: "/dishes/samoussa.webp" },
  { name: "Nem au poulet ou pastel au thon", image: "/dishes/nems-pastels.webp" },
  { name: "Mini-brochette de poulet ou de bœuf", image: "/dishes/mini-brochettes.webp" },
  { name: "Mini-wrap", image: "/dishes/mini-wraps.webp" },
  { name: "Tempura de crevettes", image: "/dishes/tempuras.webp" },
  { name: "Tartelette végétarienne", image: "/dishes/tartelettes-vegetariennes.webp" },
  { name: "Pastèque braisée, concombre et feta · selon la saison", image: "/dishes/pasteque-feta.webp" },
  { name: "Mini-quiche lorraine", image: "/dishes/mini-quiche-lorraine.webp" },
  { name: "Gambas grillées ou tenders de poulet", image: "/dishes/gambas-tenders.webp" },
  { name: "Sphère de foie gras, hibiscus et coco · décembre à mars", image: "/dishes/foie-gras-hibiscus.webp" },
  { name: "Brochette tomate-mozzarella", image: "/dishes/tomate-mozzarella.webp" },
];
const sweet = [
  { name: "Mi-cuit au chocolat, crème fouettée et cacao", image: "/dishes/mi-cuit-chocolat.webp" },
  { name: "Riz au lait revisité, perles de riz et caramel", image: "/dishes/riz-au-lait.webp" },
  { name: "Tiramisu au spéculoos", image: "/dishes/tiramisu.webp" },
  { name: "Brochette ou verrine de fruits de saison", image: "/dishes/fruits-saison.webp" },
  { name: "Beignet de riz pané au panko, classique", image: "/dishes/beignets-riz-panko.webp" },
  { name: "Beignet de riz pané au panko, à la banane", image: "/dishes/beignets-banane.webp" },
  { name: "Gâteau tôt-fait aux pommes", image: "/dishes/tot-fait-pommes.webp" },
  { name: "Panna cotta aux fruits rouges ou exotiques", image: "/dishes/panna-cotta.webp" },
];

const buffetCategories = [
  {
    title: "Viandes · choisissez-en 2",
    image: "/brochettes-480.webp",
    alt: "Brochettes de viande préparées par Cuillère d’Or",
    items: ["Brochettes de bœuf", "Mouton", "Poulet braisé"],
  },
  {
    title: "Poissons · choisissez-en 2",
    image: "/poissons-grilles-480.webp",
    alt: "Poissons grillés préparés par Cuillère d’Or",
    items: [
      "Dorade frite",
      "Panga braisé",
      "Poisson-chat frit",
      "Capitaine",
      "Bar",
      "Morue",
    ],
  },
  {
    title: "Accompagnements · choisissez-en 4",
    image: "/plantains-480.webp",
    alt: "Bananes plantains dressées par Cuillère d’Or",
    items: [
      "Banane plantain",
      "Riz blanc, riz rouge à la tomate, riz cantonais ou riz au curry",
      "Manioc (kwanga)",
      "Beignet",
      "Attiéké",
    ],
  },
  {
    title: "Légumes · choisissez-en 1",
    image: "/realisation-480.webp",
    alt: "Assortiment de mets et légumes Cuillère d’Or",
    items: [
      "Épinards en sauce, avec ou sans poisson fumé",
      "Saka-saka / pondu",
      "Légumes de saison",
    ],
  },
];

const platedCategories = [
  {
    title: "Entrées",
    image: "/assiette-traiteur-480.webp",
    alt: "Entrée dressée à l’assiette par Cuillère d’Or",
    items: [
      "Gambas poêlées, tagliatelles de carotte fumée",
      "Quesadillas au crabe, crème de maïs et polenta croustillante",
      "Banane plantain, sauce trois poivrons, effiloché de bœuf",
      "Tartare de saumon, salsa mangue et guacamole",
      "Œuf mollet, crème de champignons, morilles et huile de ciboulette",
      "Avocat brûlé, gambas poêlées et crème de guacamole",
    ],
  },
  {
    title: "Viandes",
    image: "/brochettes-480.webp",
    alt: "Viande préparée par Cuillère d’Or",
    items: [
      "Côte d’agneau rôtie aux épices",
      "Filet de bœuf, sauce chimichurri",
      "Confit de canard laqué au miel",
      "Souris d’agneau marinée au cajun et caramélisée",
      "Paleron de bœuf aux épices, cuit 7 heures",
      "Suprême de volaille braisé, sauce poulette",
      "Carré de veau en croûte d’herbes et pistaches",
    ],
  },
  {
    title: "Poissons",
    image: "/poissons-grilles-480.webp",
    alt: "Poisson dressé par Cuillère d’Or",
    items: [
      "Pavé de saumon, chou-fleur et passion, sauce coco-curcuma-badiane",
      "Filet de dorade",
      "Ballotine de rouget, légumes rôtis, gombo et chou-fleur",
      "Filet de panga, sauce aux trois poivrons",
    ],
  },
  {
    title: "Garnitures",
    image: "/plantains-480.webp",
    alt: "Garniture de bananes plantains Cuillère d’Or",
    items: [
      "Riz jaune au curcuma et curry",
      "Galette de pommes de terre",
      "Attiéké aux petits légumes de saison",
      "Millefeuille de patates douces à la vanille de Madagascar",
      "Riz basmati au lait de coco, gingembre et citronnelle",
      "Gratin de pommes de terre",
      "Haricots verts sautés au beurre et persil",
      "Poêlée de légumes",
      "Riz thiéb et ses légumes",
    ],
  },
  {
    title: "Desserts",
    image: "/dishes/panna-cotta.webp",
    alt: "Dessert panna cotta Cuillère d’Or",
    items: [
      "Cheesecake aux fruits rouges et son coulis",
      "Panna cotta aux fruits rouges ou exotiques",
      "Brioche perdue caramélisée, passion, crème montée à la rose et pistaches",
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
  name: "Carte traiteur Cuillère d’Or 2027-2028",
  inLanguage: "fr",
  url: "https://cuilleredor.fr/#carte",
  provider: { "@type": "FoodEstablishment", name: "Cuillère d’Or" },
  hasMenuSection: [
    menuSection("Buffet et plateau", buffetCategories),
    menuSection("Service à l’assiette", platedCategories),
    menuSection("Cocktail dînatoire et vin d’honneur", [
      { title: "Créations salées", items: savoury.map((item) => item.name) },
      { title: "Douceurs sucrées", items: sweet.map((item) => item.name) },
    ]),
    menuSection("Brunch Signature", [
      {
        title: "Base commune",
        items: [
          "Pain, beurre et confitures",
          "Mini viennoiseries",
          "Pancakes et toppings",
          "Œufs brouillés ou au plat",
          "Thé, café, chocolat chaud, eaux et jus de fruits",
        ],
      },
    ]),
  ],
};

const barbecueCategories = [
  {
    title: "Au programme",
    items: ["Viande braisée", "Animation beignets", "5 pièces salées ou sucrées à grignoter au choix"],
  },
  { title: "Salades", items: ["Pickles", "Tomate-mozzarella"] },
  {
    title: "Grillades",
    items: [
      "Brochette de bœuf",
      "Brochette de poulet",
      "Bar braisé",
      "Merguez ou chipolata",
    ],
  },
  { title: "Accompagnements", items: ["Riz", "Banane plantain", "Pain"] },
];

const chefCategories = [
  {
    title: "Tout est compris",
    items: [
      "Amuse-bouche à l’arrivée de vos invités",
      "Entrée, plat et dessert dressés et servis à l’assiette",
      "Art de la table : vaisselle, couverts et nappage fournis, table dressée par nos soins",
      "Service inclus : une équipe en salle comme en cuisine",
    ],
  },
];

const faqItems = [
  {
    question: "Quelle formule choisir pour mon événement ?",
    answer:
      "Comparez les 7 formules dans la section « Nos formules » : chacune précise son ambiance et son budget. Si vous hésitez entre deux options, écrivez-nous sur WhatsApp. Nous vous conseillerons selon le nombre de convives et le style de votre réception.",
  },
  {
    question: "À partir de combien de convives intervenez-vous ?",
    answer:
      "Nos prestations sont accessibles à partir de 30 convives, adultes, enfants et prestataires compris (50 convives minimum pour le vin d’honneur et le Brunch Signature seuls).",
  },
  {
    question: "Comment réserver une date ?",
    answer:
      "Envoyez votre demande avec la date, le lieu, le nombre de convives et la formule souhaitée. Vous recevez ensuite une proposition personnalisée. La date devient définitive à réception du devis signé et de l’acompte.",
  },
  {
    question: "Quelles sont les conditions de paiement ?",
    answer: "",
    lines: [
      "Acompte : 30 % à la signature du devis",
      "Solde : 70 % deux mois avant l’événement",
      "Événement dans moins de 60 jours : règlement intégral à la signature",
      "Caution : 250 €, versée avec le solde et restituée après l’événement, sauf dommage, casse ou perte de matériel",
      "Virement bancaire ou espèces",
    ],
  },
  {
    question: "Quelle est la politique d’annulation ?",
    answer:
      "Toute annulation doit être formulée par écrit. Plus de 90 jours avant l’événement, les sommes versées restent acquises. Entre 90 et 30 jours, 50 % du montant total est dû. À moins de 30 jours, la totalité de la prestation est due. Si l’annulation vient de Cuillère d’Or (hors force majeure), vous êtes intégralement remboursé.",
  },
  {
    question: "Que comprend le vin d’honneur ?",
    answer:
      "Le vin d’honneur comprend 10 pièces cocktail salées ou sucrées au choix et le service pendant toute sa durée. Les cocktails sont en option (10 € le litre, environ 4 convives par litre).",
  },
  {
    question: "Le menu peut-il être personnalisé ?",
    answer:
      "Oui. Nous adaptons votre sélection aux allergies, intolérances, régimes spécifiques et préférences culturelles. Signalez ces besoins dès la demande de devis afin que nous puissions vous proposer les alternatives adaptées.",
  },
  {
    question: "Qu’est-ce qui est inclus dans le prix ?",
    answer:
      "Selon la formule retenue : installation de l’équipe, mise en place de l’espace traiteur, présentation des plats, service, réapprovisionnement, débarrassage et nettoyage de l’espace traiteur. Les options et frais de déplacement sont indiqués séparément dans le devis.",
  },
  {
    question: "Quand transmettre le déroulé de l’événement ?",
    answer:
      "Idéalement 4 à 6 semaines avant la réception : horaires clés, plan de table si nécessaire, animations, discours et temps forts. Des ajustements restent possibles jusqu’à deux semaines avant l’événement.",
  },
  {
    question: "Intervenez-vous dans tous les types de lieux ?",
    answer:
      "Oui : châteaux, domaines, salles, espaces privatisés, jardins, lieux atypiques et domiciles. Nous vérifions en amont l’accès, l’espace disponible et les raccordements nécessaires.",
  },
  {
    question: "Comment sont calculés les frais de déplacement ?",
    answer:
      "Ils sont calculés au départ de Vert-Saint-Denis, sur la base de 1,90 € par kilomètre aller-retour (péages et stationnement compris), puis présentés sur une ligne distincte du devis. Au-delà de 250 km, des frais de logement s’ajoutent, à définir avec la cheffe. Les prestations hors Île-de-France et à l’international sont étudiées sur demande.",
  },
  {
    question: "Proposez-vous d’autres formules (Barbecue Party, Chef à domicile) ?",
    answer:
      "Oui. Barbecue Party : 60 € par personne, grillades cuites en direct, à condition que le lieu autorise les barbecues. Chef à domicile : dès 95 € par personne, dès 20 couverts, amuse-bouche, entrée, plat, dessert, vaisselle, nappage et service inclus. Frais de déplacement en sus. Demandez votre devis pour ces formules.",
  },
  {
    question: "Y a-t-il une caution et des frais de dépassement ?",
    answer:
      "Une caution de 250 € est versée avec le solde, puis restituée après l’événement, sauf dommage, casse ou perte de matériel. Au-delà de 30 minutes de dépassement, 80 € par heure entamée et par serveur. Le nombre de convives est figé 60 jours avant l’événement : il ne peut ensuite qu’augmenter.",
  },
  {
    question: "Comment se déroule une dégustation ?",
    answer:
      "La dégustation se réserve sur rendez-vous au restaurant Chez Lina, à Brunoy, et permet de goûter une sélection représentative, d’affiner le menu et d’échanger avec la cheffe. Elle est proposée à 70 € par personne, non déductible du devis final, en session partagée de 2 à 10 personnes (1 h à 1 h 30), entre 15 h et 18 h ou après 21 h. Au menu : apéritif de la cheffe (5 pièces) puis repas de votre choix. Annulation possible jusqu’à 48 h avant.",
  },
  {
    question: "Peut-on privatiser le restaurant Chez Lina ?",
    answer:
      "Oui. Le restaurant Chez Lina (29 rue de Montgeron, Brunoy) et son extérieur se louent pour tout événement privé, avec ou sans prestation Cuillère d’Or ou Chez Lina. La privatisation se fait sur devis. Le restaurant est ouvert du mardi au vendredi de 11 h 45 à 14 h 45 et de 18 h 45 à 23 h 45, le samedi de 11 h 45 à 23 h 45 sans interruption, et fermé le dimanche et le lundi.",
  },
];
const FAQ_VISIBLE_COUNT = 5;

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(MENU_JSON_LD) }}
      />
      <HashScrollFix />
      <FormulaExperience />
      <header className="site-header">
        <a
          className="brand"
          href="#accueil"
          aria-label="Cuillère d'Or - accueil"
        >
          <img
            src="/logo-cuillere-dor.png"
            width="739"
            height="209"
            alt="Cuillère d'Or - Le paradis du goût"
          />
        </a>
        <nav className="desktop-nav" aria-label="Navigation principale">
          <a href="#formules">Nos formules</a>
          <a href="#carte">La carte</a>
          <a href="#tarifs">Tarifs</a>
          <a href="#feuilleter">Catalogue</a>
        </nav>
        <a className="header-cta" href="#calculateur">
          <span className="header-cta-long">Estimer ma réception</span>
          <span className="header-cta-short">Estimer</span>
        </a>
        <details className="mobile-menu">
          <summary aria-label="Ouvrir le menu">
            <span aria-hidden="true">☰</span>
            <span className="mobile-menu-label">Menu</span>
          </summary>
          <nav>
            <a href="#formules">Nos formules</a>
            <a href="#carte">La carte</a>
            <a href="#tarifs">Tarifs</a>
            <a href="#feuilleter">Feuilleter le catalogue</a>
            <a href="#devis">Demander un devis directement</a>
          </nav>
        </details>
      </header>

      <section className="hero" id="accueil">
        <div className="hero-image">
          <ResponsiveImage
            base="/plantains"
            sizes="100vw"
            width={1200}
            height={797}
            alt="Plat de bananes plantains dressé par Cuillère d'Or"
            loading="eager"
          />
        </div>
        <div className="hero-content">
          <p className="eyebrow">Service traiteur · Catalogue 2027 · 2028</p>
          <h1>
            <span className="sr-only">
              Traiteur événementiel en Île-de-France —{" "}
            </span>
            Le goût en
            <br />
            <em>signature.</em>
          </h1>
          <p className="hero-copy">
            Mariage, anniversaire ou événement d’entreprise : nous composons le
            menu, le service et les attentions qui feront de votre réception un
            moment vraiment à part.
          </p>
          <div className="hero-actions">
            <a className="button button-gold" href="#calculateur">
              Estimer mon événement <ArrowRight size={17} />
            </a>
            <a
              className="button button-ghost"
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={17} /> Échanger sur WhatsApp
            </a>
          </div>
          <div className="hero-facts">
            <span>
              <Users size={20} aria-hidden="true" /> Dès 30 convives
            </span>
            <span>
              <MapPin size={20} aria-hidden="true" /> Île-de-France · ailleurs
              sur devis
            </span>
            <span>
              <Clock3 size={20} aria-hidden="true" /> Devis sous 48 à 72 h
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
            alt="Huguette MVUNDA-KILOLA, fondatrice et cheffe de Cuillère d'Or"
          />
          <div className="chef-caption">
            <strong>Huguette MVUNDA-KILOLA</strong>
            <span>Fondatrice & cheffe</span>
          </div>
        </div>
        <div className="maison-copy">
          <p className="eyebrow">La cheffe derrière Cuillère d’Or</p>
          <h2>
            Une cuisine qui rassemble.
            <br />
            <em>Une équipe qui veille.</em>
          </h2>
          <p>
            Huguette imagine chaque réception à partir de vos invités, de vos
            goûts et du rythme de votre journée. Son équipe prépare, dresse et
            sert avec la même attention, pour que vous profitiez pleinement de
            l’événement.
          </p>
          <div className="maison-promises">
            <div>
              <strong>Sur mesure</strong>
              <span>Une prestation pensée pour votre réception</span>
            </div>
            <div>
              <strong>Préparé à Brunoy</strong>
              <span>Des recettes travaillées dans notre laboratoire</span>
            </div>
            <div>
              <strong>Présents jusqu’au jour J</strong>
              <span>Un seul fil conducteur, du devis au service</span>
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
              Lauréate Mariages.net deux années de suite, aux Wedding Awards
              2025 et 2026.{" "}
              <a
                href="https://www.mariages.net/traiteur-mariage/cuillere-dor--e310106"
                target="_blank"
                rel="noopener"
              >
                Lire les avis de nos mariés sur Mariages.net
              </a>
            </p>
          </div>
          <div className="maison-bottom">
            <p className="maison-address">
              <MapPin size={16} /> Laboratoire · 29 rue de Montgeron, Brunoy
            </p>
            <a href="#devis">
              Demander un devis <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      <section className="intro section-pad">
        <div>
          <p className="eyebrow dark">01 — Choisissez votre formule</p>
          <h2>
            Comment vos invités
            <br />
            <em>seront-ils servis ?</em>
          </h2>
        </div>
        <div className="intro-copy">
          <p>
            Choisissez d’abord le style de réception. Vous estimerez le budget
            avant de composer le menu.
          </p>
          <ol className="journey-steps">
            <li className="active">
              <span>01</span>Choisir
            </li>
            <li>
              <span>02</span>Découvrir
            </li>
            <li>
              <span>03</span>Construire
            </li>
            <li>
              <span>04</span>Devis
            </li>
          </ol>
        </div>
      </section>

      <section className="offers" id="formules">
        {offers.map((offer) => (
          <article
            className="offer-card"
            id={offer.number === "05" ? "brunch" : undefined}
            key={offer.number}
          >
            <div className="offer-visual">
              <ResponsiveImage
                base={offer.image}
                sizes="(max-width: 720px) 100vw, (max-width: 1050px) 50vw, 33vw"
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
            <p className="offer-description">{offer.description}</p>
            <dl className="offer-specs">
              <div>
                <dt>{offer.firstLabel}</dt>
                <dd>{offer.firstValue}</dd>
              </div>
              <div>
                <dt>{offer.secondLabel}</dt>
                <dd>{offer.secondValue}</dd>
              </div>
            </dl>
            <div className="offer-bottom">
              <div className="offer-price">
                {offer.price} <small>{offer.suffix}</small>
              </div>
              {"wineNote" in offer && offer.wineNote ? (
                <p className="offer-wine-note">{offer.wineNote}</p>
              ) : null}
              <a
                href={offer.number <= "05" ? "#carte" : "#tarifs"}
                data-formula-target={offer.number <= "05" ? "menu" : undefined}
                data-select-formula={
                  (
                    {
                      "01": "buffet",
                      "02": "plateau",
                      "03": "assiette",
                      "04": "aperitifs",
                      "05": "brunch",
                      "06": "barbecue",
                      "07": "chef",
                    } as Record<string, string>
                  )[offer.number]
                }
              >
                {offer.cta} <ArrowRight size={16} />
              </a>
            </div>
          </article>
        ))}
      </section>

      <section className="catalogue-preview section-pad" id="feuilleter">
        <div className="catalogue-preview-copy">
          <p className="eyebrow dark">Catalogue 2027-2028</p>
          <h2>
            Feuilletez notre
            <br />
            <em>catalogue.</em>
          </h2>
          <p>
            Parcourez en ligne toutes nos prestations, page après page : plats,
            tarifs, options et conditions. Cochez vos plats préférés, puis
            téléchargez le catalogue ou votre sélection en PDF.
          </p>
          <div className="catalogue-preview-actions">
            <a className="button button-gold" href="#liseuse">
              Feuilleter le catalogue <ArrowRight size={17} />
            </a>
            <a
              className="button button-dark"
              href="https://catalogue.cuilleredor.fr"
              target="_blank"
              rel="noreferrer"
            >
              Choisir mes plats
            </a>
            <a
              className="button button-dark"
              href="/catalogue/Cuillere-dOr-Catalogue-2027-2028-FR.pdf?v=6"
              download
            >
              Télécharger le PDF
            </a>
          </div>
          <p className="catalogue-preview-note">
            Disponible en français et en anglais (bouton FR / EN dans le
            catalogue en ligne) ·{" "}
            <a href="/catalogue/Cuillere-dOr-Catalogue-2027-2028-EN.pdf?v=6" download>
              PDF English
            </a>
            <br />
            Pour imprimer :{" "}
            <a
              href="/catalogue/Cuillere-dOr-Catalogue-2027-2028-FR-HD-impression.pdf?v=6"
              download
            >
              PDF haute définition (18 Mo)
            </a>{" "}
            ·{" "}
            <a
              href="/catalogue/Cuillere-dOr-Catalogue-2027-2028-EN-HD-print.pdf?v=6"
              download
            >
              English HD
            </a>
          </p>
        </div>
        <div className="catalogue-liseuse" id="liseuse">
          <iframe
            src="/liseuse/?embed"
            title="Catalogue Cuillère d’Or 2027-2028 à feuilleter"
            loading="lazy"
            allow="fullscreen"
            allowFullScreen
          />
        </div>
      </section>

      <section className="catalogue section-pad" id="carte">
        <div className="catalogue-heading">
          <p className="eyebrow dark">02 — Découvrez votre menu</p>
          <h2>
            Généreuse. Élégante.
            <br />
            <em>Métissée.</em>
          </h2>
          <p>
            La carte de notre traiteur à Brunoy, formule par formule : buffet,
            plateau, service à l’assiette, cocktail dînatoire et brunch. Choisissez
            une formule avec les onglets ci-dessous. Les photos de chaque plat
            sont dans le{" "}
            <a
              href="https://catalogue.cuilleredor.fr"
              target="_blank"
              rel="noreferrer"
            >
              catalogue en ligne
            </a>
            .
          </p>
        </div>
        <CatalogueTabs
          plats={
            <div className="menu-showcase">
              <div
                className="carte-tabs"
                role="group"
                aria-label="Choisir une formule"
              >
                <a
                  href="#carte"
                  data-select-formula="buffet"
                  data-formula-target="menu"
                >
                  Buffet
                </a>
                <a
                  href="#carte"
                  data-select-formula="plateau"
                  data-formula-target="menu"
                >
                  Plateau
                </a>
                <a
                  href="#carte"
                  data-select-formula="assiette"
                  data-formula-target="menu"
                >
                  À l’assiette
                </a>
                <a
                  href="#carte"
                  data-select-formula="aperitifs"
                  data-formula-target="menu"
                >
                  Cocktail & vin d’honneur
                </a>
                <a
                  href="#carte"
                  data-select-formula="brunch"
                  data-formula-target="menu"
                >
                  Brunch
                </a>
                <a
                  href="#carte"
                  data-select-formula="barbecue"
                  data-formula-target="menu"
                >
                  Barbecue Party
                </a>
                <a
                  href="#carte"
                  data-select-formula="chef"
                  data-formula-target="menu"
                >
                  Chef à domicile
                </a>
              </div>
              <div className="formula-menu-list">
                <details id="menu-aperitifs" data-menu-formula="aperitifs">
                  <summary>
                    <span>04</span>
                    <div>
                      <strong>Apéritifs & vin d’honneur</strong>
                      <small>
                        10 pièces au choix · salées ou sucrées ·
                        cocktails en option
                      </small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <p className="formula-menu-note">
                      Choisissez librement parmi nos 30 créations. Toutes sont
                      proposées au même tarif.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#tarifs"
                      data-select-formula="aperitifs"
                    >
                      Choisir cette formule pour mon estimation{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="https://catalogue.cuilleredor.fr/#aperitifs-sales"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir les photos de ce menu dans le catalogue{" "}
                      <ArrowRight size={14} />
                    </a>
                    <div className="formula-dishes-flat">
                      <div className="formula-menu-categories aperitif-menu-categories">
                        <div className="formula-menu-category-flat"><h4>Créations salées · {savoury.length} choix</h4>
                            <ul>
                              {savoury.map((item) => (
                                <li key={`menu-${item.name}`}>
                                  <span>{item.name}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        <div className="formula-menu-category-flat"><h4>Douceurs sucrées · {sweet.length} choix</h4>
                            <ul>
                              {sweet.map((item) => (
                                <li key={`menu-${item.name}`}>
                                  <span>{item.name}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                      </div>
                    </div>
                    <p className="formula-menu-note menu-season-note">
                      La sphère de foie gras est disponible de décembre à
                      mars.
                    </p>
                  </div>
                </details>
                <details data-menu-formula="plateau">
                  <summary>
                    <span>02</span>
                    <div>
                      <strong>Plateau</strong>
                      <small>
                        2 viandes · 2 poissons · 4 accompagnements · 1 légume
                      </small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <p className="formula-menu-note">
                      Le menu du buffet, présenté sur plateaux et apporté à
                      table.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#tarifs"
                      data-select-formula="plateau"
                    >
                      Choisir cette formule pour mon estimation{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="https://catalogue.cuilleredor.fr/#buffet"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir les photos de ce menu dans le catalogue{" "}
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
                      <strong>Service à l’assiette</strong>
                      <small>
                        Entrée · plat · garniture · dessert
                      </small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <p className="formula-menu-note">
                      Composez un repas complet dressé et servi
                      individuellement.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#tarifs"
                      data-select-formula="assiette"
                    >
                      Choisir cette formule pour mon estimation{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="https://catalogue.cuilleredor.fr/#assiette"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir les photos de ce menu dans le catalogue{" "}
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
                        2 viandes · 2 poissons · 4 accompagnements · 1 légume
                      </small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <p className="formula-menu-note">
                      Choisissez dans chaque catégorie pour composer votre
                      buffet.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#tarifs"
                      data-select-formula="buffet"
                    >
                      Choisir cette formule pour mon estimation{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="https://catalogue.cuilleredor.fr/#buffet"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir les photos de ce menu dans le catalogue{" "}
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
                      <strong>Brunch Signature</strong>
                      <small>Une base généreuse et 10 pièces au choix</small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <a
                      className="formula-choose-cta"
                      href="#tarifs"
                      data-select-formula="brunch"
                    >
                      Choisir cette formule pour mon estimation{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="https://catalogue.cuilleredor.fr/#brunch"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir les photos de ce menu dans le catalogue{" "}
                      <ArrowRight size={14} />
                    </a>
                    <div className="formula-dishes-flat">
                      <div className="formula-menu-categories brunch-menu">
                        <div className="formula-menu-category-flat"><h4>Base commune, incluse pour tous les convives</h4>
                            <ul>
                              <li>Pain, beurre et confitures</li>
                              <li>Mini viennoiseries (croissants, pains au chocolat)</li>
                              <li>Pancakes, toppings au choix (Nutella, confiture, caramel)</li>
                              <li>Œufs brouillés ou au plat</li>
                              <li>Thé, café, chocolat chaud, eaux, jus d’orange et de pomme</li>
                              <li>Puis 10 pièces au choix, salées ou sucrées</li>
                            </ul>
                          </div>
                      </div>
                    </div>
                    <a className="formula-menu-cta" href="#formulaire-brunch">
                      Demander un devis brunch <ArrowRight size={16} />
                    </a>
                  </div>
                </details>
                <details data-menu-formula="barbecue">
                  <summary>
                    <span>06</span>
                    <div>
                      <strong>Barbecue Party</strong>
                      <small>
                        Grillades cuites en direct · 60 € par personne
                      </small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <p className="formula-menu-note">
                      Une prestation conviviale et festive pour les beaux jours.
                      Les grillades cuisent en direct, les invités se servent.
                      Le lieu de réception doit autoriser les barbecues.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#tarifs"
                      data-select-formula="barbecue"
                    >
                      Choisir cette formule pour mon estimation{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="https://catalogue.cuilleredor.fr/#barbecue"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir les photos de ce menu dans le catalogue{" "}
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
                      <strong>Chef à domicile</strong>
                      <small>Clé en main chez vous · dès 95 € par personne</small>
                    </div>
                    <b aria-hidden="true">+</b>
                  </summary>
                  <div className="formula-menu-body">
                    <p className="formula-menu-note">
                      La cheffe Huguette et son équipe apportent la cuisine, la
                      vaisselle, le nappage et le service, avec l’exigence d’une
                      belle table d’hôtel ou de restaurant haut de gamme. Dès 20
                      couverts, hors frais de déplacement.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#tarifs"
                      data-select-formula="chef"
                    >
                      Choisir cette formule pour mon estimation{" "}
                      <ArrowRight size={16} />
                    </a>
                    <a
                      className="formula-catalogue-link"
                      href="https://catalogue.cuilleredor.fr/#chef-domicile"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Voir les photos de ce menu dans le catalogue{" "}
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
          <p className="eyebrow dark">03 — Construisez votre réception</p>
          <h2>
            Votre réception,
            <br />
            <em>chiffrée simplement.</em>
          </h2>
          <p>
            Votre formule vous suit automatiquement. Ajustez les convives, le
            service, les plats et les options sans recommencer votre choix.
          </p>
        </div>
        <PricingGrids />
        <PricingCalculator />
      </section>

      <section className="quote-path section-pad" id="devis">
        <div className="quote-heading">
          <div>
            <p className="eyebrow">04 — Recevez votre devis</p>
            <h2>
              Recevez votre
              <br />
              <em>devis personnalisé.</em>
            </h2>
          </div>
          <p>
            Indiquez votre enveloppe budgétaire : nous ajustons la
            proposition avec vous. La sélection des pièces (apéritifs,
            brunch) n&apos;est pas obligatoire pour recevoir un premier devis.
          </p>
        </div>
        <QuoteChooser formUrl={QUOTE_FORM} whatsapp={WHATSAPP} />
      </section>

      <section className="faq section-pad" id="faq" aria-labelledby="faq-title">
        <div className="faq-heading">
          <div>
            <p className="eyebrow dark">Questions fréquentes</p>
            <h2 id="faq-title">
              Tout savoir avant
              <br />
              <em>votre événement.</em>
            </h2>
          </div>
          <div>
            <p>
              Formules, réservation, organisation et dégustation : retrouvez ici
              les réponses essentielles pour préparer votre réception
              sereinement.
            </p>
            <a href="#devis">
              Votre question reste ouverte ? <span>Demander un devis</span>{" "}
              <ArrowRight size={15} />
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
              Voir les {faqItems.length - FAQ_VISIBLE_COUNT} autres questions
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
          <p className="eyebrow dark">Une question avant de vous décider ?</p>
          <h2>
            On reste
            <br />
            <em>disponibles.</em>
          </h2>
          <p>
            Formule, lieu, organisation : écrivez-nous sur WhatsApp. Projet déjà
            clair ? Passez directement au devis.
          </p>
          <div className="contact-actions">
            <a className="button button-gold" href="#devis">
              Demander mon devis personnalisé <ArrowRight size={17} />
            </a>
            <a
              className="button button-dark"
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={17} /> Poser une question
            </a>
          </div>
        </div>
        <address>
          <a href="tel:+33783748971">
            <Phone size={19} /> 07 83 74 89 71
          </a>
          <a href="mailto:contact@cuilleredor.fr">
            <Mail size={19} /> contact@cuilleredor.fr
          </a>
          <span>
            <MapPin size={19} />
            <span>
              <small>Adresse de correspondance</small>8 allée des Bois, 77240
              Vert-Saint-Denis
            </span>
          </span>
        </address>
      </section>

      <div className="floating-actions" aria-label="Actions rapides">
        <a
          className="back-to-top"
          href="#accueil"
          aria-label="Revenir en haut de la page"
          title="Revenir en haut"
        >
          <ArrowUp size={20} />
        </a>
        <a
          className="whatsapp-float"
          href={WHATSAPP}
          target="_blank"
          rel="noreferrer"
          aria-label="Échanger avec Cuillère d'Or sur WhatsApp"
        >
          <MessageCircle size={22} />
          <span>WhatsApp</span>
        </a>
      </div>

      <footer>
        <div className="footer-brand">
          <strong>Cuillère d’Or</strong>
          <p>Service traiteur &amp; laboratoire à Brunoy.</p>
          <small>
            Huguette MVUNDA-KILOLA · EI · SIREN 889 933 800
          </small>
        </div>
        <div className="footer-action">
          <span>Votre réception commence ici</span>
          <a href="#devis">
            Demander un devis <ArrowRight size={16} />
          </a>
          <nav className="footer-legal" aria-label="Informations légales">
            <a href="/catalogue/Cuillere-dOr-Catalogue-2027-2028-FR.pdf?v=6">Catalogue PDF</a>
            <a href="/mentions-legales">Mentions légales</a>
            <a href="/politique-confidentialite">Confidentialité</a>
          </nav>
        </div>
        <nav className="footer-socials" aria-label="Réseaux sociaux et contact">
          <a
            href="https://www.instagram.com/cuillere.dor/"
            target="_blank"
            rel="noreferrer"
            aria-label="Suivre Cuillère d'Or sur Instagram, ouverture dans un nouvel onglet"
          >
            <InstagramIcon />
            <span>Instagram</span>
            <ExternalLink size={14} />
          </a>
          <a
            href="https://www.tiktok.com/@cuillere.dor"
            target="_blank"
            rel="noreferrer"
            aria-label="Suivre Cuillère d'Or sur TikTok, ouverture dans un nouvel onglet"
          >
            <TikTokIcon />
            <span>TikTok</span>
            <ExternalLink size={14} />
          </a>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer"
            aria-label="Contacter Cuillère d'Or sur WhatsApp, ouverture dans un nouvel onglet"
          >
            <MessageCircle size={18} />
            <span>WhatsApp</span>
            <ExternalLink size={14} />
          </a>
        </nav>
        <p className="footer-copy">
          © 2026 CUILLÈRE D’OR · EXCELLENCE CULINAIRE.
        </p>
      </footer>
    </main>
  );
}
