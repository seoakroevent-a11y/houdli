const MAX_TRACKED = 5_000;

export function clientIp(request: Request) {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Limiteur en mémoire, par instance : `limit` requêtes par adresse IP sur `windowMs`. */
export function createRateLimiter(limit: number, windowMs = 60_000) {
  const hits = new Map<string, number[]>();
  return (ip: string) => {
    const now = Date.now();
    if (hits.size > MAX_TRACKED) {
      for (const [key, times] of hits) {
        if (times.every((t) => now - t >= windowMs)) hits.delete(key);
      }
    }
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(ip, recent);
    return recent.length > limit;
  };
}
