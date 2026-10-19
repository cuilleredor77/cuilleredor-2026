"use client";

import { useEffect } from "react";

type Formula =
  | "buffet"
  | "plateau"
  | "assiette"
  | "aperitifs"
  | "brunch"
  | "barbecue"
  | "chef";

export default function FormulaExperience() {
  useEffect(() => {
    const showMenu = (formula: Formula) => {
      document.documentElement.dataset.selectedFormula = formula;
      document
        .querySelectorAll<HTMLDetailsElement>(".formula-menu-list > details")
        .forEach((panel) => {
          panel.open = panel.dataset.menuFormula === formula;
        });
      // la carte de la formule choisie reste en surbrillance au-dessus de son menu
      document
        .querySelectorAll<HTMLElement>(".offers-picker .offer-card")
        .forEach((card) => {
          if (card.dataset.selectFormula === formula)
            card.setAttribute("aria-current", "true");
          else card.removeAttribute("aria-current");
        });
    };

    const onFormula = (event: Event) => {
      const formula = (event as CustomEvent<Formula>).detail;
      document.documentElement.dataset.commercialFormula = formula;
      showMenu(formula);
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLElement>(
        "[data-select-formula]",
      );
      if (!link) return;
      const formula = link.dataset.selectFormula as Formula;
      event.preventDefault();
      if (link.dataset.formulaTarget === "menu") showMenu(formula);
      else
        window.dispatchEvent(
          new CustomEvent<Formula>("cuillere:formula", { detail: formula }),
        );
      link
        .closest<HTMLDetailsElement>(".formula-switcher")
        ?.removeAttribute("open");
      const target = document.getElementById(
        link.dataset.formulaTarget === "menu" ? "carte" : "calculateur",
      );
      // menu : on ne descend que s'il n'est pas déjà bien visible sous les cartes
      const limit =
        link.dataset.formulaTarget === "menu" ? window.innerHeight * 0.7 : 80;
      if (target && target.getBoundingClientRect().top > limit) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    document.documentElement.dataset.commercialFormula = "buffet";
    showMenu("buffet");
    window.addEventListener("cuillere:formula", onFormula);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("cuillere:formula", onFormula);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
