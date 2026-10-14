import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatMinskDate,
  fromMinsk,
  nextOrderRoast,
  roastEvent,
  splitCountdown,
  toMinsk,
} from "../lib/roast-schedule";

test("считает минское время независимо от часового пояса машины", () => {
  const moment = toMinsk(fromMinsk(2025, 10, 16, 7, 30));
  assert.equal(moment.year, 2025);
  assert.equal(moment.month, 10);
  assert.equal(moment.day, 16);
  assert.equal(moment.weekday, 4);
  assert.equal(moment.hours, 7);
  assert.equal(moment.minutes, 30);
});

test("утро четверга — обжариваем сегодня", () => {
  const event = roastEvent(fromMinsk(2025, 10, 16, 7, 0));
  assert.equal(event.state, "roast-today");
  assert.match(event.note, /завтра/);
});

test("вечер четверга — фасуем", () => {
  const event = roastEvent(fromMinsk(2025, 10, 16, 17, 0));
  assert.equal(event.state, "packing-today");
});

test("пятница — день доставки, следующая обжарка через неделю", () => {
  const event = roastEvent(fromMinsk(2025, 10, 17, 12, 0));
  assert.equal(event.state, "delivery-today");
  assert.equal(formatMinskDate(event.nextRoast), "23 октября");
  assert.equal(formatMinskDate(event.lastRoast), "16 октября");
});

test("понедельник — ждём ближайший четверг, дедлайн в среду", () => {
  const event = roastEvent(fromMinsk(2025, 10, 13, 10, 0));
  assert.equal(event.state, "before-roast");
  assert.equal(formatMinskDate(event.nextRoast), "16 октября");
  assert.equal(formatMinskDate(event.deadline), "15 октября");
});

test("заявка после дедлайна уходит в следующую партию", () => {
  assert.equal(formatMinskDate(nextOrderRoast(fromMinsk(2025, 10, 13, 10, 0))), "16 октября");
  assert.equal(formatMinskDate(nextOrderRoast(fromMinsk(2025, 10, 15, 19, 0))), "16 октября");
  assert.equal(formatMinskDate(nextOrderRoast(fromMinsk(2025, 10, 15, 21, 0))), "23 октября");
  assert.equal(formatMinskDate(nextOrderRoast(fromMinsk(2025, 10, 16, 9, 0))), "23 октября");
});

test("отсчёт разбивается на дни, часы, минуты и секунды", () => {
  const parts = splitCountdown(2 * 86_400_000 + 3 * 3_600_000 + 4 * 60_000 + 5_000);
  assert.deepEqual(parts, { days: 2, hours: 3, minutes: 4, seconds: 5 });
  assert.deepEqual(splitCountdown(-100), { days: 0, hours: 0, minutes: 0, seconds: 0 });
});
