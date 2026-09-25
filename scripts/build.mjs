import { cp, mkdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, shell: process.platform === "win32", stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run(process.execPath, ["scripts/clean.mjs"]);
run(process.platform === "win32" ? "npx.cmd" : "npx", ["tsc"]);
await cp(new URL("../public", import.meta.url), new URL("../dist", import.meta.url), { recursive: true });
await mkdir(new URL("../dist/vendor", import.meta.url), { recursive: true });

const candidates = ["dist/phaser.js", "dist/phaser.min.js"];
let phaserFile;
for (const candidate of candidates) {
  const url = new URL(`../node_modules/phaser/${candidate}`, import.meta.url);
  try { await stat(url); phaserFile = url; break; } catch { /* Try the documented alternative. */ }
}
if (!phaserFile) throw new Error(`No browser-ready Phaser distribution found (checked ${candidates.join(", ")})`);
await cp(phaserFile, new URL("../dist/vendor/phaser.js", import.meta.url));
