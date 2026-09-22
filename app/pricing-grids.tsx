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
            {summary("01", "Buffet", "À partir de 35 € · 10 à 199 convives")}
          </summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Convives</th>
                  <th>Avec vin d’honneur</th>
                  <th>Sans vin d’honneur</th>
                  <th>Sans service</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>10 à 199</td>
                  <td>45 €</td>
                  <td>40 €</td>
                  <td>35 €</td>
                </tr>
                <tr>
                  <td>200 à 349</td>
                  <td>40 €</td>
                  <td>35 €</td>
                  <td>30 €</td>
                </tr>
                <tr>
                  <td>350 et +</td>
                  <td>35 €</td>
                  <td>30 €</td>
                  <td>25 €</td>
                </tr>
              </tbody>
            </table>
            <p className="pricing-tier-note">
              Tarifs dégressifs pour les grandes réceptions. Le tarif de 25 €
              s’applique à partir de 350 convives, sans service.
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
            {summary("02", "Plateau", "Dès 35 € · avec ou sans vin d’honneur")}
          </summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Convives</th>
                  <th>Avec vin d’honneur</th>
                  <th>Sans vin d’honneur</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>10 à 199</td>
                  <td>50 €</td>
                  <td>45 €</td>
                </tr>
                <tr>
                  <td>200 à 349</td>
                  <td>45 €</td>
                  <td>40 €</td>
                </tr>
                <tr>
                  <td>350 et +</td>
                  <td>40 €</td>
                  <td>35 €</td>
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
            {summary(
              "03",
              "Service à l’assiette",
              "Dès 60 € · avec ou sans vin d’honneur",
            )}
          </summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Convives</th>
                  <th>Avec vin d’honneur</th>
                  <th>Sans vin d’honneur</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>10 à 199</td>
                  <td>70 €</td>
                  <td>65 €</td>
                </tr>
                <tr>
                  <td>200 à 349</td>
                  <td>65 €</td>
                  <td>60 €</td>
                </tr>
                <tr>
                  <td>350 et +</td>
                  <td colSpan={2}>Sur demande</td>
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
              "25 € par personne · tarif unique",
            )}
          </summary>
          <div className="fixed-price-detail">
            <div>
              <span>Comprend</span>
              <p>10 créations salées et sucrées · 4 cocktails signature</p>
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
              "25 à 30 € · selon les convives",
            )}
          </summary>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Convives</th>
                  <th>Tarif</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>10 à 199</td>
                  <td>30 €</td>
                </tr>
                <tr>
                  <td>200 à 349</td>
                  <td>25 €</td>
                </tr>
                <tr>
                  <td>350 et +</td>
                  <td>Sur demande</td>
                </tr>
              </tbody>
            </table>
            <p className="pricing-tier-note">
              Comprend viennoiseries, pièces salées et sucrées, œufs, fruits
              et boissons.
            </p>
            <a className="fixed-price-cta" href="#formulaire-brunch">
              Demander un devis brunch <ArrowRight size={16} />
            </a>
          </div>
        </details>
      </div>
    </details>
  );
}
