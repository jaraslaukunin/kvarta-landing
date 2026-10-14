import assert from "node:assert/strict";
import { test } from "node:test";
import { checkRateLimit, resetRateLimits } from "../lib/rate-limit";

test("пропускает до лимита и тормозит остальные", () => {
  resetRateLimits();
  const now = Date.UTC(2025, 9, 13, 9, 0);

  for (let i = 0; i < 3; i += 1) {
    assert.equal(checkRateLimit("ip:1", 3, 60_000, now + i).ok, true);
  }

  const blocked = checkRateLimit("ip:1", 3, 60_000, now + 10);
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.ok(blocked.retryAfterSec > 0);

  // окно прошло — снова можно
  assert.equal(checkRateLimit("ip:1", 3, 60_000, now + 61_000).ok, true);
});

test("счётчики по разным ключам не пересекаются", () => {
  resetRateLimits();
  assert.equal(checkRateLimit("ip:2", 1, 60_000).ok, true);
  assert.equal(checkRateLimit("ip:3", 1, 60_000).ok, true);
  assert.equal(checkRateLimit("ip:2", 1, 60_000).ok, false);
});
