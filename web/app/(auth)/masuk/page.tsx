import type { Metadata } from "next";
import { AuthPage } from "@/components/pages/AuthPage";

export const metadata: Metadata = {
  title: "Masuk / Daftar | KelasHub",
  description: "Masuk ke akun sekolah atau daftarkan sekolah baru.",
};

export default function Page() {
  return <AuthPage />;
}
