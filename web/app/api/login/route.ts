import { auth } from "@/lib/auth";

/**
 * Login fallback tanpa JavaScript (progressive enhancement).
 * Form /masuk di-submit secara native oleh browser ke route ini saat
 * hydration belum/ tidak terjadi, misalnya pada koneksi lambat.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;
  const failUrl = new URL("/masuk?error=1", origin);
  if (!email || !password) return Response.redirect(failUrl);
  try {
    const res = await auth.api.signInEmail({
      headers: request.headers,
      body: { email, password },
    });
    if (!res?.user) return Response.redirect(failUrl);
  } catch {
    return Response.redirect(failUrl);
  }
  return Response.redirect(new URL("/", origin));
}
