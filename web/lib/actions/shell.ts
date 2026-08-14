"use server";

import { db, schema } from "@/db";
import { and, count, eq, gte, inArray } from "drizzle-orm";
import { getSessionUser, getSchoolOf } from "@/lib/auth-helpers";

export interface ShellData {
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "teacher" | "student";
    schoolId: string | null;
  } | null;
  school: { id: string; name: string; logo: string | null } | null;
  counts: { beranda: number; tugas: number; pengumuman: number };
}

/** Data shell (sidebar + topbar): profil sekolah, pengguna, dan badge count nyata. */
export async function getShellData(): Promise<ShellData> {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, school: null, counts: { beranda: 0, tugas: 0, pengumuman: 0 } };
  }

  const { schoolId, school } = await getSchoolOf(user);
  const isStudent = user.role === "student";
  const today = new Date().getDay();
  const now = new Date();

  const [announcementRows, todayScheduleRows, assignmentRows, memberRows, mySubmissionRows] =
    await Promise.all([
      db
        .select({ n: count() })
        .from(schema.announcements)
        .where(eq(schema.announcements.schoolId, schoolId)),
      db
        .select({ classId: schema.schedules.classId })
        .from(schema.schedules)
        .where(
          and(eq(schema.schedules.schoolId, schoolId), eq(schema.schedules.dayOfWeek, today)),
        ),
      db
        .select({ id: schema.assignments.id, classId: schema.assignments.classId })
        .from(schema.assignments)
        .where(and(eq(schema.assignments.schoolId, schoolId), gte(schema.assignments.dueAt, now))),
      isStudent
        ? db
            .select({ classId: schema.classMembers.classId })
            .from(schema.classMembers)
            .where(eq(schema.classMembers.studentId, user.id))
        : ([] as { classId: string }[]),
      isStudent
        ? db
            .select({ assignmentId: schema.submissions.assignmentId })
            .from(schema.submissions)
            .where(eq(schema.submissions.studentId, user.id))
        : ([] as { assignmentId: string }[]),
    ]);

  const memberClassIds = new Set(memberRows.map((m) => m.classId));
  const relevantAssignments = isStudent
    ? assignmentRows.filter((a) => memberClassIds.has(a.classId))
    : assignmentRows;
  const submittedIds = new Set(mySubmissionRows.map((s) => s.assignmentId));

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    },
    school: { id: school.id, name: school.name, logo: school.logo },
    counts: {
      beranda: todayScheduleRows.filter((s) => !isStudent || memberClassIds.has(s.classId)).length,
      tugas: isStudent
        ? relevantAssignments.filter((a) => !submittedIds.has(a.id)).length
        : relevantAssignments.length,
      pengumuman: announcementRows[0]?.n ?? 0,
    },
  };
}
