import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-helpers";
import { getPaywallStatus } from "@/lib/paywall";

/**
 * Paywall — semua halaman di group ini hanya bisa diakses saat sekolah
 * memiliki langganan aktif. Tanpa langganan → /pricing (atau /langganan
 * bila masih ada pembayaran yang menunggu).
 */
export default async function PaywallLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/masuk");

  const status = await getPaywallStatus(user);
  if (status === "ok") return <>{children}</>;
  redirect(status === "pending" ? "/langganan" : "/pricing?paywall=1");
}
