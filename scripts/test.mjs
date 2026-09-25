import { rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
await rm(new URL("../.test-dist", import.meta.url), { force: true, recursive: true });
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, shell: process.platform === "win32", stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
run(process.platform === "win32" ? "npx.cmd" : "npx", ["tsc", "--outDir", ".test-dist"]);
run(process.execPath, ["--test", "tests/*.test.mjs"]);
