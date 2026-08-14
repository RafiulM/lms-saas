"use server";

import { db, schema } from "@/db";
import { auth } from "@/lib/auth";
import { and, count, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getRequestHeaders, getSessionUser, getSchoolOf, requireRole } from "@/lib/auth-helpers";
import type { CreateUserInput } from "@/lib/user-import";

/** Membuat satu atau banyak akun (dipakai untuk salin-tempel dari Excel). */
export async function createUsers(inputs: CreateUserInput[]) {
  const user = requireRole(await getSessionUser(), ["admin"]);
  const { schoolId } = await getSchoolOf(user);
  if (!inputs.length) throw new Error("Tidak ada data yang dikirim.");

  const results: { email: string; ok: boolean; error?: string }[] = [];

  for (const item of inputs) {
    const name = item.name?.trim();
    const email = item.email?.trim().toLowerCase();
    const password = item.password;
    if (!name || !email || !password) {
      results.push({ email: item.email ?? "", ok: false, error: "Data tidak lengkap" });
      continue;
    }
    try {
      const res = await auth.api.createUser({
        headers: await getRequestHeaders(),
        body: {
          name,
          email,
          password,
          role: item.role === "teacher" ? "teacher" : "student",
          data: { schoolId },
        },
      });
      if (item.role === "student" && item.className) {
        const target = await db
          .select({ id: schema.classes.id })
          .from(schema.classes)
          .where(and(eq(schema.classes.schoolId, schoolId), eq(schema.classes.name, item.className)))
          .limit(1);
        if (target[0]) {
          await db.insert(schema.classMembers).values({
            id: randomUUID(),
            classId: target[0].id,
            studentId: res.user.id,
            createdAt: new Date(),
          });
        }
      }
      results.push({ email, ok: true });
    } catch (error) {
      results.push({ email, ok: false, error: error instanceof Error ? error.message : "Gagal membuat akun" });
    }
  }

  await refreshSchoolStats(schoolId);
  return { results };
}

export async function deleteUser(userId: string) {
  const admin = requireRole(await getSessionUser(), ["admin"]);
  const { schoolId } = await getSchoolOf(admin);

  const target = await db
    .select({ id: schema.users.id, role: schema.users.role, schoolId: schema.users.schoolId })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!target[0] || target[0].schoolId !== schoolId) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  await db.delete(schema.users).where(eq(schema.users.id, userId));
  await refreshSchoolStats(schoolId);
  return { ok: true };
}

export async function listUsers() {
  const user = await getSessionUser();
  if (!user) return null;
  const { schoolId } = await getSchoolOf(user);

  const users = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.schoolId, schoolId))
    .orderBy(schema.users.role, schema.users.name);

  const studentIds = users.filter((u) => u.role === "student").map((u) => u.id);
  const memberships = studentIds.length
    ? await db
        .select({ studentId: schema.classMembers.studentId, className: schema.classes.name })
        .from(schema.classMembers)
        .innerJoin(schema.classes, eq(schema.classMembers.classId, schema.classes.id))
        .where(inArray(schema.classMembers.studentId, studentIds))
    : [];

  return {
    users: users.map((u) => ({
      ...u,
      className: memberships.filter((m) => m.studentId === u.id).map((m) => m.className).join(", "),
    })),
  };
}

export async function refreshSchoolStats(schoolId: string) {
  const [students, teachers] = await Promise.all([
    db
      .select({ n: count() })
      .from(schema.users)
      .where(and(eq(schema.users.schoolId, schoolId), eq(schema.users.role, "student"))),
    db
      .select({ n: count() })
      .from(schema.users)
      .where(and(eq(schema.users.schoolId, schoolId), eq(schema.users.role, "teacher"))),
  ]);
  await db
    .insert(schema.schoolStats)
    .values({
      schoolId,
      studentCount: students[0]?.n ?? 0,
      teacherCount: teachers[0]?.n ?? 0,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.schoolStats.schoolId,
      set: {
        studentCount: students[0]?.n ?? 0,
        teacherCount: teachers[0]?.n ?? 0,
        updatedAt: new Date(),
      },
    });
}
