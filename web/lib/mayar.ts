import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Klien API Mayar.id — https://docs.mayar.id
 * Endpoint produksi: https://api.mayar.id/hl/v1
 */

const MAYAR_API_URL = "https://api.mayar.id/hl/v1";

function mayarToken(): string {
  const token = process.env.MAYAR_API_TOKEN;
  if (!token) throw new Error("MAYAR_API_TOKEN belum diatur di environment.");
  return token;
}

async function mayarFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${MAYAR_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${mayarToken()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (body as { messages?: string })?.messages ??
      (body as { message?: string })?.message ??
      `Mayar API error (${res.status})`;
    throw new Error(message);
  }
  return body;
}

/** URL aplikasi untuk redirect & webhook (konfigurasi di .env). */
export function appBaseUrl(): string {
  return (
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    "http://localhost:3000"
  );
}

export type CreatePaymentRequestInput = {
  name: string;
  email: string;
  mobile: string;
  amount: number;
  description: string;
  redirectUrl?: string;
  expiredAt?: Date;
};

export type CreatePaymentRequestResult = {
  requestId: string;
  paymentLinkId: string;
  transactionId: string;
  link: string;
};

/**
 * POST /hl/v1/payment/create — membuat payment request (checkout) Mayar.id.
 * https://docs.mayar.id/api-reference/reqpayment/create
 */
export async function createPaymentRequest(
  input: CreatePaymentRequestInput,
): Promise<CreatePaymentRequestResult> {
  const expiredAt = (input.expiredAt ?? new Date(Date.now() + 60 * 60 * 1000)).toISOString();
  const body = await mayarFetch("/payment/create", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      amount: Math.round(input.amount),
      mobile: input.mobile,
      redirectUrl: input.redirectUrl ?? `${appBaseUrl()}/langganan`,
      description: input.description,
      expiredAt,
    }),
  });

  const data = (body as { data?: Record<string, unknown> }).data ?? {};
  const requestId = String(data.id ?? data.requestId ?? "");
  const paymentLinkId = String(data.paymentLinkId ?? data.id ?? "");
  const transactionId = String(data.transactionId ?? data.transaction_id ?? "");
  const link = String(data.link ?? "");

  if (!link || !transactionId || !paymentLinkId) {
    throw new Error("Mayar.id tidak mengembalikan link pembayaran.");
  }
  return { requestId, paymentLinkId, transactionId, link };
}

/**
 * POST /hl/v1/webhook/register — mendaftarkan URL webhook pembayaran.
 * https://docs.mayar.id/api-reference/webhook/registerurlhook
 */
export async function registerWebhookUrl(urlHook: string) {
  return mayarFetch("/webhook/register", {
    method: "POST",
    body: JSON.stringify({ urlHook }),
  });
}

export type CreateDiscountCouponInput = {
  name: string;
  code: string;
  discountType: "percentage" | "monetary";
  value: number;
  minimumPurchase?: number;
  totalCoupons?: number;
  expiredAt?: Date;
};

/**
 * POST /hl/v1/coupon/create — membuat kupon diskon di Mayar.
 * Catatan: persen maksimal yang diterima Mayar adalah 99.
 * https://docs.mayar.id/api-reference/discount/create
 */
export async function createDiscountCoupon(input: CreateDiscountCouponInput) {
  const body = await mayarFetch("/coupon/create", {
    method: "POST",
    body: JSON.stringify({
      expiredAt: (input.expiredAt ?? new Date(Date.now() + 365 * 86400000)).toISOString(),
      name: input.name,
      discount: {
        discountType: input.discountType,
        eligibleCustomerType: "all",
        minimumPurchase: input.minimumPurchase ?? 0,
        value: input.value,
        totalCoupons: input.totalCoupons ?? 1,
      },
      coupon: { code: input.code, type: "reusable" },
      products: [],
    }),
  });
  return body as {
    statusCode: number;
    messages: string;
    data?: { id?: string; value?: number; coupons?: { code?: string }[] };
  };
}

/** Batas minimum nominal pembayaran Mayar.id. */
export const MAYAR_MIN_AMOUNT = 500;

export type MayarWebhookData = {
  id?: string;
  transactionId?: string;
  status?: string; // SUCCESS | FAILED
  transactionStatus?: string; // paid
  amount?: number;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
  paymentMethod?: string | null;
  createdAt?: string;
};

/** Payload webhook Mayar: { event, data } — https://docs.mayar.id/integration/webhook */
export type MayarWebhookPayload = {
  event?: string;
  data?: MayarWebhookData;
};

/**
 * Memproses event webhook Mayar.id:
 * - payment.received → aktifkan langganan & catat riwayat pembayaran.
 * - payment.reminder → diabaikan (hanya pemberitahuan).
 */
export async function applyMayarWebhook(payload: MayarWebhookPayload) {
  if (!payload.data) return;
  const data = payload.data;
  const txnId = data.transactionId ?? data.id;

  switch (payload.event) {
    case "payment.received": {
      if (!txnId) return;
      const [subscription] = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.mayarTransactionId, txnId))
        .limit(1);
      if (!subscription) return;

      const paid =
        data.status === "SUCCESS" ||
        data.transactionStatus === "paid";

      const now = new Date();
      if (!paid) {
        await db
          .update(schema.payments)
          .set({ status: "failed", mayarWebhookId: data.id ?? null })
          .where(eq(schema.payments.mayarTransactionId, txnId));
        return;
      }

      const endsAt = new Date(now);
      endsAt.setMonth(endsAt.getMonth() + 1);
      await db
        .update(schema.subscriptions)
        .set({
          status: "active",
          startsAt: subscription.startsAt ?? now,
          endsAt,
          mayarTransactionId: txnId,
          updatedAt: now,
        })
        .where(eq(schema.subscriptions.id, subscription.id));

      const [existing] = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.mayarTransactionId, txnId))
        .limit(1);

      if (existing) {
        await db
          .update(schema.payments)
          .set({
            status: "paid",
            paymentMethod: data.paymentMethod ?? null,
            paidAt: now,
            mayarWebhookId: data.id ?? null,
          })
          .where(eq(schema.payments.id, existing.id));
      } else {
        await db.insert(schema.payments).values({
          id: crypto.randomUUID(),
          schoolId: subscription.schoolId,
          subscriptionId: subscription.id,
          plan: subscription.plan,
          amount: data.amount ?? subscription.price ?? 0,
          status: "paid",
          paymentMethod: data.paymentMethod ?? null,
          mayarTransactionId: txnId,
          mayarWebhookId: data.id ?? null,
          paidAt: now,
          createdAt: now,
        });
      }
      break;
    }
    default:
      break;
  }
}

/**
 * GET /hl/v1/payment/{id} — detail payment request untuk polling status.
 * https://docs.mayar.id/api-reference/reqpayment/detail
 */
export async function getPaymentRequestDetail(requestId: string) {
  const body = await mayarFetch(`/payment/${encodeURIComponent(requestId)}`);
  return body as {
    statusCode: number;
    messages: string;
    data?: { id?: string; status?: string; amount?: number };
  };
}
