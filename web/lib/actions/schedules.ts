"use server";

import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getSessionUser, getSchoolOf, requireRole } from "@/lib/auth-helpers";

export type ScheduleInput = {
  classId: string;
  subjectId: string;
  teacherId?: string;
  dayOfWeek: number; // 0=Min … 6=Sab
  startTime: string; // "07:30"
  endTime: string; // "09:00"
};

export async function upsertSchedule(input: ScheduleInput, scheduleId?: string) {
  const user = requireRole(await getSessionUser(), ["admin", "teacher"]);
  const { schoolId } = await getSchoolOf(user);

  if (input.dayOfWeek < 0 || input.dayOfWeek > 6) throw new Error("Hari tidak valid.");
  if (!/^\d{2}:\d{2}$/.test(input.startTime) || !/^\d{2}:\d{2}$/.test(input.endTime)) {
    throw new Error("Format jam tidak valid (contoh: 07:30).");
  }

  if (scheduleId) {
    await db
      .update(schema.schedules)
      .set({
        classId: input.classId,
        subjectId: input.subjectId,
        teacherId: input.teacherId || null,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.schedules.id, scheduleId), eq(schema.schedules.schoolId, schoolId)));
    return { id: scheduleId };
  }

  const id = randomUUID();
  await db.insert(schema.schedules).values({
    id,
    schoolId,
    classId: input.classId,
    subjectId: input.subjectId,
    teacherId: input.teacherId || null,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id };
}

export async function deleteSchedule(id: string) {
  const user = requireRole(await getSessionUser(), ["admin", "teacher"]);
  const { schoolId } = await getSchoolOf(user);
  await db
    .delete(schema.schedules)
    .where(and(eq(schema.schedules.id, id), eq(schema.schedules.schoolId, schoolId)));
  return { ok: true };
}

/** Opsi form jadwal: kelas, mata pelajaran, dan guru. */
export async function getScheduleOptions() {
  const user = requireRole(await getSessionUser(), ["admin", "teacher"]);
  const { schoolId } = await getSchoolOf(user);

  const [classes, subjects, teachers] = await Promise.all([
    db
      .select({ id: schema.classes.id, name: schema.classes.name })
      .from(schema.classes)
      .where(eq(schema.classes.schoolId, schoolId))
      .orderBy(schema.classes.name),
    db
      .select({ id: schema.subjects.id, name: schema.subjects.name })
      .from(schema.subjects)
      .where(eq(schema.subjects.schoolId, schoolId))
      .orderBy(schema.subjects.name),
    db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(and(eq(schema.users.schoolId, schoolId), eq(schema.users.role, "teacher")))
      .orderBy(schema.users.name),
  ]);

  return { classes, subjects, teachers };
}

export async function getScheduleGrid() {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  let filteredClassIds: string[] | null = null;
  if (user.role === "student") {
    const memberships = await db
      .select({ classId: schema.classMembers.classId })
      .from(schema.classMembers)
      .where(eq(schema.classMembers.studentId, user.id));
    filteredClassIds = memberships.map((m) => m.classId);
  }

  const [schedules, classes, subjects, teachers] = await Promise.all([
    db.select().from(schema.schedules).where(eq(schema.schedules.schoolId, schoolId)),
    db.select().from(schema.classes).where(eq(schema.classes.schoolId, schoolId)),
    db.select().from(schema.subjects).where(eq(schema.subjects.schoolId, schoolId)),
    db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(and(eq(schema.users.schoolId, schoolId), eq(schema.users.role, "teacher"))),
  ]);

  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const toneMap = new Map(subjects.map((s) => [s.id, s.tone]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));

  const rows = schedules
    .filter((s) => !filteredClassIds || filteredClassIds.includes(s.classId))
    .map((s) => ({
      ...s,
      className: classMap.get(s.classId) ?? "",
      subject: subjectMap.get(s.subjectId) ?? "",
      tone: toneMap.get(s.subjectId) ?? "teal",
      teacher: s.teacherId ? (teacherMap.get(s.teacherId) ?? "") : "",
    }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));

  return {
    isStudent: user.role === "student",
    myClassName: filteredClassIds ? filteredClassIds.map((id) => classMap.get(id) ?? "").filter(Boolean).join(", ") : "",
    days: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    schedules: rows,
  };
}
