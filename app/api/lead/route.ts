import { createHash } from "node:crypto";
import { submitLead } from "@/lib/leads/service";
import { checkRateLimit } from "@/lib/rate-limit";
import type { LeadPayload } from "@/lib/lead-validation";

/** Тело заявки — это четыре поля. Больше восьми килобайт быть не может. */
const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const MESSAGES = {
  created: "Заявка ушла. Перезвоним в рабочее время: пн–пт, 8:00–20:00, сб–вс, 10:00–18:00.",
  duplicate:
    "Мы уже получили заявку с этим номером — она в работе. Если нужно что-то уточнить, просто позвоните нам.",
  invalid: "Проверьте поля формы: что-то в них не так.",
  tooBig: "Слишком большой текст в заявке — сократите комментарий.",
  broken: "Не получилось прочитать заявку. Обновите страницу и попробуйте ещё раз.",
  rateLimited: "Слишком много отправок с одного адреса. Попробуйте через несколько минут.",
  failed: "Заявка не сохранилась. Позвоните нам или напишите в Telegram — примем вручную.",
} as const;

/** Тело запроса: поля формы плюс служебные метки. */
type LeadRequestBody = Partial<LeadPayload> & { website?: string; page?: string };

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** IP не храним: только хеш с солью — чтобы видеть повторы, но не людей. */
function hashIp(ip: string) {
  const salt = process.env.LEAD_IP_SALT ?? "kvarta-dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function json(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_BODY_BYTES) {
    return json({ ok: false, error: "too_big", message: MESSAGES.tooBig }, 413);
  }

  const ip = clientIp(request);
  const limit = checkRateLimit(`lead:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return json(
      { ok: false, error: "rate_limited", message: MESSAGES.rateLimited, retryAfterSec: limit.retryAfterSec },
      429,
    );
  }

  let payload: LeadRequestBody | null = null;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return json({ ok: false, error: "too_big", message: MESSAGES.tooBig }, 413);
    }
    payload = JSON.parse(text) as LeadRequestBody;
  } catch {
    return json({ ok: false, error: "bad_json", message: MESSAGES.broken }, 400);
  }

  if (!payload || typeof payload !== "object") {
    return json({ ok: false, error: "bad_json", message: MESSAGES.broken }, 400);
  }

  try {
    const result = await submitLead(payload, {
      ipHash: hashIp(ip),
      userAgent: request.headers.get("user-agent") ?? undefined,
      page: typeof payload.page === "string" ? payload.page : undefined,
    });

    switch (result.status) {
      case "created":
        return json({
          ok: true,
          status: "created",
          message: MESSAGES.created,
          lead: { id: result.id, phone: result.phone },
        });

      case "duplicate":
        return json({
          ok: true,
          status: "duplicate",
          message: MESSAGES.duplicate,
          lead: { id: result.id, phone: result.phone },
        });

      case "invalid":
        return json(
          { ok: false, error: "validation", message: MESSAGES.invalid, errors: result.errors },
          422,
        );

      case "bot":
        // Ловушка сработала: боту отвечаем как обычному человеку, но ничего не пишем.
        return json({ ok: true, status: "created", message: MESSAGES.created });

      default:
        return json({ ok: false, error: "unknown", message: MESSAGES.failed }, 500);
    }
  } catch (error) {
    console.error("[api/lead] не удалось сохранить заявку:", error);
    return json({ ok: false, error: "storage", message: MESSAGES.failed }, 500);
  }
}
