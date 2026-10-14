import { tmpdir } from "node:os";
import path from "node:path";
import { FileLeadStore } from "./file";
import { MemoryLeadStore } from "./memory";
import { RedisLeadStore } from "./redis";
import { SqliteLeadStore } from "./sqlite";
import type { LeadStore } from "./types";

let cached: Promise<LeadStore> | null = null;

const DEFAULT_DB = "data/leads.sqlite";
const FALLBACK_FILE = "kvarta-leads.jsonl";

/**
 * Выбор хранилища:
 *   1. LEAD_STORE=memory            — тесты;
 *   2. Upstash Redis (env)          — serverless: данные общие, SET NX держит дубли;
 *   3. SQLite (по умолчанию)        — VPS, Docker, локальный запуск: один файл;
 *   4. файл в /tmp                  — если писать в проект нельзя (Vercel).
 */
export async function createLeadStore(): Promise<LeadStore> {
  const kind = process.env.LEAD_STORE?.trim().toLowerCase();
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kind === "memory") {
    return new MemoryLeadStore();
  }

  if (kind === "redis" || (!kind && redisUrl && redisToken)) {
    if (!redisUrl || !redisToken) {
      throw new Error("Для LEAD_STORE=redis нужны UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN");
    }
    return new RedisLeadStore(redisUrl, redisToken);
  }

  if (kind === "file") {
    return FileLeadStore.open(
      process.env.LEAD_FILE_PATH ?? path.join(tmpdir(), FALLBACK_FILE),
    );
  }

  const dbPath = process.env.LEAD_DB_PATH ?? path.join(process.cwd(), DEFAULT_DB);
  try {
    return await SqliteLeadStore.open(dbPath);
  } catch (error) {
    // Типичный случай: serverless с read-only файловой системой.
    console.warn(
      `[leads] SQLite недоступен (${(error as Error).message}), переключаюсь на файл в /tmp`,
    );
    return FileLeadStore.open(path.join(tmpdir(), FALLBACK_FILE));
  }
}

export function getLeadStore(): Promise<LeadStore> {
  if (!cached) {
    cached = createLeadStore();
  }
  return cached;
}

/** Для тестов: сбросить выбранное хранилище. */
export function resetLeadStore() {
  cached = null;
}

export type { LeadStore } from "./types";
export type { SaveResult, StoredLead } from "./types";
export { newLeadId } from "./types";
