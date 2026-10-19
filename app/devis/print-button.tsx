"use client";

export default function PrintButton({ fileName }: { fileName: string }) {
  return (
    <button
      type="button"
      className="dv-print"
      onClick={() => {
        const previous = document.title;
        document.title = fileName;
        window.print();
        setTimeout(() => (document.title = previous), 1500);
      }}
    >
      Télécharger en PDF
    </button>
  );
}
