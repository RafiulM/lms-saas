import type { Metadata } from "next";
import { getClassDetailData } from "@/lib/actions/classes";
import { ClassDetailPage } from "@/components/pages/ClassDetailPage";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const classDetail = await getClassDetailData(id);
  if (!classDetail) return { title: "Kelas | KelasHub" };
  return { title: `${classDetail.name} | KelasHub`, description: `Detail kelas ${classDetail.name}.` };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return <ClassDetailPage />;
}
