import type { LeadStore, SaveResult, StoredLead } from "./types";

/** Хранилище в памяти: тесты и проверка логики без файлов. */
export class MemoryLeadStore implements LeadStore {
  readonly kind = "memory" as const;
  readonly location = "memory";
  private readonly leads: StoredLead[] = [];

  async save(lead: StoredLead, windowMs: number): Promise<SaveResult> {
    const cutoff = lead.createdAt - windowMs;
    const existing = this.leads
      .filter((item) => item.phone === lead.phone && item.createdAt >= cutoff)
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    if (existing) {
      const attempts = this.leads.filter((item) => item.id === existing.id).length;
      return {
        status: "duplicate",
        id: existing.id,
        createdAt: existing.createdAt,
        attempts,
      };
    }

    this.leads.push(lead);
    return { status: "created", lead };
  }

  async count(): Promise<number> {
    return this.leads.length;
  }

  async latest(limit: number): Promise<StoredLead[]> {
    return [...this.leads].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  async close(): Promise<void> {
    this.leads.length = 0;
  }
}
