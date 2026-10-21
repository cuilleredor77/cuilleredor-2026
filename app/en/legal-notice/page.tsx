import type { Metadata } from "next";
import LegalShell from "../../legal-shell";

export const metadata: Metadata = {
  title: "Legal notice | Cuillère d’Or",
  description: "Legal information and contact details for Cuillère d’Or, event catering services.",
  alternates: {
    canonical: "/en/legal-notice",
    languages: { fr: "/mentions-legales", en: "/en/legal-notice" },
  },
};

export default function LegalNotice() {
  return <LegalShell lang="en" eyebrow="Regulatory information" title="Legal notice" updated="2 September 2026">
    <section><h2>Website publisher</h2><p>This website is published by <strong>Ms Huguette Mvunda-Kilola</strong>, a sole proprietor trading under the business name <strong>Cuillère d’Or</strong>.</p><dl><div><dt>Registered address</dt><dd>8 allée des Bois, 77240 Vert-Saint-Denis, France</dd></div><div><dt>SIREN</dt><dd>889 933 800</dd></div><div><dt>SIRET</dt><dd>889 933 800 00019</dd></div><div><dt>Business activity</dt><dd>Event catering services — APE code 5621Z</dd></div><div><dt>Telephone</dt><dd><a href="tel:+33783748971">+33 7 83 74 89 71</a></dd></div><div><dt>Email</dt><dd><a href="mailto:contact@cuilleredor.fr">contact@cuilleredor.fr</a></dd></div></dl></section>
    <section><h2>Publication director</h2><p>Huguette Mvunda-Kilola is responsible for the publication of this website.</p></section>
    <section><h2>Hosting</h2><p>This website is hosted by Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, United States.</p><p><a href="https://www.cloudflare.com/website-terms/" target="_blank" rel="noreferrer">View Cloudflare’s Terms of Service</a>.</p></section>
    <section><h2>Intellectual property</h2><p>The text, photographs, graphic elements, logos and other content displayed on this website belong to Cuillère d’Or or are used with permission from their respective rights holders. Any total or partial reproduction, representation or adaptation requires prior written authorisation.</p></section>
    <section><h2>Liability</h2><p>Cuillère d’Or takes care to ensure the accuracy of published information. The prices and services displayed are indicative until a formal quotation has been issued and accepted. Cuillère d’Or cannot be held responsible for temporary unavailability of the website or of any third-party service linked from it.</p></section>
    <section><p><em>This is a translation of the French legal notice; in case of discrepancy, the <a href="/mentions-legales" hrefLang="fr">French version</a> prevails.</em></p></section>
  </LegalShell>;
}
