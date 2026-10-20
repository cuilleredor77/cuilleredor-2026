"use client";

// Deux PDF possibles : le devis seul, ou le devis suivi du contrat.
export default function PrintButton({ fileName }: { fileName: string }) {
  const print = (quoteOnly: boolean) => {
    const previous = document.title;
    document.title = quoteOnly ? fileName.replace(/_Devis_Contrat$/, "_Devis") : fileName;
    document.body.classList.toggle("dv-quote-only", quoteOnly);
    window.print();
    setTimeout(() => {
      document.title = previous;
      document.body.classList.remove("dv-quote-only");
    }, 1500);
  };
  return (
    <div className="dv-print-group">
      <span className="dv-print-label">Télécharger en PDF :</span>
      <button type="button" className="dv-print dv-print-alt" onClick={() => print(true)}>
        Devis seul
      </button>
      <button type="button" className="dv-print" onClick={() => print(false)}>
        Devis + contrat
      </button>
    </div>
  );
}
