import { redirect } from "next/navigation";
import { getShellData } from "@/lib/actions/shell";
import { AppShell } from "@/components/Shell";

/** Semua halaman dasbor wajib login; tanpa sesi langsung diarahkan ke /masuk. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const data = await getShellData();
  if (!data.user) redirect("/masuk");
  return <AppShell data={data}>{children}</AppShell>;
}
