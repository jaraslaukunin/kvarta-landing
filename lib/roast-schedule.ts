/**
 * Расписание обжарки: печь включается в четверг утром,
 * доставка по Минску — в пятницу. Время считаем по Минску (UTC+3, без перехода).
 *
 * Функции чистые, чтобы их можно было проверить тестами и отрисовать на клиенте,
 * не сверяя часы с сервером.
 */

const MINSK_OFFSET_MIN = 180;
const ROAST_WEEKDAY = 4; // четверг
const ROAST_HOUR = 8;
const ROAST_END_HOUR = 15;
const PACK_HOUR = 16;
const DELIVERY_WEEKDAY = 5; // пятница
/** крайний срок приёма заявок — среда, 20:00, то есть вечер перед обжаркой */
const ORDER_DEADLINE_HOUR = 20;

export type MinskMoment = {
  /** дата в Минске */
  year: number;
  month: number; // 1–12
  day: number;
  weekday: number; // 0 = воскресенье
  hours: number;
  minutes: number;
  /** «сырые» миллисекунды момента */
  ms: number;
};

/** Перевод момента в минское настенное время. */
export function toMinsk(now: Date): MinskMoment {
  const shifted = new Date(now.getTime() + MINSK_OFFSET_MIN * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    ms: now.getTime(),
  };
}

/** Минское настенное время → реальный Date. */
export function fromMinsk(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hours, minutes) - MINSK_OFFSET_MIN * 60_000);
}

type CalendarDay = { year: number; month: number; day: number };

function addDays(moment: CalendarDay, days: number): CalendarDay {
  const shifted = new Date(Date.UTC(moment.year, moment.month - 1, moment.day) + days * 86_400_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function daysUntil(moment: MinskMoment, weekday: number) {
  return (weekday - moment.weekday + 7) % 7;
}

export type RoastEvent = {
  /** что показывать в блоке с обратным отсчётом */
  state: "roast-today" | "packing-today" | "delivery-today" | "before-roast";
  title: string;
  note: string;
  /** до какого момента считаем */
  target: Date;
  /** дата ближайшей обжарки (четверг, 8:00) */
  nextRoast: Date;
  /** крайний срок приёма заявок — среда, 20:00 перед этой обжаркой */
  deadline: Date;
  /** дата обжарки, которая сейчас лежит в пачках */
  lastRoast: Date;
};

/**
 * Что сейчас происходит у обжарки и когда следующий раз.
 * now передаём аргументом — так функцию можно тестировать.
 */
export function roastEvent(now: Date): RoastEvent {
  const m = toMinsk(now);
  const toNextThursday = daysUntil(m, ROAST_WEEKDAY);
  const nextRoastDay = addDays(m, toNextThursday);
  const nextRoast = fromMinsk(nextRoastDay.year, nextRoastDay.month, nextRoastDay.day, ROAST_HOUR);

  const prevThursdayDays = -((m.weekday - ROAST_WEEKDAY + 7) % 7);
  const lastRoastDay = addDays(m, prevThursdayDays);
  const lastRoast = fromMinsk(lastRoastDay.year, lastRoastDay.month, lastRoastDay.day, ROAST_HOUR);

  const deadlineDay = addDays(nextRoastDay, -1);
  const deadline = fromMinsk(
    deadlineDay.year,
    deadlineDay.month,
    deadlineDay.day,
    ORDER_DEADLINE_HOUR,
  );

  const isRoastDay = m.weekday === ROAST_WEEKDAY && m.hours < ROAST_END_HOUR;
  if (isRoastDay) {
    const packDay = addDays(m, 0);
    return {
      state: "roast-today",
      title: "Сегодня обжариваем",
      note: "Развозим завтра, в пятницу. Сейчас как раз можно успеть в эту партию звонком.",
      target: fromMinsk(packDay.year, packDay.month, packDay.day, PACK_HOUR),
      nextRoast,
      deadline,
      lastRoast,
    };
  }

  const isDeliveryDay = m.weekday === DELIVERY_WEEKDAY;
  if (isDeliveryDay) {
    return {
      state: "delivery-today",
      title: "Сегодня развозим по Минску",
      note: "Следующая обжарка — в четверг. Заявки принимаем до среды, 20:00.",
      target: nextRoast,
      nextRoast,
      deadline,
      lastRoast,
    };
  }

  const isPackingDay = m.weekday === ROAST_WEEKDAY && m.hours >= ROAST_END_HOUR;
  return {
    state: isPackingDay ? "packing-today" : "before-roast",
    title: "Ближайшая обжарка",
    note: isPackingDay
      ? "Партия обжарена, фасуем сегодня. Заявки — уже на следующую неделю."
      : "Заявки принимаем до среды, 20:00. Кто не успел — попадёт в следующую партию.",
    target: isPackingDay ? nextRoast : nextRoast,
    nextRoast,
    deadline,
    lastRoast,
  };
}

/**
 * В какую партию попадёт заявка, отправленная в этот момент:
 * если крайний срок (среда, 20:00) уже прошёл — значит в следующую.
 */
export function nextOrderRoast(now: Date): Date {
  const event = roastEvent(now);
  if (now.getTime() <= event.deadline.getTime()) {
    return event.nextRoast;
  }
  const next = new Date(event.nextRoast.getTime() + 7 * 86_400_000);
  return next;
}

const dayFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Minsk",
  day: "numeric",
  month: "long",
});

const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Minsk",
  weekday: "long",
});

export function formatMinskDate(date: Date) {
  return dayFormatter.format(date);
}

export function formatMinskWeekday(date: Date) {
  return weekdayFormatter.format(date);
}

/** «3 дня 04:21:15» — компактный отсчёт. */
export function splitCountdown(msLeft: number) {
  const safe = Math.max(0, msLeft);
  return {
    days: Math.floor(safe / 86_400_000),
    hours: Math.floor((safe / 3_600_000) % 24),
    minutes: Math.floor((safe / 60_000) % 60),
    seconds: Math.floor((safe / 1000) % 60),
  };
}
