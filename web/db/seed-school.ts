/**
 * Seed dummy data (mata pelajaran, tugas, jadwal) untuk sekolah admin.
 * Aman & idempotent: tidak menghapus data, hanya menambah yang belum ada.
 * Kelas/guru yang sudah ada dipakai ulang; bila belum ada, dibuat.
 *
 * Jalankan (pakai DATABASE_URL bila target Turso/prod):
 *   npm run db:seed:school
 *   DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:seed:school
 */
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@smkn5bdg.sch.id";
const PASSWORD = "password123";

const ts = (date = new Date()) => date;
const daysFromNow = (days: number, hour = 17, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const CLASS_PLAN = [
  { name: "XII IPA 1", level: "Kelas unggulan", room: "Ruang 203", homeroom: "Nabila Rahma" },
  { name: "XI IPA 2", level: "Kelas reguler", room: "Ruang 105", homeroom: "Dedi Firmansyah" },
  { name: "XII IPA 3", level: "Kelas reguler", room: "Ruang 207", homeroom: "Sari Wulandari" },
] as const;

const TEACHER_PLAN = [
  { name: "Nabila Rahma", email: "nabila@smkn5bdg.sch.id" },
  { name: "Dedi Firmansyah", email: "dedi@smkn5bdg.sch.id" },
  { name: "Sari Wulandari", email: "sari@smkn5bdg.sch.id" },
] as const;

const SUBJECT_PLAN = [
  { name: "Matematika", teacher: "Nabila Rahma", tone: "teal" },
  { name: "Fisika", teacher: "Dedi Firmansyah", tone: "purple" },
  { name: "Bahasa Indonesia", teacher: "Sari Wulandari", tone: "coral" },
  { name: "Bahasa Inggris", teacher: "Dedi Firmansyah", tone: "blue" },
  { name: "Wali Kelas", teacher: "Nabila Rahma", tone: "orange" },
] as const;

const ASSIGNMENT_PLAN = [
  {
    title: "Persamaan Kuadrat",
    subject: "Matematika",
    className: "XII IPA 1",
    dueDays: 0,
    dueHour: 17,
    weight: 20,
    desc: "Kerjakan latihan berikut untuk menguji pemahaman siswa tentang akar-akar persamaan kuadrat. Minta siswa menulis langkah pengerjaan dengan jelas.",
    steps: ["Kerjakan soal nomor 1 sampai 5.", "Gunakan metode pemfaktoran atau rumus ABC.", "Unggah jawaban dalam format PDF."],
  },
  {
    title: "Statistika Deskriptif",
    subject: "Matematika",
    className: "XI IPA 2",
    dueDays: 1,
    dueHour: 12,
    weight: 15,
    desc: "Kerjakan latihan statistika deskriptif: mean, median, modus, dan interpretasi data.",
    steps: ["Kerjakan soal nomor 1 sampai 4.", "Tuliskan langkah perhitungan.", "Unggah jawaban dalam format PDF."],
  },
  {
    title: "Refleksi Proyek Akhir",
    subject: "Wali Kelas",
    className: "XII IPA 3",
    dueDays: 1,
    dueHour: 15,
    dueMinute: 30,
    weight: 10,
    desc: "Tuliskan refleksi perjalanan proyek akhir kelas dan pelajaran yang didapat.",
    steps: ["Rangkum proses pengerjaan proyek.", "Tulis pelajaran dan kendala.", "Unggah refleksi dalam format PDF."],
  },
  {
    title: "Latihan Limit Fungsi",
    subject: "Matematika",
    className: "XII IPA 1",
    dueDays: -5,
    dueHour: 12,
    weight: 15,
    desc: "Latihan limit fungsi aljabar dan tak hingga.",
    steps: ["Kerjakan soal nomor 1 sampai 6.", "Sertakan grafik pendekatan.", "Unggah jawaban dalam format PDF."],
  },
  {
    title: "Rangkuman Gerak Parabola",
    subject: "Fisika",
    className: "XI IPA 2",
    dueDays: 1,
    dueHour: 12,
    weight: 10,
    desc: "Buat rangkuman materi gerak parabola beserta contoh soal dan penyelesaiannya.",
    steps: ["Ringkas konsep dasar gerak parabola.", "Sertakan minimal dua contoh soal.", "Unggah rangkuman dalam format PDF."],
  },
  {
    title: "Teks Eksplanasi",
    subject: "Bahasa Indonesia",
    className: "XI IPA 2",
    dueDays: -3,
    dueHour: 12,
    weight: 15,
    desc: "Susun teks eksplanasi bertema fenomena alam dengan struktur yang tepat.",
    steps: ["Tentukan fenomena yang dijelaskan.", "Sertakan sebab dan akibat.", "Unggah teks dalam format PDF."],
  },
] as const;

/** classId, subjectId, teacherId, dayOfWeek, startTime, endTime */
const SCHEDULE_PLAN: [string, string, string, number, string, string][] = [
  ["XII IPA 1", "Matematika", "Nabila Rahma", 1, "07:30", "09:00"],
  ["XII IPA 1", "Matematika", "Nabila Rahma", 3, "08:00", "09:30"],
  ["XII IPA 1", "Wali Kelas", "Nabila Rahma", 4, "13:00", "14:00"],
  ["XI IPA 2", "Matematika", "Nabila Rahma", 1, "10:00", "11:30"],
  ["XI IPA 2", "Matematika", "Nabila Rahma", 2, "10:00", "11:30"],
  ["XI IPA 2", "Fisika", "Dedi Firmansyah", 2, "07:30", "09:00"],
  ["XI IPA 2", "Bahasa Indonesia", "Sari Wulandari", 3, "07:30", "09:00"],
  ["XII IPA 3", "Matematika", "Nabila Rahma", 1, "13:00", "14:30"],
  ["XII IPA 3", "Matematika", "Nabila Rahma", 3, "13:00", "14:30"],
  ["XII IPA 3", "Fisika", "Dedi Firmansyah", 4, "07:30", "09:00"],
  ["XII IPA 3", "Bahasa Indonesia", "Sari Wulandari", 1, "07:30", "09:00"],
  ["XII IPA 1", "Fisika", "Dedi Firmansyah", 2, "07:30", "09:00"],
  ["XII IPA 1", "Bahasa Indonesia", "Sari Wulandari", 5, "07:30", "09:00"],
  ["XI IPA 2", "Bahasa Inggris", "Dedi Firmansyah", 4, "07:30", "09:00"],
];

async function main() {
  console.log(`Seed dummy data dimulai (admin: ${ADMIN_EMAIL})…`);

  const admin = (
    await db
      .select({ id: schema.users.id, schoolId: schema.users.schoolId })
      .from(schema.users)
      .where(eq(schema.users.email, ADMIN_EMAIL))
      .limit(1)
  )[0];
  if (!admin || !admin.schoolId) {
    throw new Error(`Admin ${ADMIN_EMAIL} tidak ditemukan. Jalankan npm run db:seed dulu untuk membuat akun sekolah.`);
  }
  const schoolId = admin.schoolId;

  // ── Guru (buat hanya bila belum ada) ──
  const teacherIds = new Map<string, string>();
  for (const plan of TEACHER_PLAN) {
    const existing = (
      await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(and(eq(schema.users.email, plan.email), eq(schema.users.schoolId, schoolId)))
        .limit(1)
    )[0];
    if (existing) {
      teacherIds.set(plan.name, existing.id);
      continue;
    }
    const res = await authApiSignUp(plan.name, plan.email, schoolId);
    teacherIds.set(plan.name, res.id);
    console.log(`  + guru dibuat: ${plan.name}`);
  }

  // ── Kelas (pakai yang ada, buat bila belum) ──
  const classIds = new Map<string, string>();
  for (const plan of CLASS_PLAN) {
    const existing = (
      await db
        .select({ id: schema.classes.id })
        .from(schema.classes)
        .where(and(eq(schema.classes.name, plan.name), eq(schema.classes.schoolId, schoolId)))
        .limit(1)
    )[0];
    if (existing) {
      classIds.set(plan.name, existing.id);
      continue;
    }
    const id = randomUUID();
    await db.insert(schema.classes).values({
      id,
      schoolId,
      name: plan.name,
      level: plan.level,
      room: plan.room,
      homeroomTeacherId: teacherIds.get(plan.homeroom) ?? null,
      createdAt: ts(),
      updatedAt: ts(),
    });
    classIds.set(plan.name, id);
    console.log(`  + kelas dibuat: ${plan.name}`);
  }

  // ── Mata pelajaran (unik per nama+sekolah) ──
  const subjectIds = new Map<string, string>();
  let subjectsAdded = 0;
  for (const plan of SUBJECT_PLAN) {
    const existing = (
      await db
        .select({ id: schema.subjects.id })
        .from(schema.subjects)
        .where(and(eq(schema.subjects.name, plan.name), eq(schema.subjects.schoolId, schoolId)))
        .limit(1)
    )[0];
    if (existing) {
      subjectIds.set(plan.name, existing.id);
      continue;
    }
    const id = randomUUID();
    await db.insert(schema.subjects).values({
      id,
      schoolId,
      name: plan.name,
      teacherId: teacherIds.get(plan.teacher) ?? null,
      tone: plan.tone,
      createdAt: ts(),
      updatedAt: ts(),
    });
    subjectIds.set(plan.name, id);
    subjectsAdded++;
  }
  console.log(`Mata pelajaran: ${SUBJECT_PLAN.length} total, ${subjectsAdded} baru.`);

  // ── Tugas (lewati yang judul+kelasnya sudah ada) ──
  let assignmentsAdded = 0;
  for (const plan of ASSIGNMENT_PLAN) {
    const classId = classIds.get(plan.className);
    const subjectId = subjectIds.get(plan.subject);
    if (!classId || !subjectId) {
      console.warn(`  ! lewati tugas ${plan.title}: kelas/mapel belum tersedia.`);
      continue;
    }
    const existing = (
      await db
        .select({ id: schema.assignments.id })
        .from(schema.assignments)
        .where(and(eq(schema.assignments.title, plan.title), eq(schema.assignments.classId, classId), eq(schema.assignments.schoolId, schoolId)))
        .limit(1)
    )[0];
    if (existing) continue;

    const teacherId = teacherIds.get(SUBJECT_PLAN.find((s) => s.name === plan.subject)?.teacher ?? "") ?? admin.id;
    await db.insert(schema.assignments).values({
      id: randomUUID(),
      schoolId,
      classId,
      subjectId,
      teacherId,
      title: plan.title,
      description: plan.desc,
      instructions: plan.desc,
      steps: JSON.stringify(plan.steps),
      dueAt: daysFromNow(plan.dueDays, plan.dueHour ?? 17, plan.dueMinute ?? 0),
      weight: plan.weight,
      format: "PDF, maks. 10 MB",
      attachmentName: `Materi ${plan.title}.pdf`,
      attachmentSize: "1.1 MB",
      createdAt: ts(),
      updatedAt: ts(),
    });
    assignmentsAdded++;
  }
  console.log(`Tugas: ${ASSIGNMENT_PLAN.length} total, ${assignmentsAdded} baru.`);

  // ── Jadwal mingguan (lewati slot identik yang sudah ada) ──
  let schedulesAdded = 0;
  for (const [className, subjectName, teacherName, dayOfWeek, startTime, endTime] of SCHEDULE_PLAN) {
    const classId = classIds.get(className);
    const subjectId = subjectIds.get(subjectName);
    if (!classId || !subjectId) {
      console.warn(`  ! lewati jadwal ${className} ${subjectName}: kelas/mapel belum tersedia.`);
      continue;
    }
    const existing = (
      await db
        .select({ id: schema.schedules.id })
        .from(schema.schedules)
        .where(
          and(
            eq(schema.schedules.classId, classId),
            eq(schema.schedules.subjectId, subjectId),
            eq(schema.schedules.dayOfWeek, dayOfWeek),
            eq(schema.schedules.startTime, startTime),
            eq(schema.schedules.schoolId, schoolId),
          ),
        )
        .limit(1)
    )[0];
    if (existing) continue;

    await db.insert(schema.schedules).values({
      id: randomUUID(),
      schoolId,
      classId,
      subjectId,
      teacherId: teacherIds.get(teacherName) ?? null,
      dayOfWeek,
      startTime,
      endTime,
      createdAt: ts(),
      updatedAt: ts(),
    });
    schedulesAdded++;
  }
  console.log(`Jadwal: ${SCHEDULE_PLAN.length} total, ${schedulesAdded} baru.`);

  console.log(`Seed selesai untuk sekolah ${schoolId}.`);
}

/** Daftarkan user via Better Auth lalu set role/school (sama seperti db/seed.ts). */
async function authApiSignUp(name: string, email: string, schoolId: string) {
  const { auth } = await import("@/lib/auth");
  const res = await auth.api.signUpEmail({
    body: { name, email, password: PASSWORD },
  });
  const user = res.user;
  await db
    .update(schema.users)
    .set({ role: "teacher", schoolId, updatedAt: ts() })
    .where(eq(schema.users.id, user.id));
  return user;
}

main().catch((error) => {
  console.error("Seed gagal:", error);
  process.exit(1);
});
