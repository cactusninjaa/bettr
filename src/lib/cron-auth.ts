import { auth } from "@/auth";

/**
 * Authorization for cron-style endpoints.
 *
 * Accepts either:
 *  - `Authorization: Bearer <CRON_SECRET>` (Vercel Cron jobs)
 *  - A logged-in user session (handy for the admin UI button)
 *
 * In dev with no CRON_SECRET set, any request is allowed.
 */
export async function isCronAuthorized(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;

  // Vercel cron path
  if (secret) {
    const header = req.headers.get("authorization");
    if (header === `Bearer ${secret}`) return true;
  } else if (process.env.NODE_ENV !== "production") {
    return true;
  }

  // UI / authenticated user path
  const session = await auth();
  return !!session?.user?.id;
}
