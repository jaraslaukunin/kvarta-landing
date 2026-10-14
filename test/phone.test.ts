import assert from "node:assert/strict";
import { test } from "node:test";
import { formatByPhoneInput, normalizeByPhone } from "../lib/phone";

test("принимает белорусский номер в разных записях", () => {
  const variants = [
    "+375 29 123-45-67",
    "+375291234567",
    "375291234567",
    "80291234567",
    "0291234567",
    "29 123 45 67",
    "8 (029) 123-45-67",
  ];

  for (const value of variants) {
    const result = normalizeByPhone(value);
    assert.equal(result.ok, true, `номер ${value} должен приниматься`);
    if (result.ok) {
      assert.equal(result.e164, "+375291234567");
      assert.equal(result.national, "291234567");
      assert.equal(result.pretty, "+375 (29) 123-45-67");
    }
  }
});

test("понимает городские коды и мобильные 25/33/44", () => {
  assert.equal(normalizeByPhone("+375 17 200-11-22").ok, true);
  assert.equal(normalizeByPhone("+375 33 555-11-22").ok, true);
  assert.equal(normalizeByPhone("+375 44 700-00-00").ok, true);
  assert.equal(normalizeByPhone("+375 152 40-40-40").ok, true);
});

test("не принимает чужие и битые номера", () => {
  const foreign = normalizeByPhone("+7 999 123-45-67");
  assert.equal(foreign.ok, false);
  if (!foreign.ok) assert.equal(foreign.code, "foreign");

  const unknown = normalizeByPhone("+375 11 123-45-67");
  assert.equal(unknown.ok, false);
  if (!unknown.ok) assert.equal(unknown.code, "unknown-code");

  const short = normalizeByPhone("+375 29 123");
  assert.equal(short.ok, false);
  if (!short.ok) assert.equal(short.code, "short");

  const long = normalizeByPhone("+375 29 123-45-678");
  assert.equal(long.ok, false);
  if (!long.ok) assert.equal(long.code, "long");

  const empty = normalizeByPhone("   ");
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.code, "empty");
});

test("маска достраивает номер по мере набора", () => {
  assert.equal(formatByPhoneInput("29"), "+375 (29)");
  assert.equal(formatByPhoneInput("29123"), "+375 (29) 123");
  assert.equal(formatByPhoneInput("291234567"), "+375 (29) 123-45-67");
  assert.equal(formatByPhoneInput("+375291234567"), "+375 (29) 123-45-67");
  assert.equal(formatByPhoneInput("8029123456789"), "+375 (29) 123-45-67");
  assert.equal(formatByPhoneInput("1524040404"), "+375 (152) 40-40-40");
});
