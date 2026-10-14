import { describeAttribution } from "./attribution";
import { INTEREST_LABELS } from "./lead-validation";
import type { StoredLead } from "./leads/types";

const API = "https://api.telegram.org";

export function telegramEnabled(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Minsk",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatLeadMessage(lead: StoredLead) {
  const lines = [
    "<b>Новая заявка — обжарка «Кварта»</b>",
    `Имя: ${escapeHtml(lead.name)}`,
    `Телефон: <a href="tel:${lead.phone}">${lead.phone}</a>`,
    `Интерес: ${INTEREST_LABELS[lead.interest] ?? lead.interest}`,
  ];

  if (lead.comment) {
    lines.push(`Комментарий: ${escapeHtml(lead.comment)}`);
  }

  lines.push(`Источник: ${escapeHtml(describeAttribution(lead.attribution))}`);
  lines.push(`Время: ${timeFormatter.format(new Date(lead.createdAt))} (Минск)`);
  lines.push(`Заявка: <code>${lead.id}</code>`);

  return lines.join("\n");
}

/**
 * Необязательный шаг: если бот настроен — продублируем заявку менеджеру.
 * Ошибка Telegram не должна ломать приём заявки, поэтому глушим её в лог.
 */
export async function notifyTelegram(
  lead: StoredLead,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!telegramEnabled()) return { ok: true, skipped: true };

  const token = process.env.TELEGRAM_BOT_TOKEN as string;
  const chatId = process.env.TELEGRAM_CHAT_ID as string;

  try {
    const response = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatLeadMessage(lead),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[telegram] не отправилось:", response.status, detail.slice(0, 300));
      return { ok: false, error: `Telegram ответил ${response.status}` };
    }

    return { ok: true };
  } catch (error) {
    console.error("[telegram] ошибка сети:", error);
    return { ok: false, error: (error as Error).message };
  }
}
