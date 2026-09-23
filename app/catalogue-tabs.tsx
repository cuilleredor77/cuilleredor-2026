import type { ReactNode } from "react";

export default function CatalogueTabs({
  aperitifs,
  plats,
}: {
  aperitifs: ReactNode;
  plats: ReactNode;
}) {
  return (
    <div className="catalogue-tabs catalogue-tabs-single">
      {aperitifs}
      {plats}
    </div>
  );
}
