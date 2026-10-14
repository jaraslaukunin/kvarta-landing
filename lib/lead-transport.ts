"use client";

import type { LeadDraft, LeadErrors } from "./lead-validation";

/**
 * Куда отправляется заявка.
 *
 * 1. `api` — свой эндпоинт (NEXT_PUBLIC_LEAD_ENDPOINT или /api/lead на том же домене).
 *    Так работает Node-хостинг и Vercel: проверка, дедупликация и запись в базу на сервере.
 * 2. `relay` — статический хостинг (GitHub Pages) без сервера: отправляем через
 *    внешний приёмник писем (FormSubmit). Серверной дедупликации тут нет, поэтому
 *    окно в 10 минут держим на клиенте через localStorage.
 * 3. `none` — ничего не настроено: форма честно предложит телефон и Telegram.
 */

export type TransportKind = "api" | "relay" | "none";

const ENDPOINT = process.env.NEXT_PUBLIC_LEAD_ENDPOINT ?? "";
const RELAY_EMAIL = process.env.NEXT_PUBLIC_FORM_RELAY_EMAIL ?? "";
const DEDUPE_KEY = "kvarta:last-lead:v1";
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

export const transportKind: TransportKind = ENDPOINT
  ? "api"
  : RELAY_EMAIL
    ? "relay"
    : "none";

export const leadEndpoint = ENDPOINT || "/api/lead";

export type SendPayload = LeadDraft & {
  attribution: Record<string, string | undefined>;
  page?: string;
};

export type SendResult =
  | { status: "created" }
  | { status: "duplicate" }
  | { status: "invalid"; errors: LeadErrors; message?: string }
  | { status: "failed"; title: string; text: string };

function rememberPhone(phone: string) {
  try {
    window.localStorage.setItem(DEDUPE_KEY, JSON.stringify({ phone, at: Date.now() }));
  } catch {
    // приватный режим — обойдёмся без клиентской памяти
  }
}

/** Клиентская страховка от двойного клика там, где нет сервера. */
function recentlySent(phone: string) {
  try {
    const raw = window.localStorage.getItem(DEDUPE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw) as { phone?: string; at?: number };
    return saved.phone === phone && typeof saved.at === "number" && Date.now() - saved.at < DEDUPE_WINDOW_MS;
  } catch {
    return false;
  }
}

async function sendToApi(payload: SendPayload): Promise<SendResult> {
  const response = await fetch(leadEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, page: payload.page }),
  });

  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; status?: string; message?: string; errors?: LeadErrors }
    | null;

  if (response.ok && data?.ok) {
    return data.status === "duplicate" ? { status: "duplicate" } : { status: "created" };
  }

  if (response.status === 422 && data?.errors) {
    return { status: "invalid", errors: data.errors, message: data.message };
  }

  return {
    status: "failed",
    title: response.status === 429 ? "Слишком часто" : "Заявка не ушла",
    text: data?.message ?? "Сервер не ответил. Позвоните нам — примем заявку по телефону.",
  };
}

async function sendToRelay(payload: SendPayload): Promise<SendResult> {
  if (recentlySent(payload.phone)) {
    return { status: "duplicate" };
  }

  const body = {
    _subject: `Заявка с сайта: ${payload.name}`,
    _template: "table",
    _captcha: "false",
    Имя: payload.name,
    Телефон: payload.phone,
    Интересует: payload.interest,
    Комментарий: payload.comment || "—",
    Источник: JSON.stringify(payload.attribution),
    Страница: payload.page ?? "—",
  };

  const response = await fetch(`https://formsubmit.co/ajax/${RELAY_EMAIL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => null)) as { success?: string | boolean } | null;

  if (response.ok && data && (data.success === true || data.success === "true")) {
    rememberPhone(payload.phone);
    return { status: "created" };
  }

  return {
    status: "failed",
    title: "Заявка не ушла",
    text: "Форма не смогла передать заявку. Позвоните нам или напишите в Telegram — примем вручную.",
  };
}

export async function sendLead(payload: SendPayload): Promise<SendResult> {
  if (transportKind === "api") return sendToApi(payload);
  if (transportKind === "relay") return sendToRelay(payload);
  return {
    status: "failed",
    title: "Здесь нет сервера",
    text: "Это демонстрационная копия на GitHub Pages: заявки принимаем по телефону или в Telegram.",
  };
}
