import type { Metadata } from "next";
import { TasksPage } from "@/components/pages/TasksPage";

export const metadata: Metadata = {
  title: "Tugas & Pengumpulan | KelasHub",
  description: "Pantau tugas, periksa jawaban, dan kirim umpan balik.",
};

export default function Page() {
  return <TasksPage />;
}
