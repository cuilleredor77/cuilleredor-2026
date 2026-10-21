import type { Metadata } from "next";
import LegalShell from "../../legal-shell";

export const metadata: Metadata = {
  title: "Privacy policy | Cuillère d’Or",
  description: "How Cuillère d’Or processes personal data and how to exercise your rights.",
  alternates: {
    canonical: "/en/privacy-policy",
    languages: { fr: "/politique-confidentialite", en: "/en/privacy-policy" },
  },
};

export default function PrivacyPolicy() {
  return <LegalShell lang="en" eyebrow="Protecting your information" title="Privacy policy" updated="2 September 2026">
    <section><h2>Data controller</h2><p>Cuillère d’Or, operated by Huguette Mvunda-Kilola, is responsible for the personal information used to respond to your enquiries. You can contact us at <a href="mailto:contact@cuilleredor.fr">contact@cuilleredor.fr</a> or by writing to 8 allée des Bois, 77240 Vert-Saint-Denis, France.</p></section>
    <section><h2>Information we collect</h2><p>When you request a quotation or contact us, we may receive your first and last names, email address, telephone number and the information needed to assess your event: date, location, number of guests, selected package, preferences, dietary requirements and any additional details you choose to share.</p></section>
    <section><h2>Why we use this information</h2><ul><li>to respond to your enquiry and prepare a personalised proposal;</li><li>to manage pre-contractual correspondence and, if you accept the quotation, deliver the contracted services;</li><li>to comply with our administrative, accounting and legal obligations;</li><li>to maintain our customer relationships and process your requests.</li></ul><p>Processing quotation requests is primarily based on taking steps at your request before entering into a contract. Legal obligations and performance of the contract then apply once you become a customer.</p></section>
    <section><h2>Forms and data recipients</h2><p>The quotation forms embedded on this website are provided by Google Forms. Information entered is sent to Cuillère d’Or and technically processed by Google under its own terms. Please do not submit sensitive information that is not necessary for us to assess your event.</p><p><a href="https://policies.google.com/privacy?hl=en" target="_blank" rel="noreferrer">View Google’s Privacy Policy</a>.</p></section>
    <section><h2>Data retention</h2><p>Enquiries that do not result in a booking are retained for the time required to follow up on them, up to a maximum of three years after the last contact. Documents relating to completed services and their invoicing are retained for the periods required by applicable regulations.</p></section>
    <section><h2>Your rights</h2><p>You may request access to, rectification, erasure or restriction of your personal data. Where the applicable conditions are met, you may also object to processing or request data portability. Please write to <a href="mailto:contact@cuilleredor.fr">contact@cuilleredor.fr</a>, explaining your request. Proof of identity may be requested if necessary.</p><p>If you believe your rights have not been respected, you may lodge a complaint with the French data protection authority (<a href="https://www.cnil.fr/en/" target="_blank" rel="noreferrer">CNIL</a>).</p></section>
    <section><h2>Cookies and third-party services</h2><p>The website does not operate its own advertising system. However, its hosting infrastructure and embedded Google Forms may use technical elements needed for their operation. When opening an external link, including WhatsApp, Instagram, TikTok or Google, you access a third-party service governed by its own privacy policy.</p></section>
    <section><h2>Security and updates</h2><p>Cuillère d’Or restricts access to personal information to those who need it to process your request and implements reasonable safeguards. This policy may be updated to reflect changes to the website, the tools used or applicable regulations.</p></section>
    <section><p><em>This is a translation of the French privacy policy; in case of discrepancy, the <a href="/politique-confidentialite" hrefLang="fr">French version</a> prevails.</em></p></section>
  </LegalShell>;
}
