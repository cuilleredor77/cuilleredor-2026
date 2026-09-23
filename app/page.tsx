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
  category: { title: string; image: string; alt: string; items: string[] };
  keyPrefix: string;
}) {
  return (
    <details className="formula-menu-category">
      <summary>
        <span>{category.title}</span>
        <b aria-hidden="true">+</b>
      </summary>
      <div className="formula-category-content">
        <img
          className="formula-category-image"
          src={category.image}
          width="640"
          height="320"
          alt={category.alt}
          loading="lazy"
          decoding="async"
        />
        <ul>
          {category.items.map((item) => (
            <li key={`${keyPrefix}-${item}`}>{item}</li>
          ))}
        </ul>
      </div>
    </details>
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
    price: "à partir de 35 €",
    suffix: "/ personne · 10 à 199 convives",
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
    price: "35 à 50 €",
    suffix: "/ personne",
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
    suffix: "/ personne",
    cta: "Choisir le service à l’assiette",
  },
  {
    number: "04",
    title: "Apéritifs",
    tone: "Cocktail",
    image: "/hero-bouchee",
    imageAlt: "Création apéritive Cuillère d’Or",
    description:
      "Dix pièces salées et sucrées et quatre cocktails signature pour ouvrir votre réception.",
    firstLabel: "Comprend",
    firstValue: "10 pièces individuelles · 4 cocktails",
    secondLabel: "Idéal pour",
    secondValue: "Vin d’honneur, cocktail et événement d’entreprise",
    price: "25 €",
    suffix: "/ personne · dès 30 convives",
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
      "Viennoiseries · pièces salées et sucrées · œufs · fruits · boissons",
    secondLabel: "Idéal pour",
    secondValue: "Lendemains de mariage et réceptions familiales en journée",
    price: "30 €",
    suffix: "/ personne · dès 30 convives",
    cta: "Choisir le brunch",
    href: "#formulaire-brunch",
  },
];

const savoury = [
  {
    name: "Sphère de foie gras, hibiscus et coco · décembre à mars",
    image: "/dishes/foie-gras-hibiscus.webp",
  },
  {
    name: "Mini-burger pikliz, banane plantain et poulet",
    image: "/dishes/burger-pikliz.webp",
  },
  {
    name: "Mini-burger au saumon, sauce aïoli",
    image: "/dishes/burger-saumon.webp",
  },
  {
    name: "Mini-cake tomate et estragon, mascarpone fumée",
    image: "/dishes/mini-cake-tomate.webp",
  },
  {
    name: "Croquette de patate douce et gambas, mangue-piment",
    image: "/dishes/croquette-gambas.webp",
  },
  {
    name: "Croquette de morue, crème de curry vert",
    image: "/dishes/croquette-morue.webp",
  },
  {
    name: "Croquette d’igname, crème de poivron rouge",
    image: "/dishes/croquette-igname.webp",
  },
  {
    name: "Banane frite et effiloché de bœuf, sauce barbecue",
    image: "/dishes/banane-boeuf.webp",
  },
  {
    name: "Tartelette curcuma, salsa mangue, saumon ou crevette",
    image: "/dishes/tartelette-curcuma.webp",
  },
  { name: "Mini-burger au bœuf", image: "/dishes/mini-burger.webp" },
  { name: "Navette au saumon", image: "/dishes/navette-saumon.webp" },
  { name: "Samoussa au bœuf ou aux légumes", image: "/dishes/samoussa.webp" },
  {
    name: "Nems au poulet ou pastels au thon",
    image: "/dishes/nems-pastels.webp",
  },
  { name: "Mini-quiche lorraine", image: "/dishes/mini-quiche-lorraine.webp" },
  {
    name: "Mini-brochettes de poulet ou de bœuf",
    image: "/dishes/mini-brochettes.webp",
  },
  { name: "Mini-wraps", image: "/dishes/mini-wraps.webp" },
  {
    name: "Gambas grillées ou tenders de poulet",
    image: "/dishes/gambas-tenders.webp",
  },
  {
    name: "Brochettes tomate-mozzarella",
    image: "/dishes/tomate-mozzarella.webp",
  },
  { name: "Tempuras de crevettes", image: "/dishes/tempuras.webp" },
  {
    name: "Tartelettes végétariennes",
    image: "/dishes/tartelettes-vegetariennes.webp",
  },
  {
    name: "Pastèque braisée, concombre et feta · selon la saison",
    image: "/dishes/pasteque-feta.webp",
  },
];
const sweet = [
  {
    name: "Mi-cuit au chocolat, crème fouettée et cacao",
    image: "/dishes/mi-cuit-chocolat.webp",
  },
  {
    name: "Riz au lait revisité, perles de riz et caramel",
    image: "/dishes/riz-au-lait.webp",
  },
  { name: "Tiramisu spéculoos", image: "/dishes/tiramisu.webp" },
  {
    name: "Brochette ou verrine de fruits de saison",
    image: "/dishes/fruits-saison.webp",
  },
  {
    name: "Beignets de riz panés au panko",
    image: "/dishes/beignets-riz-panko.webp",
  },
  { name: "Beignets classiques", image: "/dishes/beignets-classiques.webp" },
  { name: "Beignets de banane", image: "/dishes/beignets-banane.webp" },
  { name: "Tôt-fait aux pommes", image: "/dishes/tot-fait-pommes.webp" },
  {
    name: "Panna cotta aux fruits rouges ou exotiques",
    image: "/dishes/panna-cotta.webp",
  },
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
      "Riz blanc",
      "Riz rouge à la tomate",
      "Riz cantonais",
      "Riz au curry",
      "Bananes plantains",
      "Manioc (kwanga)",
      "Beignets",
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
      "Tomate du jardin, crème d’anchois · selon la saison",
      "Gambas poêlées, tagliatelles de carotte fumée",
      "Quesadillas au crabe, crème de maïs et polenta croustillante",
      "Banane plantain, sauce aux trois poivrons et effiloché de bœuf",
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

const faqItems = [
  {
    question: "Quelle formule choisir pour mon événement ?",
    answer:
      "Comparez les 5 formules dans la section « Nos formules » : chacune précise son ambiance et son budget. Si vous hésitez entre deux options, écrivez-nous sur WhatsApp. Nous vous conseillerons selon le nombre de convives et le style de votre réception.",
  },
  {
    question: "À partir de combien de convives intervenez-vous ?",
    answer:
      "Nos prestations sont accessibles à partir de 10 participants, adultes, enfants et prestataires compris (30 convives minimum pour le vin d’honneur et le Brunch Signature).",
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
      "Acompte : 30 % à la signature",
      "Solde : 70 % deux mois avant l’événement",
      "Événement dans moins de 60 jours : règlement intégral à la signature",
      "Virement bancaire ou espèces",
      "Une caution de 250 € peut être demandée avec le solde, restituée en l’absence de retard, dommage, casse ou perte de matériel",
    ],
  },
  {
    question: "Quelle est la politique d’annulation ?",
    answer:
      "Toute annulation doit être formulée par écrit. Plus de 90 jours avant l’événement, l’acompte reste acquis. Entre 30 et 90 jours, 50 % du montant total est dû. À moins de 30 jours, la totalité de la prestation est due.",
  },
  {
    question: "Que comprend le vin d’honneur ?",
    answer:
      "Le vin d’honneur comprend 10 pièces cocktail salées et sucrées, 4 cocktails signature au choix et le service pendant toute sa durée.",
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
      "Ils sont calculés au départ de Vert-Saint-Denis, sur la base de 1,70 € par kilomètre aller-retour, puis présentés sur une ligne distincte du devis. Les prestations hors Île-de-France et à l’international sont étudiées sur demande.",
  },
  {
    question: "Comment se déroule une dégustation ?",
    answer:
      "La dégustation se réserve sur rendez-vous au restaurant Chez Lina, à Brunoy, et permet de goûter une sélection représentative, d’affiner le menu et d’échanger avec la cheffe. Elle est proposée à 70 € par personne, non déductible du devis final.",
  },
  {
    question: "Que comprend le menu enfant et le repas prestataire ?",
    answer:
      "Le menu enfant (3 à 12 ans) et le repas prestataire sont proposés à 20 € par personne, au choix parmi poulet braisé et riz rouge, tenders de poulet et pommes de terre sautées, ou lasagnes. Nous recommandons de prévoir un repas pour chaque prestataire présent (photographe, vidéaste, DJ, musiciens, wedding planner, décorateur…). Une assiette de fromages avant le dessert est disponible en supplément à 9 € par personne.",
  },
  {
    question: "Puis-je ajouter vaisselle, boissons ou wedding cake à mon devis ?",
    answer:
      "Oui. La calculette propose ces options en supplément : forfait boissons à 3,80 € par personne, service des boissons à 160 € par serveur, kits de vaisselle de 7 à 13 € par personne, linge de table, mobilier (mange-debout, chafing dish, étuve) et wedding cake réalisé par notre partenaire Love Lo Cake. Camion frigorifique, photographe, vidéaste, DJ, décorateur et wedding planner restent sur devis.",
  },
  {
    question: "Une caution est-elle demandée ?",
    answer:
      "Une caution de 250 € peut être demandée avec le règlement du solde. Elle est restituée en l’absence de retard, dommage, casse ou perte de matériel. Les conditions exactes figurent dans le devis et le contrat.",
  },
  {
    question: "Comment faire une réclamation ?",
    answer:
      "Toute réclamation doit être adressée par écrit au plus tard deux jours ouvrés après la prestation. Une réclamation formulée oralement doit être confirmée par écrit dans ce même délai.",
  },
];
const FAQ_VISIBLE_COUNT = 5;

export default function Home() {
  return (
    <main>
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
            width="1781"
            height="406"
            alt="Cuillère d'Or - Le paradis du goût"
          />
        </a>
        <nav className="desktop-nav" aria-label="Navigation principale">
          <a href="#formules">Nos formules</a>
          <a href="#carte">La carte</a>
          <a href="#tarifs">Tarifs</a>
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
          <p className="eyebrow">Service traiteur · Catalogue 2026</p>
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
              <Users size={20} aria-hidden="true" /> Dès 10 convives
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
              <a
                href="#carte"
                data-formula-target="menu"
                data-select-formula={
                  (
                    {
                      "01": "buffet",
                      "02": "plateau",
                      "03": "assiette",
                      "04": "aperitifs",
                      "05": "brunch",
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

      <section className="catalogue section-pad" id="carte">
        <div className="catalogue-heading">
          <p className="eyebrow dark">02 — Découvrez votre menu</p>
          <h2>
            Généreuse. Élégante.
            <br />
            <em>Métissée.</em>
          </h2>
          <p>
            Seule la formule sélectionnée est affichée. Vous pouvez modifier
            votre choix depuis la calculette.
          </p>
        </div>
        <CatalogueTabs
          plats={
            <div className="menu-showcase">
              <div className="section-heading">
                <p className="eyebrow">Votre formule</p>
                <h3>Découvrez uniquement les choix qui vous concernent.</h3>
              </div>
              <details className="formula-switcher">
                <summary>
                  Changer de formule <b aria-hidden="true">+</b>
                </summary>
                <div>
                  <a
                    href="#carte"
                    data-select-formula="buffet"
                    data-formula-target="menu"
                  >
                    01 Buffet
                  </a>
                  <a
                    href="#carte"
                    data-select-formula="plateau"
                    data-formula-target="menu"
                  >
                    02 Plateau
                  </a>
                  <a
                    href="#carte"
                    data-select-formula="assiette"
                    data-formula-target="menu"
                  >
                    03 Service à l’assiette
                  </a>
                  <a
                    href="#carte"
                    data-select-formula="aperitifs"
                    data-formula-target="menu"
                  >
                    04 Apéritifs & vin d’honneur
                  </a>
                  <a
                    href="#carte"
                    data-select-formula="brunch"
                    data-formula-target="menu"
                  >
                    05 Brunch Signature
                  </a>
                </div>
              </details>
              <div className="formula-menu-list">
                <details id="menu-aperitifs" data-menu-formula="aperitifs">
                  <summary>
                    <span>04</span>
                    <div>
                      <strong>Apéritifs & vin d’honneur</strong>
                      <small>
                        10 pièces au choix · salées ou sucrées · 4 cocktails
                        signature
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
                    <details className="formula-dishes" open>
                      <summary>
                        Découvrir les créations <b aria-hidden="true">+</b>
                      </summary>
                      <div className="formula-menu-categories aperitif-menu-categories">
                        <details className="formula-menu-category">
                          <summary>
                            <span>
                              Créations salées · {savoury.length} choix
                            </span>
                            <b aria-hidden="true">+</b>
                          </summary>
                          <div className="formula-category-content">
                            <ul>
                              {savoury.map((item) => (
                                <li key={`menu-${item.name}`}>
                                  <img
                                    src={item.image}
                                    width="96"
                                    height="96"
                                    alt=""
                                    loading="lazy"
                                  />
                                  <span>{item.name}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </details>
                        <details className="formula-menu-category">
                          <summary>
                            <span>Douceurs sucrées · {sweet.length} choix</span>
                            <b aria-hidden="true">+</b>
                          </summary>
                          <div className="formula-category-content">
                            <ul>
                              {sweet.map((item) => (
                                <li key={`menu-${item.name}`}>
                                  <img
                                    src={item.image}
                                    width="96"
                                    height="96"
                                    alt=""
                                    loading="lazy"
                                  />
                                  <span>{item.name}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </details>
                      </div>
                    </details>
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
                      table. Composition standard : 2 viandes, 2 poissons, 4
                      accompagnements et 1 légume. Tout supplément est
                      facturé 5 €.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#tarifs"
                      data-select-formula="plateau"
                    >
                      Choisir cette formule pour mon estimation{" "}
                      <ArrowRight size={16} />
                    </a>
                    <details className="formula-dishes" open>
                      <summary>
                        Découvrir les plats <b aria-hidden="true">+</b>
                      </summary>
                      <div className="formula-menu-categories">
                        {buffetCategories.map((category) => (
                          <MenuCategory
                            key={`plateau-${category.title}`}
                            category={category}
                            keyPrefix="plateau"
                          />
                        ))}
                      </div>
                    </details>
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
                    <details className="formula-dishes" open>
                      <summary>
                        Découvrir les plats <b aria-hidden="true">+</b>
                      </summary>
                      <div className="formula-menu-categories">
                        {platedCategories.map((category) => (
                          <MenuCategory
                            key={category.title}
                            category={category}
                            keyPrefix="assiette"
                          />
                        ))}
                      </div>
                    </details>
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
                      buffet. Composition standard : 2 viandes, 2 poissons, 4
                      accompagnements et 1 légume. Tout supplément est
                      facturé 5 €.
                    </p>
                    <a
                      className="formula-choose-cta"
                      href="#tarifs"
                      data-select-formula="buffet"
                    >
                      Choisir cette formule pour mon estimation{" "}
                      <ArrowRight size={16} />
                    </a>
                    <details className="formula-dishes" open>
                      <summary>
                        Découvrir les plats <b aria-hidden="true">+</b>
                      </summary>
                      <div className="formula-menu-categories">
                        {buffetCategories.map((category) => (
                          <MenuCategory
                            key={`buffet-${category.title}`}
                            category={category}
                            keyPrefix="buffet"
                          />
                        ))}
                      </div>
                    </details>
                  </div>
                </details>
                <details data-menu-formula="brunch">
                  <summary>
                    <span>05</span>
                    <div>
                      <strong>Brunch Signature</strong>
                      <small>Une formule complète, salée et sucrée</small>
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
                    <details className="formula-dishes" open>
                      <summary>
                        Découvrir le brunch <b aria-hidden="true">+</b>
                      </summary>
                      <div className="formula-menu-categories brunch-menu">
                        <details className="formula-menu-category">
                          <summary>
                            <span>La formule comprend</span>
                            <b aria-hidden="true">+</b>
                          </summary>
                          <div className="formula-category-content">
                            <img
                              className="formula-category-image"
                              src="/brunch/brunch-signature-480.webp"
                              width="640"
                              height="320"
                              alt="Brunch Signature Cuillère d’Or"
                              loading="lazy"
                            />
                            <ul>
                              <li>Viennoiseries et pièces sucrées</li>
                              <li>Pièces salées</li>
                              <li>Œufs</li>
                              <li>Fruits frais de saison</li>
                              <li>Boissons chaudes et jus de fruits</li>
                            </ul>
                          </div>
                        </details>
                      </div>
                    </details>
                    <a className="formula-menu-cta" href="#formulaire-brunch">
                      Demander un devis brunch <ArrowRight size={16} />
                    </a>
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
            Si vous avez utilisé la calculette, votre formule est déjà reconnue.
            Sinon, choisissez simplement Événement ou Brunch.
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
            Huguette MVUNDA-KILOLA · EI
            <br />
            SIREN 889 933 800
          </small>
        </div>
        <div className="footer-action">
          <span>Votre réception commence ici</span>
          <a href="#devis">
            Demander un devis <ArrowRight size={16} />
          </a>
          <nav className="footer-legal" aria-label="Informations légales">
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
            href="https://www.tiktok.com/@cuilleredorr"
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
