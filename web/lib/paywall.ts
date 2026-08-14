import "server-only";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import type { SessionUser } from "@/lib/auth-helpers";

export type PaywallStatus = "ok" | "pending" | "no_subscription" | "inactive";

/**
 * Status paywall untuk sebuah akun:
 * - "ok"              — langganan aktif, semua halaman bisa diakses.
 * - "pending"         — sedang menunggu pembayaran (arahkan ke /langganan).
 * - "no_subscription" — belum pernah berlangganan (arahkan ke /pricing).
 * - "inactive"        — langganan kadaluarsa/dibatalkan (arahkan ke /pricing).
 */
export async function getPaywallStatus(user: SessionUser): Promise<PaywallStatus> {
  if (!user.schoolId) return "no_subscription";

  const [subscription] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.schoolId, user.schoolId))
    .limit(1);
  if (!subscription) return "no_subscription";

  if (subscription.status === "active") {
    if (subscription.endsAt && subscription.endsAt.getTime() < Date.now()) {
      return "inactive";
    }
    return "ok";
  }
  if (subscription.status === "pending") return "pending";
  return "inactive";
}

/** Halaman yang tetap bisa diakses walau belum berlangganan. */
export const PAYWALL_EXEMPT_PATHS = ["/pricing", "/langganan"];
