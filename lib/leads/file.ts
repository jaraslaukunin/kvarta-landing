import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { LeadStore, SaveResult, StoredLead } from "./types";

const HEADER = "# Кварта: заявки построчно, по одной JSON-записи в строке.";

/**
 * Файловое хранилище — запасной вариант для serverless:
 * на Vercel писать можно только в /tmp, и файл живёт до перезапуска инстанса.
 * Для демонстрации формы этого хватает, для работы — нужен SQLite или Redis.
 */
export class FileLeadStore implements LeadStore {
  readonly kind = "file" as const;
  readonly location: string;
  /** phone -> id, чтобы не читать файл на каждую заявку */
  private readonly recent = new Map<string, { id: string; createdAt: number; attempts: number }>();

  private constructor(file: string) {
    this.location = file;
  }

  static open(file: string): FileLeadStore {
    mkdirSync(path.dirname(file), { recursive: true });
    const store = new FileLeadStore(file);
    store.load();
    return store;
  }

  private load() {
    if (!existsSync(this.location)) {
      appendFileSync(this.location, HEADER + "\n", "utf8");
      return;
    }
    const content = readFileSync(this.location, "utf8");
    for (const line of content.split("\n")) {
      if (!line || line.startsWith("#")) continue;
      try {
        const lead = JSON.parse(line) as StoredLead & { duplicateAttempts?: number };
        this.recent.set(lead.phone, {
          id: lead.id,
          createdAt: lead.createdAt,
          attempts: lead.duplicateAttempts ?? 1,
        });
      } catch {
        // битую строку просто игнорируем, чтобы не терять остальные заявки
      }
    }
  }

  async save(lead: StoredLead, windowMs: number): Promise<SaveResult> {
    const cutoff = lead.createdAt - windowMs;
    const existing = this.recent.get(lead.phone);

    if (existing && existing.createdAt >= cutoff) {
      existing.attempts += 1;
      appendFileSync(
        this.location,
        JSON.stringify({ ...lead, duplicateOf: existing.id, stored: false }) + "\n",
        "utf8",
      );
      return {
        status: "duplicate",
        id: existing.id,
        createdAt: existing.createdAt,
        attempts: existing.attempts,
      };
    }

    appendFileSync(this.location, JSON.stringify(lead) + "\n", "utf8");
    this.recent.set(lead.phone, { id: lead.id, createdAt: lead.createdAt, attempts: 1 });
    return { status: "created", lead };
  }

  async count(): Promise<number> {
    const content = readFileSync(this.location, "utf8");
    return content.split("\n").filter((line) => line && !line.startsWith("#") && line.includes('"phone"')).length;
  }

  async latest(limit: number): Promise<StoredLead[]> {
    const content = readFileSync(this.location, "utf8");
    return content
      .split("\n")
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        try {
          return JSON.parse(line) as StoredLead;
        } catch {
          return null;
        }
      })
      .filter((lead): lead is StoredLead => Boolean(lead))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  async close(): Promise<void> {}
}
