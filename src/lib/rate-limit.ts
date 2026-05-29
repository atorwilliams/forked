interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Prune expired entries every 10 minutes so the Map doesn't grow forever
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of store.entries()) {
      if (val.resetAt < now) store.delete(key);
    }
  }, 10 * 60 * 1000);
}

export function rateLimit(opts: {
  key: string;
  limit: number;   // max requests
  window: number;  // window in seconds
}): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = opts.window * 1000;
  const existing = store.get(opts.key);

  if (!existing || existing.resetAt < now) {
    store.set(opts.key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: opts.limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= opts.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return { ok: true, remaining: opts.limit - existing.count, resetAt: existing.resetAt };
}

export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function tooManyRequests(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests. Try again shortly." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
