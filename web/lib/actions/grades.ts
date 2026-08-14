"use server";

import { db, schema } from "@/db";
import { and, avg, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getSessionUser, getSchoolOf, requireRole } from "@/lib/auth-helpers";

export async function upsertGrade(input: {
  classId: string;
  subjectId: string;
  studentId: string;
  type: "task" | "exam";
  value: number;
  note?: string;
  assignmentId?: string;
}) {
  const user = requireRole(await getSessionUser(), ["teacher", "admin"]);
  const { schoolId } = await getSchoolOf(user);
  if (input.value < 0 || input.value > 100) throw new Error("Nilai harus antara 0 dan 100.");

  const existing = await db
    .select({ id: schema.grades.id })
    .from(schema.grades)
    .where(
      and(
        eq(schema.grades.classId, input.classId),
        eq(schema.grades.subjectId, input.subjectId),
        eq(schema.grades.studentId, input.studentId),
        eq(schema.grades.type, input.type),
        input.assignmentId
          ? eq(schema.grades.assignmentId, input.assignmentId)
          : sql`${schema.grades.assignmentId} IS NULL`,
      ),
    )
    .limit(1);

  const values = {
    schoolId,
    classId: input.classId,
    subjectId: input.subjectId,
    studentId: input.studentId,
    teacherId: user.id,
    assignmentId: input.assignmentId || null,
    type: input.type,
    value: input.value,
    note: input.note?.trim() || null,
  };

  if (existing[0]) {
    await db
      .update(schema.grades)
      .set({ value: input.value, note: input.note?.trim() || null, updatedAt: new Date() })
      .where(eq(schema.grades.id, existing[0].id));
  } else {
    await db.insert(schema.grades).values({
      id: randomUUID(),
      ...values,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return { ok: true };
}

/** Mengisi nilai sekaligus untuk banyak murid (tugas/ulangan satu kelas). */
export async function bulkInputGrades(input: {
  classId: string;
  subjectId: string;
  type: "task" | "exam";
  entries: { studentId: string; value: number }[];
}) {
  const user = requireRole(await getSessionUser(), ["teacher", "admin"]);
  const { schoolId } = await getSchoolOf(user);

  for (const entry of input.entries) {
    if (entry.value < 0 || entry.value > 100) throw new Error("Nilai harus antara 0 dan 100.");
  }

  for (const entry of input.entries) {
    await upsertGrade({
      classId: input.classId,
      subjectId: input.subjectId,
      studentId: entry.studentId,
      type: input.type,
      value: entry.value,
    });
  }
  return { ok: true, count: input.entries.length };
}

/** Rekap nilai per murid untuk satu kelas + rata-rata kelas. */
export async function getGradeRecap(classId: string, subjectId?: string) {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const classRow = await db
    .select({ id: schema.classes.id })
    .from(schema.classes)
    .where(and(eq(schema.classes.id, classId), eq(schema.classes.schoolId, schoolId)))
    .limit(1);
  if (!classRow[0]) throw new Error("Kelas tidak ditemukan.");

  const rows = await db
    .select({
      studentId: schema.grades.studentId,
      studentName: schema.users.name,
      subjectId: schema.grades.subjectId,
      subjectName: schema.subjects.name,
      type: schema.grades.type,
      value: schema.grades.value,
    })
    .from(schema.grades)
    .innerJoin(schema.users, eq(schema.grades.studentId, schema.users.id))
    .innerJoin(schema.subjects, eq(schema.grades.subjectId, schema.subjects.id))
    .where(subjectId ? and(eq(schema.grades.classId, classId), eq(schema.grades.subjectId, subjectId)) : eq(schema.grades.classId, classId))
    .orderBy(schema.users.name);

  const byStudent = new Map<string, { studentId: string; name: string; subjects: { subject: string; task: number | null; exam: number | null }[] }>();
  for (const row of rows) {
    let student = byStudent.get(row.studentId);
    if (!student) {
      student = { studentId: row.studentId, name: row.studentName, subjects: [] };
      byStudent.set(row.studentId, student);
    }
    let entry = student.subjects.find((s) => s.subject === row.subjectName);
    if (!entry) {
      entry = { subject: row.subjectName, task: null, exam: null };
      student.subjects.push(entry);
    }
    if (row.type === "task") entry.task = row.value;
    else entry.exam = row.value;
  }

  const students = [...byStudent.values()].map((s) => {
    const values = s.subjects.flatMap((sub) => [sub.task, sub.exam]).filter((v): v is number => v !== null);
    const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    return { ...s, average: average !== null ? Number(average.toFixed(1)) : null };
  });

  const classAvgRows = await db
    .select({ value: avg(schema.grades.value) })
    .from(schema.grades)
    .where(eq(schema.grades.classId, classId));

  return {
    students,
    classAverage: classAvgRows[0]?.value ? Number(Number(classAvgRows[0].value).toFixed(1)) : null,
  };
}

/** Ekspor nilai ke CSV (unduhan). */
export async function exportGradesCsv(classId: string, subjectId?: string) {
  const recap = await getGradeRecap(classId, subjectId);
  if (!recap) throw new Error("Anda harus masuk terlebih dahulu.");

  const subjects = [...new Set(recap.students.flatMap((s) => s.subjects.map((sub) => sub.subject)))];
  const header = ["Nama", ...subjects.flatMap((sub) => [`${sub} (Tugas)`, `${sub} (Ulangan)`]), "Rata-rata"];
  const lines = recap.students.map((s) => {
    const cells = subjects.map((sub) => {
      const entry = s.subjects.find((x) => x.subject === sub);
      return [entry?.task ?? "", entry?.exam ?? ""];
    });
    return [s.name, ...cells.flat(), s.average ?? ""].join(",");
  });

  return [header.join(","), ...lines].join("\n");
}

/** Daftar murid sebuah kelas untuk form input nilai. */
export async function getClassRoster(classId: string) {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  return await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
    })
    .from(schema.classMembers)
    .innerJoin(schema.users, eq(schema.classMembers.studentId, schema.users.id))
    .where(inArray(schema.classMembers.classId, [classId]))
    .orderBy(schema.users.name);
}

/** Detail murid: profil, kelas, dan nilai per mata pelajaran. */
export async function getStudentDetail(studentId: string) {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const [userRows, memberRows, gradeRows] = await Promise.all([
    db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, createdAt: schema.users.createdAt })
      .from(schema.users)
      .where(and(eq(schema.users.id, studentId), eq(schema.users.schoolId, schoolId)))
      .limit(1),
    db
      .select({ className: schema.classes.name, classId: schema.classMembers.classId })
      .from(schema.classMembers)
      .innerJoin(schema.classes, eq(schema.classMembers.classId, schema.classes.id))
      .where(eq(schema.classMembers.studentId, studentId)),
    db
      .select({
        subjectId: schema.grades.subjectId,
        subjectName: schema.subjects.name,
        type: schema.grades.type,
        value: schema.grades.value,
      })
      .from(schema.grades)
      .innerJoin(schema.subjects, eq(schema.grades.subjectId, schema.subjects.id))
      .where(eq(schema.grades.studentId, studentId)),
  ]);

  const studentRow = userRows[0];
  if (!studentRow) return null;

  const bySubject = new Map<string, { subject: string; task: number | null; exam: number | null }>();
  for (const row of gradeRows) {
    const entry = bySubject.get(row.subjectId) ?? { subject: row.subjectName, task: null, exam: null };
    if (row.type === "task") entry.task = row.value;
    else entry.exam = row.value;
    bySubject.set(row.subjectId, entry);
  }

  const subjects = [...bySubject.values()];
  const values = subjects.flatMap((s) => [s.task, s.exam]).filter((v): v is number => v !== null);
  const average = values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : null;

  return {
    id: studentRow.id,
    name: studentRow.name,
    email: studentRow.email,
    joinedAt: studentRow.createdAt,
    className: memberRows.map((m) => m.className).join(", "),
    average,
    subjects,
  };
}

/** Nilai milik murid yang sedang login (per mata pelajaran). */
export async function getMyGrades() {
  const user = requireRole(await getSessionUser(), ["student"]);
  const { schoolId } = await getSchoolOf(user);

  const rows = await db
    .select({
      subjectId: schema.grades.subjectId,
      subjectName: schema.subjects.name,
      teacherId: schema.grades.teacherId,
      type: schema.grades.type,
      value: schema.grades.value,
    })
    .from(schema.grades)
    .innerJoin(schema.subjects, eq(schema.grades.subjectId, schema.subjects.id))
    .where(eq(schema.grades.studentId, user.id));

  const teacherIds = [...new Set(rows.map((r) => r.teacherId))] as string[];
  const teachers = teacherIds.length
    ? await db
        .select({ id: schema.users.id, name: schema.users.name })
        .from(schema.users)
        .where(inArray(schema.users.id, teacherIds))
    : [];
  const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));

  const bySubject = new Map<string, { subject: string; teacher: string; task: number | null; exam: number | null }>();
  for (const row of rows) {
    const entry = bySubject.get(row.subjectId) ?? {
      subject: row.subjectName,
      teacher: row.teacherId ? (teacherMap.get(row.teacherId) ?? "") : "",
      task: null,
      exam: null,
    };
    if (row.type === "task") entry.task = row.value;
    else entry.exam = row.value;
    bySubject.set(row.subjectId, entry);
  }

  const subjects = [...bySubject.values()];
  const values = subjects.flatMap((s) => [s.task, s.exam]).filter((v): v is number => v !== null);
  const average = values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : null;

  return { subjects, average };
}
