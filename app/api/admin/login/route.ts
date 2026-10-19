import { adminConfigured, checkPassword, clearCookie, json, sessionCookie } from "../../../../lib/server";

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return json({ error: "Mot de passe de l’espace privé non configuré." }, { status: 503 });
  }
  let password = "";
  try {
    password = String((await request.json()).password ?? "");
  } catch {
    /* mot de passe vide */
  }
  if (!(await checkPassword(password))) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  return json({ ok: true }, { headers: { "set-cookie": await sessionCookie() } });
}

export async function DELETE() {
  return json({ ok: true }, { headers: { "set-cookie": clearCookie() } });
}
