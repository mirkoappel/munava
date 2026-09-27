import { cloudflare } from "@cloudflare/vite-plugin";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

process.env.WRANGLER_SEND_METRICS ??= "false";
process.env.WRANGLER_WRITE_LOGS ??= "false";
process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

export default defineConfig({
  root: resolve(projectRoot, "src/client"),
  publicDir: resolve(projectRoot, "src/client/public"),
  build: { outDir: resolve(projectRoot, "dist") },
  server: process.env.CODEX_SANDBOX === "seatbelt"
    ? { watch: { useFsEvents: false, usePolling: true } }
    : undefined,
  environments: {
    client: { build: { outDir: resolve(projectRoot, "dist/client"), emptyOutDir: true } },
    holodeck_sites: { build: { outDir: resolve(projectRoot, "dist/server"), emptyOutDir: true } },
  },
  plugins: [sites({ projectRoot }), cloudflare({ configPath: resolve(projectRoot, "wrangler.json") })],
});
