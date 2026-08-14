import type { Metadata } from "next";
import { PricingPage } from "@/components/pages/PricingPage";

export const metadata: Metadata = {
  title: "Pricing | KelasHub",
  description: "Pilih paket KelasHub berdasarkan jumlah murid sekolah.",
};

export default function Page() {
  return <PricingPage />;
}
