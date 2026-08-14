import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-helpers";

/** Halaman autentikasi tampil tanpa sidebar/navbar; pengguna yang sudah login dialihkan ke dasbor. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (user) redirect("/");
  return <>{children}</>;
}
