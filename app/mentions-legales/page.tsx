import type { Metadata } from "next";
import LegalShell from "../legal-shell";

export const metadata: Metadata = {
  title: "Mentions légales | Cuillère d’Or",
  description: "Informations légales et coordonnées de Cuillère d’Or, service traiteur événementiel.",
};

export default function MentionsLegales() {
  return <LegalShell eyebrow="Informations réglementaires" title="Mentions légales" updated="2 septembre 2026">
    <section><h2>Éditeur du site</h2><p>Le présent site est édité par <strong>Madame Huguette Mvunda-Kilola</strong>, entrepreneur individuel exerçant sous le nom commercial <strong>Cuillère d’Or</strong>.</p><dl><div><dt>Siège social</dt><dd>8 allée des Bois, 77240 Vert-Saint-Denis, France</dd></div><div><dt>SIREN</dt><dd>889 933 800</dd></div><div><dt>SIRET</dt><dd>889 933 800 00019</dd></div><div><dt>Activité</dt><dd>Services des traiteurs — APE 5621Z</dd></div><div><dt>Téléphone</dt><dd><a href="tel:+33783748971">07 83 74 89 71</a></dd></div><div><dt>E-mail</dt><dd><a href="mailto:contact@cuilleredor.fr">contact@cuilleredor.fr</a></dd></div></dl></section>
    <section><h2>Direction de la publication</h2><p>La directrice de la publication est Huguette Mvunda-Kilola.</p></section>
    <section><h2>Hébergement</h2><p>Le site est hébergé par Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, États-Unis.</p><p><a href="https://www.cloudflare.com/fr-fr/website-terms/" target="_blank" rel="noreferrer">Consulter les conditions d’utilisation de Cloudflare</a>.</p></section>
    <section><h2>Propriété intellectuelle</h2><p>Les textes, photographies, éléments graphiques, logos et contenus présentés sur ce site appartiennent à Cuillère d’Or ou sont utilisés avec l’autorisation de leurs titulaires. Toute reproduction, représentation ou adaptation, totale ou partielle, nécessite une autorisation écrite préalable.</p></section>
    <section><h2>Responsabilité</h2><p>Cuillère d’Or veille à l’exactitude des informations publiées. Les tarifs et prestations présentés restent indicatifs jusqu’à l’émission et l’acceptation d’un devis. La maison ne peut être tenue responsable d’une indisponibilité temporaire du site ou d’un service tiers accessible depuis celui-ci.</p></section>
  </LegalShell>;
}
