"use server";

import { db, schema } from "@/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getSessionUser, getSchoolOf, requireRole } from "@/lib/auth-helpers";

export async function createAnnouncement(input: {
  title: string;
  body: string;
  tag?: string;
  tagTone?: "default" | "purple" | "teal";
  icon?: "megaphone" | "calendar" | "file";
  calloutTitle?: string;
  calloutDetail?: string;
}) {
  const user = requireRole(await getSessionUser(), ["admin", "teacher"]);
  const { schoolId } = await getSchoolOf(user);
  if (!input.title?.trim() || !input.body?.trim()) {
    throw new Error("Judul dan isi pengumuman wajib diisi.");
  }

  await db.insert(schema.announcements).values({
    id: randomUUID(),
    schoolId,
    authorId: user.id,
    tag: input.tag?.trim() || "Info sekolah",
    tagTone: input.tagTone || "default",
    icon: input.icon || "megaphone",
    title: input.title.trim(),
    body: input.body.trim(),
    calloutTitle: input.calloutTitle?.trim() || null,
    calloutDetail: input.calloutDetail?.trim() || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { ok: true };
}

export async function deleteAnnouncement(id: string) {
  const user = requireRole(await getSessionUser(), ["admin"]);
  const { schoolId } = await getSchoolOf(user);
  await db
    .delete(schema.announcements)
    .where(and(eq(schema.announcements.id, id), eq(schema.announcements.schoolId, schoolId)));
  return { ok: true };
}

export async function updateAnnouncement(
  id: string,
  input: {
    title: string;
    body: string;
    tag?: string;
    tagTone?: "default" | "purple" | "teal";
    icon?: "megaphone" | "calendar" | "file";
    calloutTitle?: string;
    calloutDetail?: string;
  },
) {
  const user = requireRole(await getSessionUser(), ["admin", "teacher"]);
  const { schoolId } = await getSchoolOf(user);
  if (!input.title?.trim() || !input.body?.trim()) {
    throw new Error("Judul dan isi pengumuman wajib diisi.");
  }

  const rows = await db
    .select({ id: schema.announcements.id })
    .from(schema.announcements)
    .where(and(eq(schema.announcements.id, id), eq(schema.announcements.schoolId, schoolId)))
    .limit(1);
  if (!rows[0]) throw new Error("Pengumuman tidak ditemukan.");

  await db
    .update(schema.announcements)
    .set({
      tag: input.tag?.trim() || "Info sekolah",
      tagTone: input.tagTone || "default",
      icon: input.icon || "megaphone",
      title: input.title.trim(),
      body: input.body.trim(),
      calloutTitle: input.calloutTitle?.trim() || null,
      calloutDetail: input.calloutDetail?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.announcements.id, id));
  return { ok: true };
}

export async function listAnnouncements() {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const rows = await db
    .select({
      id: schema.announcements.id,
      tag: schema.announcements.tag,
      tagTone: schema.announcements.tagTone,
      icon: schema.announcements.icon,
      title: schema.announcements.title,
      body: schema.announcements.body,
      calloutTitle: schema.announcements.calloutTitle,
      calloutDetail: schema.announcements.calloutDetail,
      createdAt: schema.announcements.createdAt,
      authorId: schema.announcements.authorId,
    })
    .from(schema.announcements)
    .where(eq(schema.announcements.schoolId, schoolId))
    .orderBy(desc(schema.announcements.createdAt));

  const authorIds = [...new Set(rows.map((r) => r.authorId))];
  const authors = authorIds.length
    ? await db
        .select({ id: schema.users.id, name: schema.users.name })
        .from(schema.users)
        .where(inArray(schema.users.id, authorIds))
    : [];

  return {
    announcements: rows.map((r) => ({
      ...r,
      author: authors.find((a) => a.id === r.authorId)?.name ?? "",
    })),
  };
}

export async function getAnnouncement(id: string) {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const rows = await db
    .select({
      id: schema.announcements.id,
      tag: schema.announcements.tag,
      tagTone: schema.announcements.tagTone,
      icon: schema.announcements.icon,
      title: schema.announcements.title,
      body: schema.announcements.body,
      calloutTitle: schema.announcements.calloutTitle,
      calloutDetail: schema.announcements.calloutDetail,
      createdAt: schema.announcements.createdAt,
      authorId: schema.announcements.authorId,
      author: schema.users.name,
    })
    .from(schema.announcements)
    .innerJoin(schema.users, eq(schema.announcements.authorId, schema.users.id))
    .where(and(eq(schema.announcements.id, id), eq(schema.announcements.schoolId, schoolId)))
    .limit(1);
  return rows[0] ?? null;
}
