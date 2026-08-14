import type { Metadata } from "next";
import { AnnouncementsPage } from "@/components/pages/AnnouncementsPage";

export const metadata: Metadata = {
  title: "Pengumuman | KelasHub",
  description: "Kabar terbaru dari sekolah untuk guru dan murid.",
};

export default function Page() {
  return <AnnouncementsPage />;
}
