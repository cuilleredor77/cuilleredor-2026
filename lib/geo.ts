// Distance routière aller-retour depuis Vert-Saint-Denis (OpenStreetMap : Nominatim + OSRM, gratuits).
const UA = "CuillereDor-Devis/1.0 (contact@cuilleredor.fr)";
const TIMEOUT_MS = 6000;

async function get(url: string): Promise<Response | null> {
  try {
    return await fetch(url, {
      headers: { "user-agent": UA, "accept-language": "fr" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

type Place = { lat: number; lon: number; label: string; kind: string; postcode: string };

/** Département écrit par le client : code postal à 5 chiffres, ou numéro seul en fin d'adresse / entre parenthèses (« Bièvres 91 »). */
export function departmentOf(address: string): string {
  const postcode = address.match(/\b(\d{5})\b/);
  if (postcode) return postcode[1].startsWith("97") ? postcode[1].slice(0, 3) : postcode[1].slice(0, 2);
  const tail = address.match(/(?:^|[\s,(])(0[1-9]|[1-8]\d|9[0-5]|2[ABab]|97[1-6])\)?\s*$/);
  if (tail) return tail[1].toUpperCase();
  const paren = address.match(/\((0[1-9]|[1-8]\d|9[0-5]|2[ABab]|97[1-6])\)/);
  return paren ? paren[1].toUpperCase() : "";
}

function inDepartment(postcode: string, dept: string): boolean {
  if (!dept) return true;
  if (!postcode) return false;
  if (dept === "2A" || dept === "2B") return postcode.startsWith("20");
  return postcode.startsWith(dept);
}

/** Géocode ; si un département est connu, ne garde qu'un résultat situé dans ce département. */
async function geocode(query: string, dept = ""): Promise<Place | null> {
  const res = await get(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=${dept ? 10 : 1}&countrycodes=fr,be,ch,lu,de&q=${encodeURIComponent(query)}`,
  );
  if (!res || !res.ok) return null;
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    addresstype?: string;
    address?: { postcode?: string };
  }>;
  const hit = data.find((d) => inDepartment(d.address?.postcode || "", dept));
  if (!hit) return null;
  return {
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    label: hit.display_name,
    kind: hit.addresstype || "",
    postcode: hit.address?.postcode || "",
  };
}

// adresse : km exacts · ville : km estimés depuis la commune · departement : déplacement à chiffrer (pas de km)
export type Precision = "adresse" | "ville" | "departement";
export type Distance = { km: number; oneWay: number; resolved: string; precision: Precision };

const AREA = ["county", "state", "region", "country", "state_district"];
const TOWN = ["city", "town", "village", "municipality", "hamlet", "suburb", "postcode", "city_district", "borough", "quarter", "neighbourhood"];

/** Trouve le lieu : l'adresse telle quelle, sinon la commune (dernier segment, puis derniers mots). */
async function findPlace(address: string): Promise<{ place: Place; precision: Precision } | null> {
  const dept = departmentOf(address);
  const exact = await geocode(address, dept);
  if (exact) {
    if (AREA.includes(exact.kind)) return { place: exact, precision: "departement" };
    return { place: exact, precision: TOWN.includes(exact.kind) ? "ville" : "adresse" };
  }
  // Commune seule : sans le numéro de département (que Nominatim lit mal), mais en vérifiant qu'on reste dedans
  const clean = dept && !/\d{5}/.test(address) ? address.replace(/[\s,(]*\(?[0-9AB]{2,3}\)?\s*$/i, "") : address;
  const parts = clean.split(",").map((part) => part.trim()).filter(Boolean);
  const words = clean.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  const tries = [parts.length > 1 ? parts[parts.length - 1] : "", words.slice(-2).join(" "), words.slice(-1).join(" ")];
  for (const query of [...new Set(tries)].filter((q) => q.length >= 3)) {
    const place = await geocode(query, dept);
    if (place && TOWN.includes(place.kind)) return { place, precision: "ville" };
  }
  return null;
}

/** Km aller-retour, ou un message d'erreur lisible. */
export async function roundTripKm(address: string): Promise<Distance | { error: string; precision?: Precision }> {
  const origin =
    (await geocode("8 Allée des Bois, 77240 Vert-Saint-Denis")) || (await geocode("77240 Vert-Saint-Denis"));
  const found = await findPlace(address);
  if (!origin || !found) return { error: "Adresse introuvable. Précisez la ville et le code postal." };
  if (found.precision === "departement") {
    return { error: "Seul le département est indiqué : frais de déplacement à chiffrer.", precision: "departement" };
  }
  const target = found.place;
  const route = await get(
    `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${target.lon},${target.lat}?overview=false`,
  );
  if (!route || !route.ok) return { error: "Calcul d’itinéraire indisponible, saisissez les km à la main." };
  const data = (await route.json()) as { routes?: Array<{ distance: number }> };
  const meters = data.routes?.[0]?.distance;
  if (!meters) return { error: "Itinéraire introuvable." };
  const oneWay = meters / 1000;
  return {
    km: Math.round(oneWay * 2 * 10) / 10,
    oneWay: Math.round(oneWay * 10) / 10,
    resolved: target.label,
    precision: found.precision,
  };
}
