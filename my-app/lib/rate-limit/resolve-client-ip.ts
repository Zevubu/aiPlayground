/**
 * Best-effort client IP for rate limiting behind common proxies (Vercel, nginx).
 * Prefer the first hop in X-Forwarded-For; never use for security-critical auth alone.
 */
export function resolveClientIpFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
