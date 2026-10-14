/**
 * Белорусские номера: +375 и девять цифр.
 * Коды мобильных операторов — двухзначные, городские — трёхзначные,
 * поэтому проверяем не только длину, но и код: «+375 11 …» принят не будет.
 */

const MOBILE_CODES = new Set(["25", "29", "33", "44"]);

/** Городские коды из трёх цифр; у Минска код двухзначный — 17. */
const AREA_CODES = new Set([
  "152", // Гродно
  "162", // Брест
  "163", // Барановичи
  "164", // Пинск
  "177", // Борисов
  "212", // Витебск
  "213", // Орша
  "214", // Полоцк
  "216", // Новополоцк
  "222", // Могилёв
  "223", // Бобруйск
  "224", // Горки
  "232", // Гомель
  "233", // Жлобин
  "234", // Речица
  "235", // Светлогорск
]);

export type PhoneOk = {
  ok: true;
  /** +375XXXXXXXXX — то, что уходит менеджеру и в базу */
  e164: string;
  /** 9 цифр без кода страны — ключ дедупликации */
  national: string;
  /** +375 (29) 123-45-67 — то, что видит человек */
  pretty: string;
};

export type PhoneFail = {
  ok: false;
  code: "empty" | "short" | "long" | "foreign" | "unknown-code";
  message: string;
};

export type PhoneResult = PhoneOk | PhoneFail;

export const PHONE_HINT = "+375 (29) 123-45-67";

const MESSAGES: Record<PhoneFail["code"], string> = {
  empty: "Без номера не сможем перезвонить — впишите, пожалуйста.",
  short: `В номере не хватает цифр. Формат: ${PHONE_HINT}`,
  long: `Цифр больше, чем нужно. Формат: ${PHONE_HINT}`,
  foreign: `Принимаем белорусские номера: ${PHONE_HINT}. Возим по Минску, поэтому чужие коды не подойдут.`,
  "unknown-code": `Такого кода в Беларуси нет. Проверьте номер — формат ${PHONE_HINT}`,
};

function fail(code: PhoneFail["code"]): PhoneFail {
  return { ok: false, code, message: MESSAGES[code] };
}

const SHORT_CODES = new Set([...MOBILE_CODES, "17"]);

/** У мобильных и у Минска код из двух цифр, у остальных городов — из трёх. */
function codeLength(national: string) {
  return SHORT_CODES.has(national.slice(0, 2)) ? 2 : 3;
}

function prettyFromNational(national: string) {
  const length = codeLength(national);
  const code = national.slice(0, length);
  const rest = national.slice(length);
  const groups =
    length === 2
      ? [rest.slice(0, 3), rest.slice(3, 5), rest.slice(5, 7)]
      : [rest.slice(0, 2), rest.slice(2, 4), rest.slice(4, 6)];
  return `+375 (${code}) ${groups.filter(Boolean).join("-")}`;
}

/** Разбор того, что человек ввёл руками: +375…, 375…, 80…, 0…, 29… */
export function normalizeByPhone(raw: string): PhoneResult {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return fail("empty");

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return fail("short");

  let national: string | null = null;

  if (digits.startsWith("375")) {
    national = digits.slice(3);
  } else if (digits.startsWith("80") && digits.length >= 11) {
    national = digits.slice(2);
  } else if (digits.startsWith("0")) {
    national = digits.slice(1);
  } else if (digits.length === 9 && !digits.startsWith("0")) {
    national = digits;
  } else if (digits.startsWith("375") === false && digits.length > 11) {
    return fail("long");
  } else {
    return fail("foreign");
  }

  if (national.length < 9) return fail("short");
  if (national.length > 9) return fail("long");

  const isMobile = MOBILE_CODES.has(national.slice(0, 2));
  // Минск — 17 и семь цифр, остальные города — трёхзначный код
  const isArea =
    national.startsWith("17") ? national.length === 9 : AREA_CODES.has(national.slice(0, 3));
  if (!isMobile && !isArea) return fail("unknown-code");

  return {
    ok: true,
    e164: `+375${national}`,
    national,
    pretty: prettyFromNational(national),
  };
}

/** Маска для поля ввода: достраивает +375 (…) по мере набора. */
export function formatByPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  let national = digits;
  if (digits.startsWith("375")) national = digits.slice(3);
  else if (digits.startsWith("80")) national = digits.slice(2);
  else if (digits.startsWith("0")) national = digits.slice(1);

  national = national.slice(0, 9);
  if (!national) return "+375 ";

  const length = codeLength(national);
  const code = national.slice(0, length);
  const rest = national.slice(length);

  if (national.length < length) return `+375 (${code}`;

  // мобильные: 2 + 7 цифр → XXX-XX-XX; городские: 3 + 6 цифр → XX-XX-XX
  const groups: string[] = [];
  let index = 0;
  for (const size of length === 2 ? [3, 2, 2] : [2, 2, 2]) {
    const chunk = rest.slice(index, index + size);
    if (!chunk) break;
    groups.push(chunk);
    index += size;
  }

  return `+375 (${code})${groups.length ? " " + groups.join("-") : ""}`;
}
