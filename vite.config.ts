import vinext from "vinext";
import { defineConfig } from "vite";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
};

// @cloudflare/vite-plugin's dev mode proxies every request through the
// simulated Workers runtime (matching production routing exactly), which
// means Vite's own dev middleware never runs — including its CSS pipeline.
// vinext's RSC app router doesn't know how to serve raw dev CSS either, so
// the result is an unstyled page (see /assets/* production bug that shipped
// earlier: same root cause, different manifestation).
// Default dev therefore skips the plugin (styled pages, real HMR, no
// binding simulation). Opt into accurate ASSETS/IMAGES binding simulation
// with `VINEXT_CF_SIM=1 npm run dev` when you need to test those. `vinext
// build` requires the plugin unconditionally, so it's always on for builds.
const useCloudflareSim = process.env.VINEXT_CF_SIM === "1";

export default defineConfig(async ({ command }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  const cloudflarePlugin = command === "build" || useCloudflareSim
    ? [
        // Wrangler snapshots its log path while the Cloudflare plugin is imported.
        (await import("@cloudflare/vite-plugin")).cloudflare({
          viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
          inspectorPort: false,
          config: localBindingConfig,
        }),
      ]
    : [];

  return {
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [vinext(), ...cloudflarePlugin],
  };
});
