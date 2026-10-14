import { getLeadStore } from "@/lib/leads";

/**
 * Проверка после деплоя: отвечает ли приложение и какое хранилище выбрано.
 * Специально не отдаём пути и содержимое — только режим работы.
 */
export async function GET() {
  try {
    const store = await getLeadStore();
    return Response.json(
      {
        ok: true,
        store: store.kind,
        telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
        time: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      { ok: false, error: (error as Error).message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
