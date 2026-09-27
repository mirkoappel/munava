import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const outputRoot = resolve(projectRoot, "dist");

await rm(outputRoot, { recursive: true, force: true });
await build();
await removeFinderMetadata(resolve(outputRoot, "client"));
await mkdir(resolve(outputRoot, "server"), { recursive: true });
await copyFile(
  resolve(projectRoot, "src/server/index.js"),
  resolve(outputRoot, "server/index.js"),
);

async function removeFinderMetadata(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.name === ".DS_Store") await rm(path);
    else if (entry.isDirectory()) await removeFinderMetadata(path);
  }
}
