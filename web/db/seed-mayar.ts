/**
 * Seed langganan di Mayar.id (sandbox) — membuat payment request untuk tiap
 * paket pricing lalu mencatatnya ke database sebagai pembayaran pending.
 *
 * Prasyarat:
 *   - MAYAR_API_TOKEN diisi di .env (token dari https://web.mayar.club untuk test)
 *   - Database sudah di-seed (npm run db:seed) agar sekolah & admin tersedia
 *
 * Jalankan: npm run db:seed:mayar
 */
import { loadEnvConfig } from "@next/env";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { createDiscountCoupon, createPaymentRequest } from "@/lib/mayar";

loadEnvConfig(process.cwd());

const SCHOOL_ID = "smkn5-bandung";
const tag = "seed-mayar-";

// Kupon diskon testing (100% → Mayar membatasi maksimal 99%).
const TEST_COUPON = { code: "KELASHUB100", percent: 100 };

async function main() {
  if (!process.env.MAYAR_API_TOKEN) {
    throw new Error("MAYAR_API_TOKEN belum diisi di .env — buat di https://web.mayar.club");
  }
  console.log("Seed Mayar dimulai…");

  // ── Kupon diskon testing (100%, via API Mayar) ──
  try {
    const coupon = await createDiscountCoupon({
      name: "KelasHub Testing 100%",
      code: TEST_COUPON.code,
      discountType: "percentage",
      value: TEST_COUPON.percent,
      totalCoupons: 1000,
      expiredAt: new Date(Date.now() + 365 * 86400000),
    });
    const storedPercent = coupon.data?.value ?? TEST_COUPON.percent;
    console.log(
      `✓ Kupon ${TEST_COUPON.code} dibuat (diskon ${storedPercent}% — Mayar membatasi maks. 99%)`,
    );
  } catch (error) {
    console.log(
      `! Kupon ${TEST_COUPON.code} mungkin sudah ada:`,
      error instanceof Error ? error.message : String(error),
    );
  }

  const [school] = await db
    .select()
    .from(schema.schools)
    .where(eq(schema.schools.id, SCHOOL_ID))
    .limit(1);
  if (!school) throw new Error("Sekolah belum ada — jalankan npm run db:seed dulu.");
  const [admin] = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.schoolId, SCHOOL_ID), eq(schema.users.role, "admin")))
    .limit(1);
  if (!admin) throw new Error("Admin belum ada — jalankan npm run db:seed dulu.");

  // Hapus payment pending hasil seed sebelumnya
  const existing = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.schoolId, SCHOOL_ID));
  for (const row of existing) {
    if (row.mayarTransactionId?.startsWith(tag)) {
      await db.delete(schema.payments).where(eq(schema.payments.id, row.id));
    }
  }

  const customer = {
    name: admin.name,
    email: admin.email,
    mobile: school.phone ?? "081234567890",
  };

  // Paket & periode yang akan dibuatkan payment request di Mayar
  const requests = [
    { plan: "starter", label: "Starter", amount: 450000, period: "bulanan" },
    { plan: "growth", label: "Growth", amount: 1250000, period: "bulanan" },
    { plan: "growth", label: "Growth", amount: Math.round(1250000 * 12 * 0.8), period: "tahunan (hemat 20%)" },
  ];

  const [subscription] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.schoolId, SCHOOL_ID))
    .limit(1);

  const now = new Date();
  for (const req of requests) {
    const payment = await createPaymentRequest({
      name: customer.name,
      email: customer.email,
      mobile: customer.mobile,
      amount: req.amount,
      description: `Langganan KelasHub ${req.label} (${req.period}) — ${school.name}`,
    });

    await db.insert(schema.payments).values({
      id: randomUUID(),
      schoolId: SCHOOL_ID,
      subscriptionId: subscription?.id ?? null,
      plan: req.plan,
      amount: req.amount,
      status: "pending",
      mayarTransactionId: `${tag}${payment.transactionId}`,
      mayarPaymentLinkId: `${tag}${payment.paymentLinkId}`,
      createdAt: now,
    });

    // Simpan link checkout terbaru di langganan agar tombol "Lanjutkan
    // pembayaran" di dashboard langsung memakai link Mayar asli.
    if (req.plan === "growth" && req.period === "bulanan" && subscription) {
      await db
        .update(schema.subscriptions)
        .set({
          mayarCheckoutUrl: payment.link,
          mayarTransactionId: `${tag}${payment.transactionId}`,
          mayarPaymentLinkId: `${tag}${payment.paymentLinkId}`,
          updatedAt: now,
        })
        .where(eq(schema.subscriptions.id, subscription.id));
    }

    console.log(`✓ ${req.label} ${req.period} — Rp ${req.amount.toLocaleString("id-ID")} → ${payment.link}`);
  }

  console.log("\nSeed Mayar selesai.");
  console.log("Link checkout dapat dibuka langsung (mode test Mayar) atau dicoba via halaman /pricing dan /langganan.");
  console.log("Catatan: payment request di Mayar berstatus unpaid sampai pembayaran dilakukan di halaman link.");
}

main().catch((error) => {
  console.error("Seed Mayar gagal:", error);
  process.exit(1);
});
