import type { Attribution } from "../attribution";
import type { Interest } from "../lead-validation";

export type StoredLead = {
  id: string;
  createdAt: number;
  name: string;
  /** нормализованный номер: +375XXXXXXXXX */
  phone: string;
  interest: Interest;
  comment: string;
  attribution: Attribution;
  /** IP не храним — только соль + хеш, чтобы видеть повторы с одного адреса */
  ipHash?: string;
  userAgent?: string;
};

export type SaveResult =
  | { status: "created"; lead: StoredLead }
  | { status: "duplicate"; id: string; createdAt: number; attempts: number };

/**
 * Хранилище заявок.
 *
 * Важное требование: save() сам решает, дубль это или новая заявка,
 * и делает проверку вместе с записью без `await` между ними —
 * иначе двойной клик по кнопке успевал бы создать две заявки.
 */
export interface LeadStore {
  readonly kind: "sqlite" | "redis" | "file" | "memory";
  /** где лежат данные: путь к файлу или адрес Redis */
  readonly location: string;
  save(lead: StoredLead, windowMs: number): Promise<SaveResult>;
  count(): Promise<number>;
  latest(limit: number): Promise<StoredLead[]>;
  close(): Promise<void>;
}

export function newLeadId(now = Date.now()) {
  const random = Math.random().toString(36).slice(2, 8);
  return `ld_${now.toString(36)}${random}`;
}
