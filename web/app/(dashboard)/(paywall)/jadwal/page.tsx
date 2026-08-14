import type { Metadata } from "next";
import { SchedulePage } from "@/components/pages/SchedulePage";

export const metadata: Metadata = {
  title: "Jadwal Pelajaran | KelasHub",
  description: "Susun dan lihat jadwal pelajaran mingguan setiap kelas.",
};

export default function Page() {
  return <SchedulePage />;
}
