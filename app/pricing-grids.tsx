"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

type Formula =
  | "buffet"
  | "plateau"
  | "assiette"
  | "aperitifs"
  | "brunch"
  | "barbecue"
  | "chef";

export default function PricingGrids({
  lang = "fr",
}: { lang?: "fr" | "en" } = {}) {
  const en = lang === "en";
  const [openFormula, setOpenFormula] = useState<Formula | null>("buffet");

  useEffect(() => {
    const update = (event: Event) =>
      setOpenFormula((event as CustomEvent<Formula>).detail);
    window.addEventListener("cuillere:formula", update);
    return () => window.removeEventListener("cuillere:formula", update);
  }, []);

  const toggle = (formula: Formula) =>
    setOpenFormula((current) => (current === formula ? null : formula));
  const summary = (number: string, name: string, price: string) => (
    <>
      <span>
        <i>{number}</i>
        {name}
      </span>
      <small>{price}</small>
      <b aria-hidden="true">+</b>
    </>
  );

  return (
    <details className="all-pricing-grids">
      <summary>
        <span>{en ? "View all prices and tiers" : "Voir tous les tarifs et paliers"}</span>
        <small>
          {en ? "Price per guest according to the number of guests" : "Prix par convive selon le nombre d’invités"}
        </small>
        <b aria-hidden="true">+</b>
      </summary>
      <div className="pricing-grids">
        <div className="pricing-grids-heading">
          <strong>{en ? "Full price list" : "Grille tarifaire complète"}</strong>
          <p>
            {en
              ? "Compare guest-number tiers and service levels."
              : "Comparez les tranches de convives et les niveaux de service."}
          </p>
        </div>
        <details data-formule="buffet" open={openFormula === "buffet"}>
          <summary
            onClick={(event) => {
              event.preventDefault();
              toggle("buffet");
            }}
          >
            {summary(
              "01",
              "Buffet",
              en ? "€35 to €45 · from 30 guests" : "35 à 45 € · dès 30 convives",
            )}
          </summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{en ? "Guests" : "Convives"}</th>
                  <th>{en ? "Without cocktail reception" : "Sans vin d’honneur"}</th>
                  <th>{en ? "With cocktail reception" : "Avec vin d’honneur"}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{en ? "30 to 199" : "30 à 199"}</td>
                  <td>{en ? "€45" : "45 €"}</td>
                  <td>{en ? "€50" : "50 €"}</td>
                </tr>
                <tr>
                  <td>{en ? "200 to 349" : "200 à 349"}</td>
                  <td>{en ? "€40" : "40 €"}</td>
                  <td>{en ? "€45" : "45 €"}</td>
                </tr>
                <tr>
                  <td>{en ? "350+" : "350 et +"}</td>
                  <td>{en ? "€35" : "35 €"}</td>
                  <td>{en ? "€40" : "40 €"}</td>
                </tr>
              </tbody>
            </table>
            <p className="pricing-tier-note">
              {en
                ? "Price per adult, service included. Tiered pricing based on the total number of guests (adults, children and vendors). With cocktail reception: 4 cocktails of your choice available as an option, +€5/guest."
                : "Prix par adulte, service compris. Tarifs dégressifs selon le nombre total de convives (adultes, enfants et prestataires). Avec vin d’honneur : 4 cocktails au choix en option, +5 €/pers."}
            </p>
          </div>
        </details>
        <details data-formule="plateau" open={openFormula === "plateau"}>
          <summary
            onClick={(event) => {
              event.preventDefault();
              toggle("plateau");
            }}
          >
            {summary(
              "02",
              en ? "Platter service" : "Plateau",
              en ? "€40 to €50 · from 30 guests" : "40 à 50 € · dès 30 convives",
            )}
          </summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{en ? "Guests" : "Convives"}</th>
                  <th>{en ? "Without cocktail reception" : "Sans vin d’honneur"}</th>
                  <th>{en ? "With cocktail reception" : "Avec vin d’honneur"}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{en ? "30 to 199" : "30 à 199"}</td>
                  <td>{en ? "€50" : "50 €"}</td>
                  <td>{en ? "€55" : "55 €"}</td>
                </tr>
                <tr>
                  <td>{en ? "200 to 349" : "200 à 349"}</td>
                  <td>{en ? "€45" : "45 €"}</td>
                  <td>{en ? "€50" : "50 €"}</td>
                </tr>
                <tr>
                  <td>{en ? "350+" : "350 et +"}</td>
                  <td>{en ? "€40" : "40 €"}</td>
                  <td>{en ? "€45" : "45 €"}</td>
                </tr>
              </tbody>
            </table>
            <p className="pricing-tier-note">
              {en
                ? "With cocktail reception: 4 cocktails of your choice available as an option, +€5/guest."
                : "Avec vin d’honneur : 4 cocktails au choix en option, +5 €/pers."}
            </p>
          </div>
        </details>
        <details data-formule="assiette" open={openFormula === "assiette"}>
          <summary
            onClick={(event) => {
              event.preventDefault();
              toggle("assiette");
            }}
          >
            {summary(
              "03",
              en ? "Plated service" : "Service à l’assiette",
              en ? "€60 to €70 · from 30 guests" : "60 à 70 € · dès 30 convives",
            )}
          </summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{en ? "Guests" : "Convives"}</th>
                  <th>{en ? "Without cocktail reception" : "Sans vin d’honneur"}</th>
                  <th>{en ? "With cocktail reception" : "Avec vin d’honneur"}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{en ? "30 to 199" : "30 à 199"}</td>
                  <td>{en ? "€70" : "70 €"}</td>
                  <td>{en ? "€75" : "75 €"}</td>
                </tr>
                <tr>
                  <td>{en ? "200 to 349" : "200 à 349"}</td>
                  <td>{en ? "€65" : "65 €"}</td>
                  <td>{en ? "€70" : "70 €"}</td>
                </tr>
                <tr>
                  <td>{en ? "350+" : "350 et +"}</td>
                  <td>{en ? "€60" : "60 €"}</td>
                  <td>{en ? "€65" : "65 €"}</td>
                </tr>
              </tbody>
            </table>
            <p className="pricing-tier-note">
              {en
                ? "With cocktail reception: 4 cocktails of your choice available as an option, +€5/guest."
                : "Avec vin d’honneur : 4 cocktails au choix en option, +5 €/pers."}
            </p>
          </div>
        </details>
        <details data-formule="aperitifs" open={openFormula === "aperitifs"}>
          <summary
            onClick={(event) => {
              event.preventDefault();
              toggle("aperitifs");
            }}
          >
            {summary(
              "04",
              en ? "Canapés & drinks reception" : "Apéritifs & vin d’honneur",
              en ? "€25 per guest · from 50 guests" : "25 € par personne · dès 50 convives",
            )}
          </summary>
          <div className="fixed-price-detail">
            <div>
              <span>{en ? "Includes" : "Comprend"}</span>
              <p>
                {en
                  ? "10 savoury or sweet bites of your choice · optional: 4 cocktails of your choice, +€5/guest"
                  : "10 pièces salées ou sucrées au choix · en option : 4 cocktails au choix, +5 €/pers."}
              </p>
            </div>
            <strong>
              {en ? "€25" : "25 €"} <small>{en ? "per guest" : "par personne"}</small>
            </strong>
            <a href="#carte">
              {en ? "View our creations" : "Voir les créations"} <ArrowRight size={16} />
            </a>
          </div>
        </details>
        <details data-formule="brunch" open={openFormula === "brunch"}>
          <summary
            onClick={(event) => {
              event.preventDefault();
              toggle("brunch");
            }}
          >
            {summary(
              "05",
              en ? "Signature Brunch" : "Brunch Signature",
              en ? "€35 per guest · from 50 guests" : "35 € par personne · dès 50 convives",
            )}
          </summary>
          <div className="fixed-price-detail">
            <div>
              <span>{en ? "Includes" : "Comprend"}</span>
              <p>
                {en
                  ? "Brunch essentials (pastries, pancakes, eggs, drinks) + 10 savoury or sweet bites of your choice"
                  : "Base commune (viennoiseries, pancakes, œufs, boissons) + 10 pièces salées ou sucrées au choix"}
              </p>
            </div>
            <strong>
              {en ? "€35" : "35 €"} <small>{en ? "per guest" : "par personne"}</small>
            </strong>
            <a href="#calculateur" data-select-formula="brunch">
              {en ? "Estimate my event" : "Estimer mon événement"} <ArrowRight size={16} />
            </a>
          </div>
        </details>
        <details data-formule="barbecue" open={openFormula === "barbecue"}>
          <summary
            onClick={(event) => {
              event.preventDefault();
              toggle("barbecue");
            }}
          >
            {summary(
              "06",
              "Barbecue Party",
              en ? "€60 per guest · from 30 guests" : "60 € par personne · dès 30 convives",
            )}
          </summary>
          <div className="fixed-price-detail">
            <div>
              <span>{en ? "Includes" : "Comprend"}</span>
              <p>
                {en
                  ? "5 savoury or sweet bites · salads · grilled meats · sides. The venue must permit barbecues."
                  : "5 pièces à grignoter · salades · grillades · accompagnements. Le lieu doit autoriser les barbecues."}
              </p>
            </div>
            <strong>
              {en ? "€60" : "60 €"} <small>{en ? "per guest" : "par personne"}</small>
            </strong>
            <a href="#calculateur" data-select-formula="barbecue">
              {en ? "Estimate my event" : "Estimer mon événement"} <ArrowRight size={16} />
            </a>
          </div>
        </details>
        <details data-formule="chef" open={openFormula === "chef"}>
          <summary
            onClick={(event) => {
              event.preventDefault();
              toggle("chef");
            }}
          >
            {summary(
              "07",
              en ? "Private chef" : "Chef à domicile",
              en ? "From €95 per guest · from 12 guests" : "Dès 95 € par personne · dès 12 couverts",
            )}
          </summary>
          <div className="fixed-price-detail">
            <div>
              <span>{en ? "Includes" : "Comprend"}</span>
              <p>
                {en
                  ? "Amuse-bouche, starter, main course, dessert, tableware, linen and service included. Travel costs not included."
                  : "Amuse-bouche, entrée, plat, dessert, vaisselle, nappage et service inclus. Hors frais de déplacement."}
              </p>
            </div>
            <strong>
              {en ? "from €95" : "dès 95 €"} <small>{en ? "per guest" : "par personne"}</small>
            </strong>
            <a href="#calculateur" data-select-formula="chef">
              {en ? "Estimate my event" : "Estimer mon événement"} <ArrowRight size={16} />
            </a>
          </div>
        </details>
      </div>
    </details>
  );
}
