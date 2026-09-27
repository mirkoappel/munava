import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";

process.env.WRANGLER_SEND_METRICS ??= "false";
process.env.WRANGLER_WRITE_LOGS ??= "false";
process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

export default defineConfig({
  server: process.env.CODEX_SANDBOX === "seatbelt"
    ? { watch: { useFsEvents: false, usePolling: true } }
    : undefined,
  plugins: [sites(), cloudflare()],
});
