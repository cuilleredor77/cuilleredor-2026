/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

// The site embeds exactly one third-party frame (Google Forms for quote
// requests). External scripts are limited to the Metricool tracker and the
// Cloudflare Web Analytics beacon (injected by Cloudflare: script on
// static.cloudflareinsights.com, measurements sent to cloudflareinsights.com).
const SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://tracker.metricool.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://tracker.metricool.com; font-src 'self'; frame-src 'self' https://docs.google.com; connect-src 'self' https://tracker.metricool.com https://cloudflareinsights.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'",
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "geolocation=(), camera=(), microphone=(), payment=()",
  "strict-transport-security": "max-age=63072000; includeSubDomains",
};

// Une seule adresse officielle : https://cuilleredor.fr. Les autres adresses
// qui servent ce worker (www, http, adresse technique workers.dev) renvoient
// une redirection 301 vers la même page sur l'adresse officielle.
const CANONICAL_HOST = "cuilleredor.fr";
const REDIRECTED_HOSTS = new Set([
  "cuilleredor.fr",
  "www.cuilleredor.fr",
  "cuilleredor-2026.cuilleredor4.workers.dev",
]);

// Le passage http -> https n'est décidé que si Cloudflare confirme que le
// visiteur est en http (en-tête cf-visitor) : sans cette confirmation, une
// requête https vue en http par un proxy bouclerait sur elle-même.
function isPlainHttpVisit(request: Request, url: URL): boolean {
  const visitor = request.headers.get("cf-visitor") ?? "";
  return url.protocol === "http:" && /"scheme"\s*:\s*"http"/.test(visitor);
}

function canonicalRedirect(request: Request, url: URL): Response | null {
  if (!REDIRECTED_HOSTS.has(url.hostname)) return null;
  if (url.hostname === CANONICAL_HOST && !isPlainHttpVisit(request, url)) return null;
  const target = `https://${CANONICAL_HOST}${url.pathname}${url.search}`;
  return new Response(null, { status: 301, headers: { location: target } });
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (import.meta.env.PROD) {
      const redirect = canonicalRedirect(request, url);
      if (redirect) return redirect;
    }

    // The dev server (vite serving unbundled source files) doesn't set
    // production-grade content-type headers, so `nosniff` + CSP there break
    // things like raw .css requests. Only harden real deployments.
    const applyHeaders = import.meta.env.PROD
      ? withSecurityHeaders
      : (response: Response) => response;

    // « cuilleredor.fr/liseuse » (sans barre finale) mène à la liseuse du catalogue.
    if (url.pathname === "/liseuse") {
      return new Response(null, { status: 301, headers: { location: `/liseuse/${url.search}${url.hash}` } });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return applyHeaders(response);
    }

    return applyHeaders(await handler.fetch(request, env, ctx));
  },
};

export default worker;
