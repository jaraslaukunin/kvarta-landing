#!/usr/bin/env node
/**
 * Сборка статической версии для GitHub Pages.
 *
 * Next не умеет экспортировать проект, в котором есть API-роуты, а они нужны
 * обычной сборке. Поэтому на время экспорта папка app/api убирается в сторону
 * и возвращается на место — даже если сборка упала.
 */
import { spawnSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "app", "api");
const stash = path.join(root, ".api-stash");

const restore = () => {
  if (existsSync(stash)) renameSync(stash, apiDir);
};

process.on("exit", restore);
process.on("SIGINT", () => {
  restore();
  process.exit(130);
});

if (existsSync(apiDir)) renameSync(apiDir, stash);
if (existsSync(path.join(root, "data"))) {
  // локальная база в статическую сборку не нужна
}

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  env: { ...process.env, STATIC_EXPORT: "1" },
  shell: process.platform === "win32",
});

restore();
process.exit(result.status ?? 1);
