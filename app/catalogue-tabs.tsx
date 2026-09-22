import type { ReactNode } from "react";

export default function CatalogueTabs({ plats }: { plats: ReactNode }) {
  return <div className="catalogue-tabs catalogue-tabs-single">{plats}</div>;
}
