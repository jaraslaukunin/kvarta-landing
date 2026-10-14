import { normalizeByPhone, type PhoneOk } from "./phone";
import type { Attribution } from "./attribution";

export const INTERESTS = ["subscription", "order", "question"] as const;
export type Interest = (typeof INTERESTS)[number];

export const INTEREST_LABELS: Record<Interest, string> = {
  subscription: "Подписка",
  order: "Разовый заказ",
  question: "Вопрос",
};

export const LIMITS = {
  name: 80,
  comment: 1000,
  phone: 25,
} as const;

export type LeadDraft = {
  name: string;
  phone: string;
  interest: Interest;
  comment: string;
  /** скрытое поле-ловушка: люди его не видят, боты заполняют */
  website: string;
};

export type LeadPayload = LeadDraft & { attribution?: Attribution };

export type LeadErrors = Partial<Record<"name" | "phone" | "interest" | "comment" | "form", string>>;

export type ValidatedLead = {
  name: string;
  phone: PhoneOk;
  interest: Interest;
  comment: string;
};

export function emptyDraft(interest: Interest = "order"): LeadDraft {
  return { name: "", phone: "", interest, comment: "", website: "" };
}

function isInterest(value: unknown): value is Interest {
  return typeof value === "string" && (INTERESTS as readonly string[]).includes(value);
}

/**
 * Одна проверка для клиента и для сервера: на клиенте — чтобы подсказать сразу,
 * на сервере — потому что клиенту доверять нельзя.
 */
export function validateLead(
  input: Partial<LeadPayload>,
): { ok: true; data: ValidatedLead } | { ok: false; errors: LeadErrors } {
  const errors: LeadErrors = {};

  const name = (input.name ?? "").trim().replace(/\s+/g, " ");
  if (!name) {
    errors.name = "Напишите, как к вам обращаться.";
  } else if (name.length < 2) {
    errors.name = "Имя слишком короткое — хотя бы две буквы.";
  } else if (name.length > LIMITS.name) {
    errors.name = `Слишком длинно: до ${LIMITS.name} символов.`;
  } else if (!/\p{L}/u.test(name)) {
    errors.name = "В имени нужны буквы, иначе мы не поймём, к кому обращаться.";
  }

  const phone = normalizeByPhone(input.phone ?? "");
  if (!phone.ok) {
    errors.phone = phone.message;
  }

  const interest = isInterest(input.interest) ? input.interest : null;
  if (!interest) {
    errors.interest = "Выберите, что интересует.";
  }

  const comment = (input.comment ?? "").toString().trim();
  if (comment.length > LIMITS.comment) {
    errors.comment = `Комментарий длинноват: до ${LIMITS.comment} символов.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      name,
      phone: phone as PhoneOk,
      interest: interest as Interest,
      comment,
    },
  };
}

/** Совсем грубая проверка ловушки: люди туда ничего не пишут. */
export function isBot(payload: Partial<LeadPayload>): boolean {
  return typeof payload.website === "string" && payload.website.trim().length > 0;
}
