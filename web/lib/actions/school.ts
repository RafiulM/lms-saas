"use server";

import { db, schema } from "@/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getRequestHeaders, getSessionUser, getSchoolOf, requireRole } from "@/lib/auth-helpers";

type RegisterSchoolInput = {
  name: string;
  address?: string;
  email: string;
  password: string;
  adminName: string;
};

export async function registerSchool(input: RegisterSchoolInput) {
  const name = input.name?.trim();
  const adminName = input.adminName?.trim();
  const email = input.email?.trim().toLowerCase();
  const password = input.password;

  if (!name || !email || !password || !adminName) {
    throw new Error("Nama sekolah, nama admin, email, dan kata sandi wajib diisi.");
  }
  if (password.length < 6) {
    throw new Error("Kata sandi minimal 6 karakter.");
  }

  const schoolId = randomUUID();
  await db.insert(schema.schools).values({
    id: schoolId,
    name,
    address: input.address?.trim() ?? null,
    email,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  try {
    const res = await auth.api.signUpEmail({
      headers: await getRequestHeaders(),
      body: { name: adminName, email, password },
    });
    await db
      .update(schema.users)
      .set({ role: "admin", schoolId, updatedAt: new Date() })
      .where(eq(schema.users.id, res.user.id));
  } catch (error) {
    await db.delete(schema.schools).where(eq(schema.schools.id, schoolId));
    throw error;
  }

  return { schoolId };
}

export async function updateSchool(input: {
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  logo?: string;
}) {
  const user = requireRole(await getSessionUser(), ["admin"]);
  const { schoolId } = await getSchoolOf(user);

  if (!input.name?.trim()) throw new Error("Nama sekolah tidak boleh kosong.");

  await db
    .update(schema.schools)
    .set({
      name: input.name.trim(),
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
      description: input.description?.trim() || null,
      logo: input.logo || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.schools.id, schoolId));

  return { ok: true };
}

export async function getSchoolProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  const school = await getSchoolOf(user);
  return { school: school.school, role: user.role };
}
