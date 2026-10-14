import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

// хранилище в памяти: тесты не должны трогать файлы проекта
process.env.LEAD_STORE = "memory";

import { resetLeadStore } from "../lib/leads";
import { MemoryLeadStore } from "../lib/leads/memory";
import { DEDUPE_WINDOW_MS, submitLead } from "../lib/leads/service";

// каждый тест начинает с чистого хранилища, иначе времена прошлых заявок мешают
beforeEach(() => {
  resetLeadStore();
});

const base = {
  name: "Аня",
  phone: "+375 29 123-45-67",
  interest: "subscription" as const,
  comment: "Смолоть под воронку",
  website: "",
};

test("создаёт заявку и нормализует телефон", async () => {
  const result = await submitLead(base);
  assert.equal(result.status, "created");
  if (result.status === "created") {
    assert.equal(result.phone, "+375291234567");
    assert.match(result.id, /^ld_/);
  }
});

test("двойное нажатие на кнопку не создаёт вторую заявку", async () => {
  const now = Date.UTC(2025, 9, 13, 9, 0);
  const first = await submitLead(base, { now });
  const second = await submitLead(base, { now: now + 2_000 });
  const third = await submitLead(base, { now: now + 60_000 });

  assert.equal(first.status, "created");
  assert.equal(second.status, "duplicate");
  assert.equal(third.status, "duplicate");
  if (second.status === "duplicate") {
    assert.equal(second.attempts, 1);
    assert.equal(third.status === "duplicate" && third.id, second.id);
  }
});

test("через 10 минут тот же номер принимается снова", async () => {
  const now = Date.UTC(2025, 9, 14, 9, 0);
  await submitLead(base, { now });
  const afterWindow = await submitLead(base, { now: now + DEDUPE_WINDOW_MS + 1_000 });
  assert.equal(afterWindow.status, "created");
});

test("разные номера не мешают друг другу", async () => {
  const now = Date.UTC(2025, 9, 15, 9, 0);
  const first = await submitLead({ ...base, phone: "+375 29 111-11-11" }, { now });
  const second = await submitLead({ ...base, phone: "+375 29 222-22-22" }, { now });
  assert.equal(first.status, "created");
  assert.equal(second.status, "created");
});

test("возвращает понятные ошибки по полям", async () => {
  const result = await submitLead({ ...base, name: "1", phone: "+7 999 000-00-00" });
  assert.equal(result.status, "invalid");
  if (result.status === "invalid") {
    assert.ok(result.errors.name);
    assert.ok(result.errors.phone);
  }
});

test("ловушка для ботов отсекает спам", async () => {
  const result = await submitLead({ ...base, website: "http://spam.example" });
  assert.equal(result.status, "bot");
});

test("хранилище в памяти считает дубли в пределах окна", async () => {
  const store = new MemoryLeadStore();
  const lead = {
    id: "ld_test",
    createdAt: 1_000,
    name: "Дмитрий",
    phone: "+375291234567",
    interest: "order" as const,
    comment: "",
    attribution: {},
  };

  const first = await store.save(lead, 600_000);
  const second = await store.save({ ...lead, id: "ld_test2", createdAt: 2_000 }, 600_000);
  assert.equal(first.status, "created");
  assert.equal(second.status, "duplicate");
  assert.equal(await store.count(), 1);
});
