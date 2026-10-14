import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { LeadStore, SaveResult, StoredLead } from "./types";
import { newLeadId } from "./types";

type Row = {
  id: string;
  created_at: number;
  name: string;
  phone: string;
  interest: string;
  comment: string;
  attribution: string;
  ip_hash: string | null;
  user_agent: string | null;
  duplicate_attempts: number;
};

/**
 * SQLite — основной вариант для нормального хостинга (VPS, Docker, локально):
 * один файл, никаких внешних сервисов, заявки переживают перезапуск.
 *
 * Используем встроенный в Node модуль node:sqlite, поэтому нативных сборок нет.
 * На serverless (Vercel) файловая система только для чтения, кроме /tmp,
 * и данные между инстансами не общие — там лучше Redis (см. redis.ts).
 */
export class SqliteLeadStore implements LeadStore {
  readonly kind = "sqlite" as const;
  readonly location: string;

  private constructor(
    private readonly db: import("node:sqlite").DatabaseSync,
    location: string,
  ) {
    this.location = location;
  }

  static async open(file: string): Promise<SqliteLeadStore> {
    await mkdir(path.dirname(file), { recursive: true });
    const { DatabaseSync } = await import("node:sqlite");
    const db = new DatabaseSync(file);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA busy_timeout = 4000");
    db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        interest TEXT NOT NULL,
        comment TEXT NOT NULL DEFAULT '',
        attribution TEXT NOT NULL DEFAULT '{}',
        ip_hash TEXT,
        user_agent TEXT,
        duplicate_attempts INTEGER NOT NULL DEFAULT 0
      )
    `);
    db.exec(
      "CREATE INDEX IF NOT EXISTS leads_phone_created_idx ON leads (phone, created_at DESC)",
    );
    return new SqliteLeadStore(db, file);
  }

  async save(lead: StoredLead, windowMs: number): Promise<SaveResult> {
    const cutoff = lead.createdAt - windowMs;
    // Ни одного await между проверкой и вставкой: двойной клик не проскочит.
    const existing = this.db
      .prepare(
        "SELECT id, created_at, duplicate_attempts FROM leads WHERE phone = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 1",
      )
      .get(lead.phone, cutoff) as
      | { id: string; created_at: number; duplicate_attempts: number }
      | undefined;

    if (existing) {
      this.db
        .prepare("UPDATE leads SET duplicate_attempts = duplicate_attempts + 1 WHERE id = ?")
        .run(existing.id);
      return {
        status: "duplicate",
        id: existing.id,
        createdAt: existing.created_at,
        attempts: existing.duplicate_attempts + 1,
      };
    }

    this.db
      .prepare(
        `INSERT INTO leads (id, created_at, name, phone, interest, comment, attribution, ip_hash, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        lead.id,
        lead.createdAt,
        lead.name,
        lead.phone,
        lead.interest,
        lead.comment,
        JSON.stringify(lead.attribution),
        lead.ipHash ?? null,
        lead.userAgent ?? null,
      );

    return { status: "created", lead };
  }

  async count(): Promise<number> {
    const row = this.db.prepare("SELECT COUNT(*) AS total FROM leads").get() as {
      total: number;
    };
    return Number(row.total);
  }

  async latest(limit: number): Promise<StoredLead[]> {
    const rows = this.db
      .prepare("SELECT * FROM leads ORDER BY created_at DESC LIMIT ?")
      .all(Math.max(1, Math.min(limit, 200))) as Row[];
    return rows.map(toLead);
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

export function toLead(row: Row): StoredLead {
  let attribution = {};
  try {
    attribution = JSON.parse(row.attribution);
  } catch {
    attribution = {};
  }
  return {
    id: row.id,
    createdAt: Number(row.created_at),
    name: row.name,
    phone: row.phone,
    interest: row.interest as StoredLead["interest"],
    comment: row.comment,
    attribution: attribution as StoredLead["attribution"],
    ipHash: row.ip_hash ?? undefined,
    userAgent: row.user_agent ?? undefined,
  };
}

export { newLeadId };
