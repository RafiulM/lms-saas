import "server-only";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  schoolId: string | null;
};

/** Header permintaan saat ini (server action / server component). */
export async function getRequestHeaders(): Promise<Headers> {
  return await headers();
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as SessionUser | undefined;
  if (!user) return null;
  return user;
}

export function requireUser(user: SessionUser | null): SessionUser {
  if (!user) throw new Error("Anda harus masuk terlebih dahulu.");
  return user;
}

export function requireSchool(user: SessionUser): string {
  if (!user.schoolId) throw new Error("Akun belum terhubung ke sekolah.");
  return user.schoolId;
}

export function requireRole(
  user: SessionUser | null,
  roles: SessionUser["role"][],
): SessionUser {
  const current = requireUser(user);
  if (!roles.includes(current.role)) {
    throw new Error("Anda tidak memiliki izin untuk melakukan aksi ini.");
  }
  return current;
}

export async function getSchool(schoolId: string) {
  const rows = await db.select().from(schema.schools).where(eq(schema.schools.id, schoolId)).limit(1);
  return rows[0] ?? null;
}

export async function getSchoolOf(user: SessionUser) {
  const schoolId = requireSchool(user);
  const school = await getSchool(schoolId);
  if (!school) throw new Error("Sekolah tidak ditemukan.");
  return { schoolId, school };
}
