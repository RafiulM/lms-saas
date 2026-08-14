import { NextResponse } from "next/server";
import { applyMayarWebhook, type MayarWebhookPayload } from "@/lib/mayar";

export const dynamic = "force-dynamic";

/**
 * Webhook Mayar.id — daftarkan URL ini di dashboard Mayar
 * (Integrasi → Webhook → URL Webhook) dengan event payment.received.
 */
export async function POST(request: Request) {
  let payload: MayarWebhookPayload;
  try {
    payload = (await request.json()) as MayarWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await applyMayarWebhook(payload);

  // Selalu balas 200 agar Mayar tidak mengulang kiriman webhook.
  return NextResponse.json({ ok: true });
}
