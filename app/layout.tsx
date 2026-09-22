import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuillère d’Or | Traiteur événementiel - Catalogue 2026",
  description:
    "Composez votre réception avec Cuillère d’Or : vin d’honneur, buffet, plateau, service à l’assiette et Brunch Signature. Tarifs 2026 et devis personnalisé.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
