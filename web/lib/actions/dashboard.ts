"use server";

import { db, schema } from "@/db";
import { and, avg, count, desc, eq, gte, inArray } from "drizzle-orm";
import { getSessionUser, getSchoolOf, requireRole } from "@/lib/auth-helpers";

/** Data Beranda: jadwal hari ini, tugas mendesak, pengumuman, metrik. */
export async function getActivityReport() {
  const user = requireRole(await getSessionUser(), ["admin", "teacher"]);
  const { schoolId } = await getSchoolOf(user);

  const [classRows, subjectRows, assignmentRows, announcementRows, memberRows, submittedRows] =
    await Promise.all([
      db
        .select({ id: schema.classes.id, name: schema.classes.name })
        .from(schema.classes)
        .where(eq(schema.classes.schoolId, schoolId)),
      db
        .select({ id: schema.subjects.id, name: schema.subjects.name })
        .from(schema.subjects)
        .where(eq(schema.subjects.schoolId, schoolId)),
      db
        .select({
          id: schema.assignments.id,
          title: schema.assignments.title,
          classId: schema.assignments.classId,
          subjectId: schema.assignments.subjectId,
          dueAt: schema.assignments.dueAt,
          createdAt: schema.assignments.createdAt,
        })
        .from(schema.assignments)
        .where(eq(schema.assignments.schoolId, schoolId))
        .orderBy(desc(schema.assignments.createdAt)),
      db
        .select({ id: schema.announcements.id, title: schema.announcements.title, createdAt: schema.announcements.createdAt })
        .from(schema.announcements)
        .where(eq(schema.announcements.schoolId, schoolId))
        .orderBy(desc(schema.announcements.createdAt)),
      db
        .select({ classId: schema.classMembers.classId, n: count() })
        .from(schema.classMembers)
        .where(
          inArray(
            schema.classMembers.classId,
            db.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.schoolId, schoolId)),
          ),
        )
        .groupBy(schema.classMembers.classId),
      db
        .select({ assignmentId: schema.submissions.assignmentId, n: count() })
        .from(schema.submissions)
        .where(
          inArray(
            schema.submissions.assignmentId,
            db.select({ id: schema.assignments.id }).from(schema.assignments).where(eq(schema.assignments.schoolId, schoolId)),
          ),
        )
        .groupBy(schema.submissions.assignmentId),
    ]);

  const className = new Map(classRows.map((c) => [c.id, c.name]));
  const subjectName = new Map(subjectRows.map((s) => [s.id, s.name]));
  const classCountMap = new Map(memberRows.map((m) => [m.classId, m.n]));
  const submittedMap = new Map(submittedRows.map((s) => [s.assignmentId, s.n]));

  const assignmentRowsCsv = assignmentRows.map((a) => ({
    "Judul tugas": a.title,
    Kelas: className.get(a.classId) ?? "",
    "Mata pelajaran": subjectName.get(a.subjectId) ?? "",
    "Dibuat pada": a.createdAt.toISOString().slice(0, 10),
    Tenggat: a.dueAt.toISOString().slice(0, 10),
    Terkumpul: submittedMap.get(a.id) ?? 0,
    "Total murid": classCountMap.get(a.classId) ?? 0,
  }));

  const announcementRowsCsv = announcementRows.map((a) => ({
    Judul: a.title,
    "Dipublikasikan pada": a.createdAt.toISOString().slice(0, 10),
  }));

  const studentCount = [...classCountMap.values()].reduce((sum, n) => sum + n, 0);

  return {
    generatedAt: new Date(),
    stats: {
      assignmentCount: assignmentRows.length,
      announcementCount: announcementRows.length,
      submissionCount: [...submittedMap.values()].reduce((sum, n) => sum + n, 0),
      studentCount,
    },
    assignments: assignmentRowsCsv,
    announcements: announcementRowsCsv,
  };
}

/** Aktivitas terbaru: pengumpulan tugas + pengumuman (feed Beranda). */
export async function getRecentActivity() {
  const user = requireRole(await getSessionUser(), ["admin", "teacher"]);
  const { schoolId } = await getSchoolOf(user);

  const [submissionRows, assignmentRows, announcementRows, classRows, subjectRows] =
    await Promise.all([
      db
        .select({
          id: schema.submissions.id,
          assignmentId: schema.submissions.assignmentId,
          studentId: schema.submissions.studentId,
          studentName: schema.users.name,
          submittedAt: schema.submissions.submittedAt,
          grade: schema.submissions.grade,
        })
        .from(schema.submissions)
        .innerJoin(schema.users, eq(schema.submissions.studentId, schema.users.id))
        .innerJoin(schema.assignments, eq(schema.submissions.assignmentId, schema.assignments.id))
        .where(eq(schema.assignments.schoolId, schoolId))
        .orderBy(desc(schema.submissions.submittedAt))
        .limit(8),
      db
        .select({ id: schema.assignments.id, title: schema.assignments.title, classId: schema.assignments.classId, subjectId: schema.assignments.subjectId })
        .from(schema.assignments)
        .where(eq(schema.assignments.schoolId, schoolId)),
      db
        .select({ id: schema.announcements.id, title: schema.announcements.title, createdAt: schema.announcements.createdAt })
        .from(schema.announcements)
        .where(eq(schema.announcements.schoolId, schoolId))
        .orderBy(desc(schema.announcements.createdAt))
        .limit(3),
      db
        .select({ id: schema.classes.id, name: schema.classes.name })
        .from(schema.classes)
        .where(eq(schema.classes.schoolId, schoolId)),
      db
        .select({ id: schema.subjects.id, name: schema.subjects.name })
        .from(schema.subjects)
        .where(eq(schema.subjects.schoolId, schoolId)),
    ]);

  const className = new Map(classRows.map((c) => [c.id, c.name]));
  const subjectName = new Map(subjectRows.map((s) => [s.id, s.name]));
  const assignmentMap = new Map(assignmentRows.map((a) => [a.id, a]));

  return {
    submissions: submissionRows.map((s) => {
      const assignment = assignmentMap.get(s.assignmentId);
      return {
        id: s.id,
        studentName: s.studentName,
        assignmentTitle: assignment?.title ?? "Tugas dihapus",
        className: assignment ? (className.get(assignment.classId) ?? "") : "",
        subject: assignment ? (subjectName.get(assignment.subjectId) ?? "") : "",
        submittedAt: s.submittedAt,
        graded: s.grade != null,
      };
    }),
    announcements: announcementRows.map((a) => ({
      id: a.id,
      title: a.title,
      createdAt: a.createdAt,
    })),
  };
}

export async function getDashboard() {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const today = new Date().getDay();
  const isStudent = user.role === "student";

  const memberClasses = isStudent
    ? await db
        .select({ classId: schema.classMembers.classId })
        .from(schema.classMembers)
        .where(eq(schema.classMembers.studentId, user.id))
    : [];
  const memberClassIds = memberClasses.map((m) => m.classId);

  const [scheduleRows, announcementRows, assignmentRows, statsRows, avgRows, myGrades, mySubs] = await Promise.all([
    db
      .select()
      .from(schema.schedules)
      .where(and(eq(schema.schedules.schoolId, schoolId), eq(schema.schedules.dayOfWeek, today))),
    db
      .select()
      .from(schema.announcements)
      .where(eq(schema.announcements.schoolId, schoolId))
      .orderBy(desc(schema.announcements.createdAt))
      .limit(5),
    db
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
      .where(and(eq(schema.assignments.schoolId, schoolId), gte(schema.assignments.dueAt, new Date())))
      .orderBy(schema.assignments.dueAt)
      .limit(30),
    db.select().from(schema.schoolStats).where(eq(schema.schoolStats.schoolId, schoolId)).limit(1),
    db.select({ value: avg(schema.grades.value) }).from(schema.grades).where(eq(schema.grades.schoolId, schoolId)),
    isStudent
      ? db
          .select({ value: avg(schema.grades.value) })
          .from(schema.grades)
          .where(eq(schema.grades.studentId, user.id))
      : ([] as { value: number | null }[]),
    isStudent
      ? db.select({ assignmentId: schema.submissions.assignmentId }).from(schema.submissions).where(eq(schema.submissions.studentId, user.id))
      : ([] as { assignmentId: string }[]),
  ]);

  const relevantAssignments = isStudent
    ? assignmentRows.filter((a) => memberClassIds.includes(a.classId))
    : assignmentRows;
  const assignmentIds = relevantAssignments.map((a) => a.id);

  const [classRows, subjectRows, teacherRows] = await Promise.all([
    db.select().from(schema.classes).where(eq(schema.classes.schoolId, schoolId)),
    db.select().from(schema.subjects).where(eq(schema.subjects.schoolId, schoolId)),
    db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(and(eq(schema.users.schoolId, schoolId), inArray(schema.users.role, ["teacher", "admin"]))),
  ]);

  const [classCounts, submittedRows] = await Promise.all([
    classRows.length
      ? db
          .select({ classId: schema.classMembers.classId, n: count() })
          .from(schema.classMembers)
          .where(inArray(schema.classMembers.classId, classRows.map((c) => c.id)))
          .groupBy(schema.classMembers.classId)
      : ([] as { classId: string; n: number }[]),
    assignmentIds.length
      ? db
          .select({ assignmentId: schema.submissions.assignmentId, n: count() })
          .from(schema.submissions)
          .where(inArray(schema.submissions.assignmentId, assignmentIds))
          .groupBy(schema.submissions.assignmentId)
      : ([] as { assignmentId: string; n: number }[]),
  ]);

  const className = new Map(classRows.map((c) => [c.id, c.name]));
  const subjectName = new Map(subjectRows.map((s) => [s.id, s.name]));
  const subjectTone = new Map(subjectRows.map((s) => [s.id, s.tone]));
  const teacherName = new Map(teacherRows.map((t) => [t.id, t.name]));
  const classCountMap = new Map(classCounts.map((c) => [c.classId, c.n]));
  const submittedMap = new Map(submittedRows.map((s) => [s.assignmentId, s.n]));

  const schedule = scheduleRows
    .map((s) => ({
      ...s,
      className: className.get(s.classId) ?? "",
      subject: subjectName.get(s.subjectId) ?? "",
      tone: subjectTone.get(s.subjectId) ?? "teal",
      teacher: s.teacherId ? (teacherName.get(s.teacherId) ?? "") : "",
    }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const assignments = relevantAssignments.map((a) => ({
    id: a.id,
    title: a.title,
    className: className.get(a.classId) ?? "",
    subject: subjectName.get(a.subjectId) ?? "",
    tone: subjectTone.get(a.subjectId) ?? "teal",
    dueAt: a.dueAt,
    teacher: teacherName.get(a.teacherId) ?? "",
    submittedCount: submittedMap.get(a.id) ?? 0,
    totalStudents: classCountMap.get(a.classId) ?? 0,
  }));

  const announcements = announcementRows.map((a) => ({
    id: a.id,
    tag: a.tag,
    tagTone: a.tagTone,
    icon: a.icon,
    title: a.title,
    body: a.body,
    calloutTitle: a.calloutTitle,
    calloutDetail: a.calloutDetail,
    createdAt: a.createdAt,
    author: teacherName.get(a.authorId) ?? "",
  }));

  const stats = statsRows[0];
  const mySubmittedIds = new Set(mySubs.map((s) => s.assignmentId));

  return {
    user,
    schedule,
    announcements,
    assignments,
    student: isStudent
      ? {
          average: myGrades[0]?.value != null ? Number(Number(myGrades[0].value).toFixed(1)) : null,
          submittedCount: mySubs.length,
          totalAssignments: relevantAssignments.length,
          submittedIds: [...mySubmittedIds],
        }
      : null,
    stats: {
      studentCount: stats?.studentCount ?? 0,
      teacherCount: stats?.teacherCount ?? 0,
      classAverage: avgRows[0]?.value != null ? Number(Number(avgRows[0].value).toFixed(1)) : null,
    },
  };
}
