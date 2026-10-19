import { json, requireAdmin } from "../../../../lib/server";
import { roundTripKm } from "../../../../lib/geo";

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { address?: string };
  const address = (body.address || "").trim();
  if (address.length < 4) return json({ error: "Indiquez l’adresse de l’événement." }, { status: 400 });
  const result = await roundTripKm(address);
  if ("error" in result) return json(result, { status: 404 });
  return json(result);
}
