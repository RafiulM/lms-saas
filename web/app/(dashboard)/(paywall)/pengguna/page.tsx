import type { Metadata } from "next";
import { UsersPage } from "@/components/pages/UsersPage";

export const metadata: Metadata = {
  title: "Pengguna & Kelas | KelasHub",
  description: "Kelola akun murid, guru, dan pembagian kelas.",
};

export default function Page() {
  return <UsersPage />;
}
