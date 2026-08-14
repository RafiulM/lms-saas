import type { Metadata } from "next";
import { SettingsPage } from "@/components/pages/SettingsPage";

export const metadata: Metadata = {
  title: "Pengaturan Sekolah | KelasHub",
  description: "Perbarui identitas dan preferensi ruang kerja sekolah.",
};

export default function Page() {
  return <SettingsPage />;
}
