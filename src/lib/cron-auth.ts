/**
 * Vercel Cron sends an Authorization header with the CRON_SECRET env var.
 * Locally we accept any call (handy for manual triggering).
 */
export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Dev convenience: no secret = allowed everywhere.
    return process.env.NODE_ENV !== "production";
  }
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
