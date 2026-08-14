import type { Metadata } from "next";
import { getAssignment } from "@/lib/actions/assignments";
import { TaskDetailPage } from "@/components/pages/TaskDetailPage";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const task = await getAssignment(id);
  if (!task) return { title: "Tugas | KelasHub" };
  return { title: `${task.title} | KelasHub`, description: `Detail tugas ${task.title} untuk ${task.className}.` };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskDetailPage />;
}
