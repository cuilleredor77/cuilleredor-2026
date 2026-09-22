import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = import.meta.env.PROD
  ? "https://cuillere-dor-catalogue-2026.cuilleredor4.workers.dev"
  : "http://localhost:5173";
const TITLE = "Cuillère d’Or | Traiteur événementiel - Catalogue 2026";
const DESCRIPTION =
  "Composez votre réception avec Cuillère d’Or : vin d’honneur, buffet, plateau, service à l’assiette et Brunch Signature. Tarifs 2026 et devis personnalisé.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Cuillère d’Or",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/hero-plating-1200.webp", width: 1200, height: 797 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/hero-plating-1200.webp"],
  },
};

const LOCAL_BUSINESS_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  name: "Cuillère d’Or",
  image: `${SITE_URL}/logo-cuillere-dor.png`,
  url: SITE_URL,
  telephone: "+33783748971",
  email: "cuilleredor4@gmail.com",
  founder: {
    "@type": "Person",
    name: "Huguette MVUNDA-KILOLA",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "8 allée des Bois",
    postalCode: "77240",
    addressLocality: "Vert-Saint-Denis",
    addressCountry: "FR",
  },
  areaServed: "Île-de-France",
  priceRange: "€€-€€€",
  sameAs: [
    "https://www.instagram.com/cuillere.dor/",
    "https://www.tiktok.com/@cuilleredorr",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(LOCAL_BUSINESS_JSON_LD),
          }}
        />
        {children}
      </body>
    </html>
  );
}
