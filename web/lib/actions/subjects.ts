"use server";

import { db, schema } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getSessionUser, getSchoolOf, requireRole } from "@/lib/auth-helpers";

export async function createSubject(input: {
  name: string;
  teacherId?: string;
  tone?: string;
}) {
  const user = requireRole(await getSessionUser(), ["admin"]);
  const { schoolId } = await getSchoolOf(user);
  if (!input.name?.trim()) throw new Error("Nama mata pelajaran wajib diisi.");

  const id = randomUUID();
  await db.insert(schema.subjects).values({
    id,
    schoolId,
    name: input.name.trim(),
    teacherId: input.teacherId || null,
    tone: input.tone || "teal",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id };
}

export async function deleteSubject(id: string) {
  const user = requireRole(await getSessionUser(), ["admin"]);
  const { schoolId } = await getSchoolOf(user);
  await db
    .delete(schema.subjects)
    .where(and(eq(schema.subjects.id, id), eq(schema.subjects.schoolId, schoolId)));
  return { ok: true };
}

export async function listSubjects() {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const subjects = await db
    .select({
      id: schema.subjects.id,
      name: schema.subjects.name,
      tone: schema.subjects.tone,
      teacherId: schema.subjects.teacherId,
    })
    .from(schema.subjects)
    .where(eq(schema.subjects.schoolId, schoolId))
    .orderBy(schema.subjects.name);

  const teacherIds = [...new Set(subjects.map((s) => s.teacherId).filter(Boolean))] as string[];
  const teachers = teacherIds.length
    ? await db
        .select({ id: schema.users.id, name: schema.users.name })
        .from(schema.users)
        .where(inArray(schema.users.id, teacherIds))
    : [];

  return {
    subjects: subjects.map((s) => ({
      ...s,
      teacher: s.teacherId ? teachers.find((t) => t.id === s.teacherId)?.name ?? null : null,
    })),
  };
}
