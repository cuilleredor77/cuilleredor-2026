import { json, requireAdmin, setting } from "../../../../lib/server";
import { agendaOnDate } from "../../../../lib/automation";

// Nombre d'événements déjà prévus dans le Google Agenda à une date (alerte de la fiche).
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const date = new URL(request.url).searchParams.get("date") || "";
  return json({ connected: Boolean(setting("GSHEET_FINDER_URL")), agenda: await agendaOnDate(date) });
}
