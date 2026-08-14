import type { Metadata } from "next";
import { ProfilePage } from "@/components/pages/ProfilePage";

export const metadata: Metadata = {
  title: "Profil Saya | KelasHub",
  description: "Kelola data profil dan preferensi akun.",
};

export default function Page() {
  return <ProfilePage />;
}
