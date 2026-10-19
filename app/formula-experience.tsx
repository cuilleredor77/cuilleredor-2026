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
      if (target && target.getBoundingClientRect().top > 80) {
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
