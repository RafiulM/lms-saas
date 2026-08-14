import type { Metadata } from "next";
import { SubscriptionPage } from "@/components/pages/SubscriptionPage";

export const metadata: Metadata = {
  title: "Kelola Langganan | KelasHub",
  description: "Pantau paket, kuota, dan riwayat pembayaran sekolah.",
};

export default function Page() {
  return <SubscriptionPage />;
}
