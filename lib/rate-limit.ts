// Minimal in-memory rate limiter suitable for a single-instance MVP.
// Not a distributed limiter; documented as such in the README.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const hits = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) {
    hits.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}

export function getClientKey(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous"
  );
}

export function resetRateLimitForTests(): void {
  hits.clear();
}
