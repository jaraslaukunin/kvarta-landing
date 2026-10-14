import { sanitizeAttribution, type Attribution } from "../attribution";
import { validateLead, isBot, type LeadPayload } from "../lead-validation";
import { getLeadStore } from ".";
import type { StoredLead } from "./types";
import { newLeadId } from "./types";
import { notifyTelegram } from "../telegram";

/** Повторная отправка того же номера внутри окна не создаёт новую заявку. */
export const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

export type SubmitContext = {
  ipHash?: string;
  userAgent?: string;
  page?: string;
  now?: number;
};

export type SubmitResult =
  | { status: "created"; id: string; createdAt: number; phone: string }
  | { status: "duplicate"; id: string; createdAt: number; phone: string; attempts: number }
  | { status: "invalid"; errors: Record<string, string> }
  | { status: "bot" };

/**
 * Один вход для API: проверили, записали, при желании отправили в Telegram.
 * Никакого HTTP здесь — так это можно тестировать без сервера.
 */
export async function submitLead(
  payload: Partial<LeadPayload> & { website?: string },
  context: SubmitContext = {},
): Promise<SubmitResult> {
  if (isBot(payload)) {
    return { status: "bot" };
  }

  const checked = validateLead(payload);
  if (!checked.ok) {
    return { status: "invalid", errors: checked.errors };
  }

  const attribution: Attribution = sanitizeAttribution(payload.attribution, context.page);
  const createdAt = context.now ?? Date.now();

  const stored: StoredLead = {
    id: newLeadId(createdAt),
    createdAt,
    name: checked.data.name,
    phone: checked.data.phone.e164,
    interest: checked.data.interest,
    comment: checked.data.comment,
    attribution,
    ipHash: context.ipHash,
    userAgent: context.userAgent?.slice(0, 300),
  };

  const store = await getLeadStore();
  const result = await store.save(stored, DEDUPE_WINDOW_MS);

  if (result.status === "duplicate") {
    console.info(
      `[leads] повтор с того же номера: ${result.id} (попытка ${result.attempts})`,
    );
    return {
      status: "duplicate",
      id: result.id,
      createdAt: result.createdAt,
      phone: stored.phone,
      attempts: result.attempts,
    };
  }

  console.info(
    `[leads] новая заявка ${result.lead.id}: ${stored.name}, ${stored.phone}, ${stored.interest}`,
  );

  // Telegram — приятный бонус, а не условие приёма заявки.
  void notifyTelegram(stored);

  return {
    status: "created",
    id: stored.id,
    createdAt: stored.createdAt,
    phone: stored.phone,
  };
}
