import assert from "node:assert/strict";
import { test } from "node:test";
import { describeAttribution, readAttribution, sanitizeAttribution } from "../lib/attribution";

test("читает метки из адреса и внешний реферер", () => {
  const url = new URL("https://kvarta.by/?utm_source=instagram&utm_campaign=stroys&yclid=123456789");
  const attr = readAttribution(url, "https://l.instagram.com/feed");

  assert.equal(attr.utm_source, "instagram");
  assert.equal(attr.utm_campaign, "stroys");
  assert.equal(attr.yclid, "123456789");
  assert.equal(attr.referrer, "https://l.instagram.com/feed");
  assert.equal(attr.landing, "/?utm_source=instagram&utm_campaign=stroys&yclid=123456789");
});

test("не пишет реферер с того же домена", () => {
  const url = new URL("https://kvarta.by/");
  const attr = readAttribution(url, "https://kvarta.by/#lead");
  assert.equal(attr.referrer, undefined);
});

test("на сервере оставляет только белый список и обрезает длину", () => {
  const attr = sanitizeAttribution(
    {
      utm_source: "yandex",
      utm_medium: "cpc",
      evil: "<script>alert(1)</script>",
      comment: "не наше поле",
      utm_term: "x".repeat(500),
    },
    "/?utm_source=yandex",
  );

  assert.equal(attr.utm_source, "yandex");
  assert.equal(attr.utm_medium, "cpc");
  assert.equal(attr.page, "/?utm_source=yandex");
  assert.equal((attr as Record<string, unknown>).evil, undefined);
  assert.equal(attr.utm_term?.length, 180);
});

test("описывает источник человеческим языком", () => {
  const described = describeAttribution({
    utm_source: "instagram",
    utm_content: "storis-efiopia",
    landing: "/",
  });
  assert.match(described, /Instagram/);
  assert.match(described, /storis-efiopia/);

  assert.equal(describeAttribution({}), "прямой заход");
});
