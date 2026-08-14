"use server";

import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getSessionUser, getSchoolOf, requireRole } from "@/lib/auth-helpers";
import { createPaymentRequest, getPaymentRequestDetail, MAYAR_MIN_AMOUNT } from "@/lib/mayar";

const PLANS = [
  { name: "Starter", capacity: 100, price: 450000, description: "Untuk sekolah kecil yang mulai beralih dari Excel." },
  { name: "Growth", capacity: 500, price: 1250000, description: "Semua yang dibutuhkan sekolah yang sedang berkembang." },
  { name: "Scale", capacity: Infinity, price: null, description: "Kapasitas fleksibel untuk sekolah dengan banyak kelas." },
] as const;

export type PlanName = (typeof PLANS)[number]["name"];
export type BillingPeriod = "monthly" | "yearly";

/** Harga untuk periode tagihan (tahunan diskon 20%). */
function planPriceFor(price: number, billing: BillingPeriod): number {
  return billing === "yearly" ? Math.round(price * 12 * 0.8) : price;
}

/**
 * Kupon diskon testing via Mayar.id — dibuat dengan API Mayar
 * (`createDiscountCoupon`, lihat db/seed-mayar.ts) dan diauto-apply di
 * halaman checkout via ?coupon=CODE. Mayar membatasi persen maksimal 99%.
 */
const TEST_COUPON = {
  code: "KELASHUB100",
  percent: 99,
} as const;

function normalizeDiscountCode(code?: string): string {
  return (code ?? "").trim().toUpperCase();
}

export async function getPlansWithStats() {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const [stats, subscription] = await Promise.all([
    db
      .select()
      .from(schema.schoolStats)
      .where(eq(schema.schoolStats.schoolId, schoolId))
      .limit(1),
    db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.schoolId, schoolId))
      .limit(1),
  ]);

  const studentCount = stats[0]?.studentCount ?? 0;
  const teacherCount = stats[0]?.teacherCount ?? 0;

  const current = subscription[0] ?? null;
  // Paket hanya dianggap aktif jika status langganan benar-benar "active"
  // (pembayaran sudah dikonfirmasi webhook) — status "pending" belum aktif.
  const plans = PLANS.map((p) => {
    const matches = current?.plan === p.name.toLowerCase();
    return {
      name: p.name,
      description: p.description,
      capacity: p.capacity === Infinity ? "Tak terbatas" : String(p.capacity),
      price: p.price === null ? "Custom" : new Intl.NumberFormat("id-ID").format(p.price),
      priceNumber: p.price,
      active: current?.status === "active" && matches,
      pending: current?.status === "pending" && matches,
    };
  });

  return {
    studentCount,
    teacherCount,
    totalUsers: studentCount + teacherCount,
    plans,
    subscription: current,
    school: null,
  };
}

/** Membuat checkout Mayar.id untuk paket (integrasi nyata via Payment Request API). */
export async function createSubscriptionCheckout(
  plan: PlanName,
  billing: BillingPeriod = "monthly",
  discountCode?: string,
) {
  const user = requireRole(await getSessionUser(), ["admin"]);
  const { schoolId, school } = await getSchoolOf(user);

  const selected = PLANS.find((p) => p.name === plan);
  if (!selected) throw new Error("Paket tidak ditemukan.");
  if (selected.price === null) throw new Error("Untuk paket Scale, hubungi tim kami.");

  // Validasi kupon testing (kupon dibuat di Mayar via db/seed-mayar.ts).
  const normalizedCode = normalizeDiscountCode(discountCode);
  const coupon = normalizedCode && normalizedCode === TEST_COUPON.code ? TEST_COUPON : null;
  if (normalizedCode && !coupon) {
    throw new Error("Kode diskon tidak valid.");
  }

  const isYearly = billing === "yearly";
  const baseAmount = planPriceFor(selected.price, billing);
  const discountPercent = coupon?.percent ?? 0;
  // Mayar membatasi persen diskon maks. 99% dan nominal pembayaran min. Rp 500.
  const amount = Math.max(
    Math.round((baseAmount * (100 - discountPercent)) / 100),
    MAYAR_MIN_AMOUNT,
  );
  const periodLabel = isYearly ? "tahunan" : "bulanan";

  // Buat payment request di Mayar.id dengan nominal sudah terdiskon.
  // https://docs.mayar.id/api-reference/reqpayment/create
  const payment = await createPaymentRequest({
    name: user.name ?? school.name,
    email: user.email,
    mobile: school.phone ?? "081234567890",
    amount,
    description: coupon
      ? `Langganan KelasHub ${selected.name} (${periodLabel}) — ${school.name} (kupon ${coupon.code}, diskon ${discountPercent}%)`
      : `Langganan KelasHub ${selected.name} (${periodLabel}) — ${school.name} (hingga ${selected.capacity} murid)`,
  });

  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setMonth(endsAt.getMonth() + (isYearly ? 12 : 1));

  const existing = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.schoolId, schoolId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(schema.subscriptions)
      .set({
        plan: plan.toLowerCase(),
        price: amount,
        status: "pending",
        endsAt,
        mayarCheckoutUrl: payment.link,
        mayarTransactionId: payment.transactionId,
        mayarPaymentLinkId: payment.paymentLinkId,
        updatedAt: now,
      })
      .where(eq(schema.subscriptions.id, existing[0].id));
  } else {
    await db.insert(schema.subscriptions).values({
      id: randomUUID(),
      schoolId,
      plan: plan.toLowerCase(),
      price: amount,
      status: "pending",
      startsAt: now,
      endsAt,
      mayarCheckoutUrl: payment.link,
      mayarTransactionId: payment.transactionId,
      mayarPaymentLinkId: payment.paymentLinkId,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.insert(schema.payments).values({
    id: randomUUID(),
    schoolId,
    plan: plan.toLowerCase(),
    amount,
    status: "pending",
    paymentMethod: coupon ? `Kupon ${coupon.code}` : null,
    mayarTransactionId: payment.transactionId,
    mayarPaymentLinkId: payment.paymentLinkId,
    createdAt: now,
  });

  return {
    checkoutUrl: payment.link,
    transactionId: payment.transactionId,
    couponCode: coupon?.code ?? null,
    discountPercent,
  };
}

/** Cek status pembayaran Mayar terbaru untuk langganan yang menunggu bayar. */
export async function syncSubscriptionStatus() {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const [subscription] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.schoolId, schoolId))
    .limit(1);
  if (
    !subscription ||
    subscription.status !== "pending" ||
    !subscription.mayarPaymentLinkId
  ) {
    return null;
  }

  try {
    // Detail payment request memakai payment link id (bukan transactionId).
    const detail = await getPaymentRequestDetail(subscription.mayarPaymentLinkId);
    const mayarStatus = detail.data?.status;
    if (mayarStatus === "paid" || mayarStatus === "success") {
      const now = new Date();
      const endsAt = new Date(now);
      endsAt.setMonth(endsAt.getMonth() + 1);
      await db
        .update(schema.subscriptions)
        .set({ status: "active", startsAt: subscription.startsAt ?? now, endsAt, updatedAt: now })
        .where(eq(schema.subscriptions.id, subscription.id));
      if (subscription.mayarTransactionId) {
        await db
          .update(schema.payments)
          .set({ status: "paid", paidAt: now })
          .where(eq(schema.payments.mayarTransactionId, subscription.mayarTransactionId));
      }
      return { status: "active", endsAt };
    }
    if (mayarStatus === "expired" || mayarStatus === "cancelled") {
      await db
        .update(schema.subscriptions)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(schema.subscriptions.id, subscription.id));
      return { status: "cancelled" };
    }
  } catch {
    // Polling gagal — biarkan webhook yang menyelesaikan pembaruan status.
  }
  return null;
}

/** Riwayat pembayaran & status langganan (dashboard). */
export async function getSubscription() {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const [subscription, stats, paymentRows] = await Promise.all([
    db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.schoolId, schoolId))
      .limit(1),
    db
      .select()
      .from(schema.schoolStats)
      .where(eq(schema.schoolStats.schoolId, schoolId))
      .limit(1),
    db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.schoolId, schoolId))
      .orderBy(desc(schema.payments.createdAt))
      .limit(20),
  ]);

  const sub = subscription[0] ?? null;

  // Deteksi periode tagihan dari harga tersimpan vs harga dasar paket.
  const basePlan = PLANS.find((p) => p.name.toLowerCase() === sub?.plan);
  const yearlyPrice = basePlan?.price != null ? planPriceFor(basePlan.price, "yearly") : null;
  const billingLabel: BillingPeriod =
    sub?.price != null && yearlyPrice != null && Math.abs(sub.price - yearlyPrice) < 1
      ? "yearly"
      : "monthly";

  return {
    subscription: sub
      ? {
          ...sub,
          planLabel: sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1),
          priceLabel: sub.price
            ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(sub.price)
            : "Custom",
          billingLabel,
          expiresInDays: sub.endsAt ? Math.max(0, Math.ceil((sub.endsAt.getTime() - Date.now()) / 86400000)) : null,
        }
      : null,
    payments: paymentRows.map((p) => ({
      ...p,
      planLabel: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
      amountLabel: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: p.currency,
      }).format(p.amount),
    })),
    studentCount: stats[0]?.studentCount ?? 0,
    teacherCount: stats[0]?.teacherCount ?? 0,
  };
}
