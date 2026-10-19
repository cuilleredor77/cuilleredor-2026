// Accès base de données (Cloudflare D1) et authentification de l'espace privé.
import { env } from "cloudflare:workers";
import type { RequestRow } from "./quote";

type D1Result<T> = { results: T[] };
type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  all: <T = unknown>() => Promise<D1Result<T>>;
  first: <T = unknown>() => Promise<T | null>;
  run: () => Promise<{ meta: { last_row_id?: number; changes?: number } }>;
};
export type D1 = { prepare: (sql: string) => D1Statement };

type AppEnv = { DB?: D1; ADMIN_PASSWORD?: string };

export function db(): D1 {
  const binding = (env as unknown as AppEnv).DB;
  if (!binding) throw new Error("Base de données D1 indisponible (binding DB).");
  return binding;
}

export async function getRequestByToken(token: string): Promise<RequestRow | null> {
  return db().prepare("SELECT * FROM requests WHERE token = ?").bind(token).first<RequestRow>();
}

export async function getRequestById(id: number): Promise<RequestRow | null> {
  return db().prepare("SELECT * FROM requests WHERE id = ?").bind(id).first<RequestRow>();
}

export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------- Session administrateur (cookie signé) ----------

const COOKIE = "cdo_admin";
const SESSION_DAYS = 14;

function adminPassword(): string | null {
  const value = (env as unknown as AppEnv).ADMIN_PASSWORD;
  return value && value.length >= 8 ? value : null;
}

export function adminConfigured(): boolean {
  return adminPassword() !== null;
}

async function sign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPassword(candidate: string): Promise<boolean> {
  const expected = adminPassword();
  if (!expected) return false;
  const a = await sign("pw", candidate);
  const b = await sign("pw", expected);
  return safeEqual(a, b);
}

export async function sessionCookie(): Promise<string> {
  const secret = adminPassword();
  if (!secret) throw new Error("ADMIN_PASSWORD non configuré");
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  const value = `${expires}.${await sign(String(expires), secret)}`;
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`;
}

export function clearCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAdmin(request: Request): Promise<boolean> {
  const secret = adminPassword();
  if (!secret) return false;
  const header = request.headers.get("cookie") || "";
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${COOKIE}=`));
  if (!match) return false;
  const [expires, signature] = match.slice(COOKIE.length + 1).split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return safeEqual(signature, await sign(expires, secret));
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...(init.headers || {}) },
  });
}

export async function requireAdmin(request: Request): Promise<Response | null> {
  if (await isAdmin(request)) return null;
  return json({ error: "Non autorisé" }, { status: 401 });
}
