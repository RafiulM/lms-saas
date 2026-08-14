import type { Metadata } from "next";
import { getStudentDetail } from "@/lib/actions/grades";
import { StudentDetailPage } from "@/components/pages/StudentDetailPage";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const student = await getStudentDetail(id);
  if (!student) return { title: "Murid | KelasHub" };
  return { title: `${student.name} | KelasHub`, description: `Profil murid ${student.name} - ${student.className}.` };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return <StudentDetailPage />;
}
