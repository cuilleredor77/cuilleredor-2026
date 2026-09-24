"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

type Formula = "buffet" | "plateau" | "assiette" | "aperitifs" | "brunch";

export default function PricingGrids() {
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
        <span>Voir tous les tarifs et paliers</span>
        <small>Les détails complets restent disponibles</small>
        <b aria-hidden="true">+</b>
      </summary>
      <div className="pricing-grids">
        <div className="pricing-grids-heading">
          <strong>Grille tarifaire complète</strong>
          <p>Comparez les tranches de convives et les niveaux de service.</p>
        </div>
        <details data-formule="buffet" open={openFormula === "buffet"}>
          <summary
            onClick={(event) => {
              event.preventDefault();
              toggle("buffet");
            }}
          >
            {summary("01", "Buffet", "35 à 45 € · dès 30 convives")}
          </summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Convives</th>
                  <th>Sans vin d’honneur</th>
                  <th>Avec vin d’honneur (+ 5 €)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>30 à 199</td>
                  <td>45 €</td>
                  <td>50 €</td>
                </tr>
                <tr>
                  <td>200 à 349</td>
                  <td>40 €</td>
                  <td>45 €</td>
                </tr>
                <tr>
                  <td>350 et +</td>
                  <td>35 €</td>
                  <td>40 €</td>
                </tr>
              </tbody>
            </table>
            <p className="pricing-tier-note">
              Prix par adulte, service compris. Tarifs dégressifs selon le
              nombre total de convives (adultes, enfants et prestataires).
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
            {summary("02", "Plateau", "40 à 50 € · dès 30 convives")}
          </summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Convives</th>
                  <th>Sans vin d’honneur</th>
                  <th>Avec vin d’honneur (+ 5 €)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>30 à 199</td>
                  <td>50 €</td>
                  <td>55 €</td>
                </tr>
                <tr>
                  <td>200 à 349</td>
                  <td>45 €</td>
                  <td>50 €</td>
                </tr>
                <tr>
                  <td>350 et +</td>
                  <td>40 €</td>
                  <td>45 €</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
        <details data-formule="assiette" open={openFormula === "assiette"}>
          <summary
            onClick={(event) => {
              event.preventDefault();
              toggle("assiette");
            }}
          >
            {summary("03", "Service à l’assiette", "60 à 70 € · dès 30 convives")}
          </summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Convives</th>
                  <th>Sans vin d’honneur</th>
                  <th>Avec vin d’honneur (+ 5 €)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>30 à 199</td>
                  <td>70 €</td>
                  <td>75 €</td>
                </tr>
                <tr>
                  <td>200 à 349</td>
                  <td>65 €</td>
                  <td>70 €</td>
                </tr>
                <tr>
                  <td>350 et +</td>
                  <td>60 €</td>
                  <td>65 €</td>
                </tr>
              </tbody>
            </table>
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
              "Apéritifs & vin d’honneur",
              "25 € par personne · dès 50 convives",
            )}
          </summary>
          <div className="fixed-price-detail">
            <div>
              <span>Comprend</span>
              <p>10 pièces salées ou sucrées au choix · cocktails en option</p>
            </div>
            <strong>
              25 € <small>par personne</small>
            </strong>
            <a href="#carte">
              Voir les créations <ArrowRight size={16} />
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
              "Brunch Signature",
              "35 € par personne · dès 50 convives",
            )}
          </summary>
          <div className="fixed-price-detail">
            <div>
              <span>Comprend</span>
              <p>
                Base commune (viennoiseries, pancakes, œufs, boissons) + 10
                pièces salées ou sucrées au choix
              </p>
            </div>
            <strong>
              35 € <small>par personne</small>
            </strong>
            <a href="#formulaire-brunch">
              Demander un devis brunch <ArrowRight size={16} />
            </a>
          </div>
        </details>
      </div>
    </details>
  );
}
