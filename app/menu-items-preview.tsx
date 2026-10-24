// Liste de plats d’une catégorie : les 3 premiers visibles, le reste dans un volet
// <details> (contenu toujours présent dans le HTML pour l’indexation).
const VISIBLE_COUNT = 3;

export default function MenuItemsPreview({
  items,
  keyPrefix,
  en = false,
  wrap = false,
}: {
  items: string[];
  keyPrefix: string;
  en?: boolean;
  wrap?: boolean;
}) {
  const render = (item: string) => (
    <li key={`${keyPrefix}-${item}`}>{wrap ? <span>{item}</span> : item}</li>
  );
  // un bouton pour un seul plat caché n’a pas d’intérêt : on affiche tout
  const visible = items.length > VISIBLE_COUNT + 1 ? VISIBLE_COUNT : items.length;
  const rest = items.slice(visible);
  return (
    <>
      <ul>{items.slice(0, visible).map(render)}</ul>
      {rest.length > 0 && (
        <details className="menu-items-more">
          <summary>
            <span className="menu-items-more-open">
              {en ? `Show ${rest.length} more` : `Voir les ${rest.length} autres`}
            </span>
            <span className="menu-items-more-close">
              {en ? "Show less" : "Voir moins"}
            </span>
          </summary>
          <ul>{rest.map(render)}</ul>
        </details>
      )}
    </>
  );
}
