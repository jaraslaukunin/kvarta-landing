import type { LeadStore, SaveResult, StoredLead } from "./types";

type Command = (string | number)[];

/**
 * Upstash Redis (REST) — вариант для serverless: данные общие для всех инстансов,
 * а дедупликация держится на атомарном SET NX PX, то есть на самой Redis.
 * Включается переменными UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN.
 */
export class RedisLeadStore implements LeadStore {
  readonly kind = "redis" as const;
  readonly location: string;

  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly prefix = "kvarta",
  ) {
    this.location = url;
  }

  private async pipeline(commands: Command[]) {
    const response = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Upstash ответил ${response.status}`);
    }
    return (await response.json()) as { result: unknown; error?: string }[];
  }

  async save(lead: StoredLead, windowMs: number): Promise<SaveResult> {
    const dedupeKey = `${this.prefix}:dedupe:${lead.phone}`;

    // SET NX — атомарно: кто первый, тот и создал заявку.
    const [setResult] = await this.pipeline([
      ["SET", dedupeKey, lead.id, "NX", "PX", windowMs],
    ]);

    if (setResult?.result === null || setResult?.result === undefined) {
      const [, attemptsResult] = await this.pipeline([
        ["HINCRBY", `${this.prefix}:dupes`, lead.phone, 1],
      ]);
      return {
        status: "duplicate",
        id: String(setResult?.result ?? ""),
        createdAt: lead.createdAt,
        attempts: Number(attemptsResult?.result ?? 1),
      };
    }

    await this.pipeline([
      ["LPUSH", `${this.prefix}:leads`, JSON.stringify(lead)],
      ["INCR", `${this.prefix}:leads:count`],
      ["SET", `${this.prefix}:lead:${lead.id}`, JSON.stringify(lead), "EX", 60 * 60 * 24 * 90],
    ]);

    return { status: "created", lead };
  }

  async count(): Promise<number> {
    const [result] = await this.pipeline([["GET", `${this.prefix}:leads:count`]]);
    return Number(result?.result ?? 0);
  }

  async latest(limit: number): Promise<StoredLead[]> {
    const [result] = await this.pipeline([
      ["LRANGE", `${this.prefix}:leads`, 0, Math.max(0, limit - 1)],
    ]);
    const rows = Array.isArray(result?.result) ? (result.result as string[]) : [];
    return rows.flatMap((row) => {
      try {
        return [JSON.parse(row) as StoredLead];
      } catch {
        return [];
      }
    });
  }

  async close(): Promise<void> {}
}
