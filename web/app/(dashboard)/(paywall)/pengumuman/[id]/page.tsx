import type { Metadata } from "next";
import { getAnnouncement } from "@/lib/actions/announcements";
import { AnnouncementDetailPage } from "@/components/pages/AnnouncementDetailPage";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getAnnouncement(id);
  if (!item) return { title: "Pengumuman | KelasHub" };
  return { title: `${item.title} | KelasHub`, description: item.body.slice(0, 150) };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return <AnnouncementDetailPage />;
}
