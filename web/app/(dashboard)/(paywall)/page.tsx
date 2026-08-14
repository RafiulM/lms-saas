import type { Metadata } from "next";
import { HomePage } from "@/components/pages/HomePage";

export const metadata: Metadata = {
  title: "Beranda | KelasHub",
  description: "Ringkasan aktivitas guru dan murid dalam satu layar.",
};

export default function Page() {
  return <HomePage />;
}
