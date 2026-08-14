import type { Metadata } from "next";
import { GradesPage } from "@/components/pages/GradesPage";

export const metadata: Metadata = {
  title: "Input Nilai | KelasHub",
  description: "Catat nilai tugas dan ulangan, lalu lihat rekap kelas.",
};

export default function Page() {
  return <GradesPage />;
}
