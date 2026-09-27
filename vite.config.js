import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { localTicket } from "./build/local-ticket-plugin";
import { sites } from "./build/sites-vite-plugin";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => ({
  root: resolve(projectRoot, "src/client"),
  publicDir: resolve(projectRoot, "src/client/public"),
  build: { outDir: resolve(projectRoot, "dist/client"), emptyOutDir: true },
  server: process.env.CODEX_SANDBOX === "seatbelt"
    ? { watch: { useFsEvents: false, usePolling: true } }
    : undefined,
  plugins: [
    sites({ projectRoot }),
    localTicket({ privateJwk: loadEnv(mode, projectRoot, "").HOLODECK_TICKET_PRIVATE_JWK }),
  ],
}));
