import { json, requireAdmin } from "../../../../lib/server";

// Distance routière aller-retour depuis Vert-Saint-Denis (OpenStreetMap : Nominatim + OSRM, gratuits).
const UA = "CuillereDor-Devis/1.0 (contact@cuilleredor.fr)";

async function geocode(query: string): Promise<{ lat: number; lon: number; label: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=fr,be,ch,lu,de&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "user-agent": UA, "accept-language": "fr" } });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!data[0]) return null;
  return { lat: Number(data[0].lat), lon: Number(data[0].lon), label: data[0].display_name };
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { address?: string };
  const address = (body.address || "").trim();
  if (address.length < 4) return json({ error: "Indiquez l’adresse de l’événement." }, { status: 400 });

  const origin =
    (await geocode("8 Allée des Bois, 77240 Vert-Saint-Denis")) ||
    (await geocode("77240 Vert-Saint-Denis"));
  const target = await geocode(address);
  if (!origin || !target) {
    return json({ error: "Adresse introuvable. Précisez la ville et le code postal." }, { status: 404 });
  }
  const route = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${target.lon},${target.lat}?overview=false`,
    { headers: { "user-agent": UA } },
  );
  if (!route.ok) return json({ error: "Calcul d’itinéraire indisponible, saisissez les km à la main." }, { status: 502 });
  const data = (await route.json()) as { routes?: Array<{ distance: number }> };
  const meters = data.routes?.[0]?.distance;
  if (!meters) return json({ error: "Itinéraire introuvable." }, { status: 404 });
  const oneWay = meters / 1000;
  return json({ km: Math.round(oneWay * 2 * 10) / 10, oneWay: Math.round(oneWay * 10) / 10, resolved: target.label });
}
