import { readdir, stat } from "node:fs/promises";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";

const distUrl = new URL("../dist/", import.meta.url);
const distPath = fileURLToPath(distUrl);

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? walk(path) : [{ path, bytes: (await stat(path)).size }];
  }));
  return nested.flat();
};

let files;
try {
  files = await walk(distPath);
} catch (error) {
  console.error("Unable to inspect dist/. Run npm run build first.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const format = (bytes) => `${bytes.toLocaleString("en-US")} bytes (${(bytes / 1_000_000).toFixed(2)} MB)`;
const named = files.map((file) => ({ ...file, name: relative(distPath, file.path).replaceAll("\\", "/") }));
const artwork = named.filter(({ name }) => name.startsWith("assets/artwork/"));
const total = named.reduce((sum, file) => sum + file.bytes, 0);
const artworkTotal = artwork.reduce((sum, file) => sum + file.bytes, 0);

console.log(`Total dist: ${format(total)}`);
console.log(`Total artwork: ${format(artworkTotal)}`);
console.log("Artwork files:");
for (const file of artwork.sort((a, b) => a.name.localeCompare(b.name))) console.log(`  ${file.name}: ${format(file.bytes)}`);
console.log("Largest files:");
for (const file of named.sort((a, b) => b.bytes - a.bytes).slice(0, 10)) console.log(`  ${file.name}: ${format(file.bytes)}`);

if (total > 80_000_000) console.warn("WARNING: dist exceeds 80,000,000 bytes.");
if (total > 100_000_000) process.exitCode = 1;
