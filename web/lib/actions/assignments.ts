"use server";

import { db, schema } from "@/db";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getSessionUser, getSchoolOf, requireRole } from "@/lib/auth-helpers";

export async function createAssignment(input: {
  classId: string;
  subjectId: string;
  title: string;
  description?: string;
  instructions?: string;
  steps?: string[];
  dueAt: string; // ISO date
  weight?: number;
  format?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
}) {
  const user = requireRole(await getSessionUser(), ["teacher", "admin"]);
  const { schoolId } = await getSchoolOf(user);
  if (!input.title?.trim()) throw new Error("Judul tugas wajib diisi.");
  if (!input.dueAt) throw new Error("Tenggat waktu wajib diisi.");

  const dueAt = new Date(input.dueAt);
  if (Number.isNaN(dueAt.getTime())) throw new Error("Tenggat waktu tidak valid.");

  const id = randomUUID();
  await db.insert(schema.assignments).values({
    id,
    schoolId,
    classId: input.classId,
    subjectId: input.subjectId,
    teacherId: user.id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    instructions: input.instructions?.trim() || null,
    steps: input.steps?.length ? JSON.stringify(input.steps) : null,
    dueAt,
    weight: input.weight ?? 10,
    format: input.format || "PDF, maks. 10 MB",
    attachmentUrl: input.attachmentUrl || null,
    attachmentName: input.attachmentName || null,
    attachmentSize: input.attachmentSize || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id };
}

export async function updateAssignment(
  id: string,
  input: {
    title: string;
    description?: string;
    instructions?: string;
    steps?: string[];
    dueAt: string; // ISO date
    weight?: number;
    format?: string;
  },
) {
  const user = requireRole(await getSessionUser(), ["teacher", "admin"]);
  const { schoolId } = await getSchoolOf(user);
  if (!input.title?.trim()) throw new Error("Judul tugas wajib diisi.");
  if (!input.dueAt) throw new Error("Tenggat waktu wajib diisi.");

  const dueAt = new Date(input.dueAt);
  if (Number.isNaN(dueAt.getTime())) throw new Error("Tenggat waktu tidak valid.");

  const rows = await db
    .select({ id: schema.assignments.id, teacherId: schema.assignments.teacherId })
    .from(schema.assignments)
    .where(and(eq(schema.assignments.id, id), eq(schema.assignments.schoolId, schoolId)))
    .limit(1);
  const assignment = rows[0];
  if (!assignment) throw new Error("Tugas tidak ditemukan.");
  if (user.role !== "admin" && assignment.teacherId !== user.id) {
    throw new Error("Anda tidak memiliki izin untuk mengubah tugas ini.");
  }

  await db
    .update(schema.assignments)
    .set({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      instructions: input.instructions?.trim() || null,
      steps: input.steps?.length ? JSON.stringify(input.steps) : null,
      dueAt,
      weight: input.weight ?? 10,
      format: input.format || "PDF, maks. 10 MB",
      updatedAt: new Date(),
    })
    .where(eq(schema.assignments.id, id));
  return { ok: true };
}

export async function listAssignments() {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const assignments = await db
    .select({
      id: schema.assignments.id,
      title: schema.assignments.title,
      classId: schema.assignments.classId,
      subjectId: schema.assignments.subjectId,
      teacherId: schema.assignments.teacherId,
      dueAt: schema.assignments.dueAt,
      weight: schema.assignments.weight,
      createdAt: schema.assignments.createdAt,
    })
    .from(schema.assignments)
    .where(eq(schema.assignments.schoolId, schoolId))
    .orderBy(desc(schema.assignments.dueAt));

  const classIds = [...new Set(assignments.map((a) => a.classId))];
  const subjectIds = [...new Set(assignments.map((a) => a.subjectId))];
  const teacherIds = [...new Set(assignments.map((a) => a.teacherId))];
  const assignmentIds = assignments.map((a) => a.id);

  const [classes, subjects, teachers, countRows, classCounts] = await Promise.all([
    db.select({ id: schema.classes.id, name: schema.classes.name }).from(schema.classes).where(inArray(schema.classes.id, classIds)),
    db.select({ id: schema.subjects.id, name: schema.subjects.name, tone: schema.subjects.tone }).from(schema.subjects).where(inArray(schema.subjects.id, subjectIds)),
    db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(inArray(schema.users.id, teacherIds)),
    db
      .select({ assignmentId: schema.submissions.assignmentId, n: count() })
      .from(schema.submissions)
      .where(inArray(schema.submissions.assignmentId, assignmentIds))
      .groupBy(schema.submissions.assignmentId),
    db
      .select({ classId: schema.classMembers.classId, n: count() })
      .from(schema.classMembers)
      .where(inArray(schema.classMembers.classId, classIds))
      .groupBy(schema.classMembers.classId),
  ]);

  return {
    assignments: assignments.map((a) => ({
      ...a,
      className: classes.find((c) => c.id === a.classId)?.name ?? "",
      subject: subjects.find((s) => s.id === a.subjectId)?.name ?? "",
      tone: subjects.find((s) => s.id === a.subjectId)?.tone ?? "teal",
      teacher: teachers.find((t) => t.id === a.teacherId)?.name ?? "",
      submittedCount: countRows.find((r) => r.assignmentId === a.id)?.n ?? 0,
      totalStudents: classCounts.find((r) => r.classId === a.classId)?.n ?? 0,
      overdue: a.dueAt.getTime() < Date.now(),
    })),
  };
}

export async function getAssignment(id: string) {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const rows = await db
    .select()
    .from(schema.assignments)
    .where(and(eq(schema.assignments.id, id), eq(schema.assignments.schoolId, schoolId)))
    .limit(1);
  const assignment = rows[0];
  if (!assignment) return null;

  const [classRow, subjectRow, teacherRow] = await Promise.all([
    db.select().from(schema.classes).where(eq(schema.classes.id, assignment.classId)).limit(1),
    db.select().from(schema.subjects).where(eq(schema.subjects.id, assignment.subjectId)).limit(1),
    db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, assignment.teacherId)).limit(1),
  ]);

  return {
    ...assignment,
    steps: assignment.steps ? (JSON.parse(assignment.steps) as string[]) : [],
    className: classRow[0]?.name ?? "",
    subject: subjectRow[0]?.name ?? "",
    tone: subjectRow[0]?.tone ?? "teal",
    teacher: teacherRow[0]?.name ?? "",
  };
}

/** Murid mengumpulkan jawaban tugas. */
export async function submitAssignment(input: {
  assignmentId: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  content?: string;
}) {
  const user = requireRole(await getSessionUser(), ["student"]);
  const { schoolId } = await getSchoolOf(user);

  const assignment = await db
    .select({ id: schema.assignments.id, schoolId: schema.assignments.schoolId })
    .from(schema.assignments)
    .where(eq(schema.assignments.id, input.assignmentId))
    .limit(1);
  if (!assignment[0] || assignment[0].schoolId !== schoolId) {
    throw new Error("Tugas tidak ditemukan.");
  }

  const member = await db
    .select({ id: schema.classMembers.id })
    .from(schema.classMembers)
    .innerJoin(schema.assignments, eq(schema.assignments.classId, schema.classMembers.classId))
    .where(and(eq(schema.assignments.id, input.assignmentId), eq(schema.classMembers.studentId, user.id)))
    .limit(1);
  if (!member[0]) throw new Error("Tugas ini tidak untuk kelasmu.");

  await db
    .insert(schema.submissions)
    .values({
      id: randomUUID(),
      assignmentId: input.assignmentId,
      studentId: user.id,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      fileSize: input.fileSize,
      content: input.content || null,
      submittedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.submissions.assignmentId, schema.submissions.studentId],
      set: {
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileSize: input.fileSize,
        content: input.content || null,
        submittedAt: new Date(),
        grade: null,
        feedback: null,
        gradedAt: null,
      },
    });

  return { ok: true };
}

/** Guru memberi nilai & umpan balik pada pengumpulan. */
export async function gradeSubmission(submissionId: string, grade: number, feedback?: string) {
  const user = requireRole(await getSessionUser(), ["teacher", "admin"]);
  const { schoolId } = await getSchoolOf(user);
  if (grade < 0 || grade > 100) throw new Error("Nilai harus antara 0 dan 100.");

  const row = await db
    .select({
      id: schema.submissions.id,
      schoolId: schema.assignments.schoolId,
      studentId: schema.submissions.studentId,
    })
    .from(schema.submissions)
    .innerJoin(schema.assignments, eq(schema.submissions.assignmentId, schema.assignments.id))
    .where(eq(schema.submissions.id, submissionId))
    .limit(1);
  if (!row[0] || row[0].schoolId !== schoolId) throw new Error("Pengumpulan tidak ditemukan.");

  await db
    .update(schema.submissions)
    .set({ grade, feedback: feedback?.trim() || null, gradedAt: new Date() })
    .where(eq(schema.submissions.id, submissionId));

  const assignment = await db
    .select({ id: schema.assignments.id, classId: schema.assignments.classId, subjectId: schema.assignments.subjectId, weight: schema.assignments.weight, schoolId: schema.assignments.schoolId })
    .from(schema.assignments)
    .where(eq(schema.assignments.id, row[0].id))
    .limit(1);
  if (assignment[0]) {
    const a = assignment[0];
    await db
      .insert(schema.grades)
      .values({
        id: randomUUID(),
        schoolId: a.schoolId,
        classId: a.classId,
        subjectId: a.subjectId,
        studentId: row[0].studentId,
        teacherId: user.id,
        assignmentId: a.id,
        type: "task",
        value: grade,
        note: feedback?.trim() || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  }

  return { ok: true };
}

/** Daftar pengumpulan untuk satu tugas (sisi guru). */
export async function listSubmissions(assignmentId: string) {
  const user = requireRole(await getSessionUser(), ["teacher", "admin"]);
  const { schoolId } = await getSchoolOf(user);

  const assignment = await db
    .select({ id: schema.assignments.id })
    .from(schema.assignments)
    .where(and(eq(schema.assignments.id, assignmentId), eq(schema.assignments.schoolId, schoolId)))
    .limit(1);
  if (!assignment[0]) throw new Error("Tugas tidak ditemukan.");

  return await db
    .select({
      id: schema.submissions.id,
      studentId: schema.submissions.studentId,
      studentName: schema.users.name,
      fileName: schema.submissions.fileName,
      fileUrl: schema.submissions.fileUrl,
      fileSize: schema.submissions.fileSize,
      submittedAt: schema.submissions.submittedAt,
      grade: schema.submissions.grade,
      feedback: schema.submissions.feedback,
      gradedAt: schema.submissions.gradedAt,
    })
    .from(schema.submissions)
    .innerJoin(schema.users, eq(schema.submissions.studentId, schema.users.id))
    .where(eq(schema.submissions.assignmentId, assignmentId))
    .orderBy(asc(schema.submissions.submittedAt));
}

/** Tugas untuk murid: hanya kelasnya + status pengumpulannya. */
export async function listStudentAssignments() {
  const user = requireRole(await getSessionUser(), ["student"]);
  const { schoolId } = await getSchoolOf(user);

  const memberClasses = await db
    .select({ classId: schema.classMembers.classId })
    .from(schema.classMembers)
    .where(eq(schema.classMembers.studentId, user.id));

  if (!memberClasses.length) return { assignments: [] };
  const classIds = memberClasses.map((m) => m.classId);

  const rows = await db
    .select({
      id: schema.assignments.id,
      title: schema.assignments.title,
      classId: schema.assignments.classId,
      subjectId: schema.assignments.subjectId,
      teacherId: schema.assignments.teacherId,
      dueAt: schema.assignments.dueAt,
      weight: schema.assignments.weight,
      createdAt: schema.assignments.createdAt,
    })
    .from(schema.assignments)
    .where(and(eq(schema.assignments.schoolId, schoolId), inArray(schema.assignments.classId, classIds)))
    .orderBy(desc(schema.assignments.dueAt));

  const assignmentIds = rows.map((a) => a.id);
  const [classes, subjects, teachers, mySubmissions] = await Promise.all([
    db.select({ id: schema.classes.id, name: schema.classes.name }).from(schema.classes).where(inArray(schema.classes.id, classIds)),
    db.select({ id: schema.subjects.id, name: schema.subjects.name, tone: schema.subjects.tone }).from(schema.subjects).where(inArray(schema.subjects.id, [...new Set(rows.map((r) => r.subjectId))])),
    db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(inArray(schema.users.id, [...new Set(rows.map((r) => r.teacherId))])),
    assignmentIds.length
      ? db
          .select({ assignmentId: schema.submissions.assignmentId, submittedAt: schema.submissions.submittedAt, grade: schema.submissions.grade })
          .from(schema.submissions)
          .where(and(inArray(schema.submissions.assignmentId, assignmentIds), eq(schema.submissions.studentId, user.id)))
      : [],
  ]);

  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const toneMap = new Map(subjects.map((s) => [s.id, s.tone]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));

  return {
    assignments: rows.map((a) => {
      const mine = mySubmissions.find((s) => s.assignmentId === a.id);
      return {
        id: a.id,
        title: a.title,
        className: classMap.get(a.classId) ?? "",
        subject: subjectMap.get(a.subjectId) ?? "",
        tone: toneMap.get(a.subjectId) ?? "teal",
        teacher: teacherMap.get(a.teacherId) ?? "",
        dueAt: a.dueAt,
        weight: a.weight,
        createdAt: a.createdAt,
        submitted: Boolean(mine),
        graded: mine?.grade != null,
        grade: mine?.grade ?? null,
      };
    }),
  };
}

/** Status pengumpulan milik murid untuk satu tugas. */
export async function getMySubmission(assignmentId: string) {
  const user = requireRole(await getSessionUser(), ["student"]);
  const rows = await db
    .select()
    .from(schema.submissions)
    .where(and(eq(schema.submissions.assignmentId, assignmentId), eq(schema.submissions.studentId, user.id)))
    .limit(1);
  return rows[0] ?? null;
}
