"use client";

// Deux PDF possibles : le devis seul, ou le devis suivi du contrat.
export default function PrintButton({ fileName, quoteOnly = false }: { fileName: string; quoteOnly?: boolean }) {
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
      {quoteOnly ? null : (
        <button type="button" className="dv-print" onClick={() => print(false)}>
          Devis + contrat
        </button>
      )}
    </div>
  );
}

export function AmendmentPrintButton({ fileName }: { fileName: string }) {
  const print = () => {
    const previous = document.title;
    document.title = fileName;
    window.print();
    setTimeout(() => { document.title = previous; }, 1500);
  };
  return (
    <div className="dv-print-group">
      <button type="button" className="dv-print" onClick={print}>Télécharger l’avenant en PDF</button>
    </div>
  );
}
