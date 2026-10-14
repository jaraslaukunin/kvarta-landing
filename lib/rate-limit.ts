/**
 * Простой ограничитель по IP: держим метки времени в памяти процесса.
 * Для одного инстанса этого достаточно; за балансировщиком лучше Redis
 * (та же логика, но счётчики общие).
 */

const buckets = new Map<string, number[]>();

export type RateVerdict = { ok: true; left: number } | { ok: false; retryAfterSec: number };

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateVerdict {
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((stamp) => stamp > cutoff);

  if (hits.length >= limit) {
    const oldest = hits[0];
    buckets.set(key, hits);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }

  hits.push(now);
  buckets.set(key, hits);

  // не даём карте расти бесконечно
  if (buckets.size > 5000) {
    for (const [bucketKey, stamps] of buckets) {
      if (stamps.every((stamp) => stamp <= cutoff)) buckets.delete(bucketKey);
    }
  }

  return { ok: true, left: limit - hits.length };
}

export function resetRateLimits() {
  buckets.clear();
}
