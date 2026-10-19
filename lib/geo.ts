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

async function geocode(query: string): Promise<{ lat: number; lon: number; label: string } | null> {
  const res = await get(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=fr,be,ch,lu,de&q=${encodeURIComponent(query)}`,
  );
  if (!res || !res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!data[0]) return null;
  return { lat: Number(data[0].lat), lon: Number(data[0].lon), label: data[0].display_name };
}

export type Distance = { km: number; oneWay: number; resolved: string };

/** Km aller-retour, ou un message d'erreur lisible. */
export async function roundTripKm(address: string): Promise<Distance | { error: string }> {
  const origin =
    (await geocode("8 Allée des Bois, 77240 Vert-Saint-Denis")) || (await geocode("77240 Vert-Saint-Denis"));
  // Lieux-dits et châteaux sont souvent inconnus : on retente avec la commune (dernier segment après une virgule).
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const target = (await geocode(address)) || (parts.length > 1 ? await geocode(parts[parts.length - 1]) : null);
  if (!origin || !target) return { error: "Adresse introuvable. Précisez la ville et le code postal." };
  const route = await get(
    `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${target.lon},${target.lat}?overview=false`,
  );
  if (!route || !route.ok) return { error: "Calcul d’itinéraire indisponible, saisissez les km à la main." };
  const data = (await route.json()) as { routes?: Array<{ distance: number }> };
  const meters = data.routes?.[0]?.distance;
  if (!meters) return { error: "Itinéraire introuvable." };
  const oneWay = meters / 1000;
  return { km: Math.round(oneWay * 2 * 10) / 10, oneWay: Math.round(oneWay * 10) / 10, resolved: target.label };
}
