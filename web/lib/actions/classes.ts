"use server";

import { db, schema } from "@/db";
import { and, count, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getSessionUser, getSchoolOf, requireRole } from "@/lib/auth-helpers";

export async function createClass(input: {
  name: string;
  level?: string;
  room?: string;
  homeroomTeacherId?: string;
}) {
  const user = requireRole(await getSessionUser(), ["admin", "teacher"]);
  const { schoolId } = await getSchoolOf(user);
  if (!input.name?.trim()) throw new Error("Nama kelas wajib diisi.");

  const id = randomUUID();
  await db.insert(schema.classes).values({
    id,
    schoolId,
    name: input.name.trim(),
    level: input.level?.trim() || null,
    room: input.room?.trim() || null,
    homeroomTeacherId: input.homeroomTeacherId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id };
}

export async function updateClass(
  id: string,
  input: { name?: string; level?: string; room?: string; homeroomTeacherId?: string | null },
) {
  const user = requireRole(await getSessionUser(), ["admin"]);
  const { schoolId } = await getSchoolOf(user);

  const target = await db
    .select({ id: schema.classes.id })
    .from(schema.classes)
    .where(and(eq(schema.classes.id, id), eq(schema.classes.schoolId, schoolId)))
    .limit(1);
  if (!target[0]) throw new Error("Kelas tidak ditemukan.");

  await db
    .update(schema.classes)
    .set({
      name: input.name?.trim() || undefined,
      level: input.level?.trim() || null,
      room: input.room?.trim() || null,
      homeroomTeacherId: input.homeroomTeacherId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.classes.id, id));
  return { ok: true };
}

export async function deleteClass(id: string) {
  const user = requireRole(await getSessionUser(), ["admin"]);
  const { schoolId } = await getSchoolOf(user);

  await db
    .delete(schema.classes)
    .where(and(eq(schema.classes.id, id), eq(schema.classes.schoolId, schoolId)));
  return { ok: true };
}

export async function addStudentsToClass(classId: string, studentIds: string[]) {
  const user = requireRole(await getSessionUser(), ["admin"]);
  const { schoolId } = await getSchoolOf(user);

  const target = await db
    .select({ id: schema.classes.id })
    .from(schema.classes)
    .where(and(eq(schema.classes.id, classId), eq(schema.classes.schoolId, schoolId)))
    .limit(1);
  if (!target[0]) throw new Error("Kelas tidak ditemukan.");

  const valid = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(inArray(schema.users.id, studentIds), eq(schema.users.schoolId, schoolId), eq(schema.users.role, "student")));

  for (const student of valid) {
    await db
      .insert(schema.classMembers)
      .values({ id: randomUUID(), classId, studentId: student.id, createdAt: new Date() })
      .onConflictDoNothing();
  }
  return { added: valid.length };
}

export async function removeStudentFromClass(classId: string, studentId: string) {
  const user = requireRole(await getSessionUser(), ["admin"]);
  const { schoolId } = await getSchoolOf(user);

  await db
    .delete(schema.classMembers)
    .where(
      and(
        eq(schema.classMembers.classId, classId),
        eq(schema.classMembers.studentId, studentId),
        inArray(
          schema.classMembers.classId,
          db.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.schoolId, schoolId)),
        ),
      ),
    );
  return { ok: true };
}

export async function listClasses() {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const classes = await db
    .select({
      id: schema.classes.id,
      name: schema.classes.name,
      level: schema.classes.level,
      room: schema.classes.room,
      homeroomTeacherId: schema.classes.homeroomTeacherId,
    })
    .from(schema.classes)
    .where(eq(schema.classes.schoolId, schoolId))
    .orderBy(schema.classes.name);

  const classIds = classes.map((c) => c.id);
  const members = classIds.length
    ? await db
        .select({ classId: schema.classMembers.classId, n: count() })
        .from(schema.classMembers)
        .where(inArray(schema.classMembers.classId, classIds))
        .groupBy(schema.classMembers.classId)
    : [];
  const teachers = await db
    .select({ id: schema.users.id, name: schema.users.name })
    .from(schema.users)
    .where(and(eq(schema.users.schoolId, schoolId), eq(schema.users.role, "teacher")));

  return {
    classes: classes.map((c) => ({
      ...c,
      studentCount: members.find((m) => m.classId === c.id)?.n ?? 0,
      homeroomTeacher: c.homeroomTeacherId ? teachers.find((t) => t.id === c.homeroomTeacherId)?.name ?? null : null,
    })),
  };
}

/** Detail kelas: info, wali kelas, murid, mata pelajaran, dan jadwal kelas. */
export async function getClassDetailData(classId: string) {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const [classRows, roster, subjectRows, scheduleRows] = await Promise.all([
    db
      .select()
      .from(schema.classes)
      .where(and(eq(schema.classes.id, classId), eq(schema.classes.schoolId, schoolId)))
      .limit(1),
    db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.classMembers)
      .innerJoin(schema.users, eq(schema.classMembers.studentId, schema.users.id))
      .where(eq(schema.classMembers.classId, classId))
      .orderBy(schema.users.name),
    db
      .select({ id: schema.subjects.id, name: schema.subjects.name, tone: schema.subjects.tone, teacherId: schema.subjects.teacherId })
      .from(schema.subjects)
      .where(eq(schema.subjects.schoolId, schoolId)),
    db
      .select()
      .from(schema.schedules)
      .where(and(eq(schema.schedules.classId, classId), eq(schema.schedules.schoolId, schoolId)))
      .orderBy(schema.schedules.dayOfWeek, schema.schedules.startTime),
  ]);

  const classRow = classRows[0];
  if (!classRow) return null;

  const teacherIds = [...new Set([...subjectRows.map((s) => s.teacherId), classRow.homeroomTeacherId].filter(Boolean))] as string[];
  const teachers = teacherIds.length
    ? await db
        .select({ id: schema.users.id, name: schema.users.name })
        .from(schema.users)
        .where(inArray(schema.users.id, teacherIds))
    : [];
  const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));
  const homeroom = classRow.homeroomTeacherId ? teacherMap.get(classRow.homeroomTeacherId) : null;

  const subjectMap = new Map(subjectRows.map((s) => [s.id, s.name]));
  const toneMap = new Map(subjectRows.map((s) => [s.id, s.tone]));

  return {
    id: classRow.id,
    name: classRow.name,
    level: classRow.level,
    room: classRow.room,
    homeroom,
    studentCount: roster.length,
    roster: roster.map((r) => ({ id: r.id, name: r.name })),
    subjects: subjectRows.map((s) => ({
      name: s.name,
      teacher: s.teacherId ? (teacherMap.get(s.teacherId) ?? "") : "",
      tone: s.tone,
    })),
    schedule: scheduleRows.map((s) => ({
      subject: subjectMap.get(s.subjectId) ?? "",
      tone: toneMap.get(s.subjectId) ?? "teal",
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      teacher: s.teacherId ? (teacherMap.get(s.teacherId) ?? "") : "",
    })),
  };
}
