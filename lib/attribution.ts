import { attributionKeys, type AttributionKey } from "./site";

export type Attribution = Partial<Record<AttributionKey, string>> & {
  /** откуда пришёл: внешний переход, поиск, реклама */
  referrer?: string;
  /** первый адрес, на который попал человек */
  landing?: string;
  /** адрес страницы с формой */
  page?: string;
};

export const EMPTY_ATTRIBUTION: Attribution = {};

const MAX_PARAM = 180;
const MAX_URL = 500;

function clip(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return clean.length > 0 ? clean : undefined;
}

/** Собираем метки из адреса страницы — вызывается на клиенте один раз при первом визите. */
export function readAttribution(url: URL, referrer: string): Attribution {
  const result: Attribution = {};

  for (const key of attributionKeys) {
    const value = clip(url.searchParams.get(key), MAX_PARAM);
    if (value) result[key] = value;
  }

  const ref = clip(referrer, MAX_URL);
  if (ref) {
    try {
      const host = new URL(ref).host;
      if (host && host !== url.host) {
        result.referrer = ref;
      }
    } catch {
      // реферер может быть мусором — просто не пишем его
    }
  }

  result.landing = clip(url.pathname + url.search, MAX_URL);
  return result;
}

/** Всё, что прилетело на сервер в поле attribution, пропускаем через тот же белый список. */
export function sanitizeAttribution(input: unknown, page?: string): Attribution {
  const source = (input ?? {}) as Record<string, unknown>;
  const result: Attribution = {};

  for (const key of attributionKeys) {
    const value = clip(source[key], MAX_PARAM);
    if (value) result[key] = value;
  }

  const referrer = clip(source.referrer, MAX_URL);
  if (referrer) result.referrer = referrer;

  const landing = clip(source.landing, MAX_URL);
  if (landing) result.landing = landing;

  const pageValue = clip(page, MAX_URL) ?? clip(source.page, MAX_URL);
  if (pageValue) result.page = pageValue;

  return result;
}

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  yandex: "Яндекс",
  google: "Google",
  vk: "VK",
  tiktok: "TikTok",
  facebook: "Facebook",
};

/** Человеческая строка для менеджера и Telegram: «instagram / сторис про Эфиопию». */
export function describeAttribution(attr: Attribution): string {
  const parts: string[] = [];

  const source = attr.utm_source ?? attr.referrer;
  if (attr.utm_source) {
    parts.push(SOURCE_LABELS[attr.utm_source.toLowerCase()] ?? attr.utm_source);
  } else if (attr.referrer) {
    try {
      parts.push(new URL(attr.referrer).host);
    } catch {
      parts.push(attr.referrer);
    }
  }

  if (attr.utm_medium) parts.push(attr.utm_medium);
  if (attr.utm_campaign) parts.push("кампания: " + attr.utm_campaign);
  if (attr.utm_content) parts.push("объявление: " + attr.utm_content);
  if (attr.utm_term) parts.push("ключ: " + attr.utm_term);
  for (const clickId of ["yclid", "gclid", "fbclid"] as const) {
    if (attr[clickId]) parts.push(clickId + "…" + attr[clickId]!.slice(-6));
  }
  if (attr.landing) parts.push("вошёл на " + attr.landing);
  if (!source && !parts.length) parts.push("прямой заход");

  return parts.join(" · ");
}
