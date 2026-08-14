/**
 * Demo seed — data meniru mock frontend (lib/data.ts) agar tampilan
 * konsisten. Jalankan: npm run db:seed
 */
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { and, eq, not } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const ts = (date = new Date()) => date;
const daysFromNow = (days: number, hour = 17, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const PASSWORD = "password123";

async function createUser(name: string, email: string, role: "admin" | "teacher" | "student", schoolId: string) {
  const res = await auth.api.signUpEmail({
    body: { name, email, password: PASSWORD },
  });
  const user = res.user;
  await db
    .update(schema.users)
    .set({ role, schoolId, updatedAt: ts() })
    .where(eq(schema.users.id, user.id));
  return user;
}

async function main() {
  console.log("Seed dimulai…");

  // Hapus data lama (kecuali tabel auth Better Auth)
  for (const table of [
    schema.schoolStats,
    schema.payments,
    schema.subscriptions,
    schema.announcements,
    schema.grades,
    schema.submissions,
    schema.assignments,
    schema.schedules,
    schema.subjects,
    schema.classMembers,
    schema.classes,
    schema.schools,
  ]) {
    await db.delete(table);
  }
  await db.delete(schema.users).where(not(eq(schema.users.id, "__none__")));

  // ── Sekolah ──
  const schoolId = "smkn5-bandung";
  const school = { id: schoolId, name: "SMA Negeri 5 Bandung", address: "Jl. Belitung No. 8, Bandung, Jawa Barat", email: "info@smkn5bdg.sch.id", phone: "022-4201132", createdAt: ts(), updatedAt: ts() };
  await db.insert(schema.schools).values(school);

  // ── Admin ──
  const admin = await createUser("Andi Ramadhan", "admin@smkn5bdg.sch.id", "admin", schoolId);

  // ── Guru ──
  const nabila = await createUser("Nabila Rahma", "nabila@smkn5bdg.sch.id", "teacher", schoolId);
  const dedi = await createUser("Dedi Firmansyah", "dedi@smkn5bdg.sch.id", "teacher", schoolId);
  const sari = await createUser("Sari Wulandari", "sari@smkn5bdg.sch.id", "teacher", schoolId);

  // ── Kelas ──
  const [xii1, xi2, xii3] = [randomUUID(), randomUUID(), randomUUID()];
  await db.insert(schema.classes).values([
    { id: xii1, schoolId, name: "XII IPA 1", level: "Kelas unggulan", room: "Ruang 203", homeroomTeacherId: nabila.id, createdAt: ts(), updatedAt: ts() },
    { id: xi2, schoolId, name: "XI IPA 2", level: "Kelas reguler", room: "Ruang 105", homeroomTeacherId: dedi.id, createdAt: ts(), updatedAt: ts() },
    { id: xii3, schoolId, name: "XII IPA 3", level: "Kelas reguler", room: "Ruang 207", homeroomTeacherId: sari.id, createdAt: ts(), updatedAt: ts() },
  ]);

  // ── Murid bernama (XII IPA 1) ──
  const alya = await createUser("Alya Putri", "alya@smkn5bdg.sch.id", "student", schoolId);
  const raka = await createUser("Raka Pratama", "raka@smkn5bdg.sch.id", "student", schoolId);
  const sarah = await createUser("Sarah Nabila", "sarah@smkn5bdg.sch.id", "student", schoolId);
  const fajar = await createUser("Fajar Ahmad", "fajar@smkn5bdg.sch.id", "student", schoolId);
  const namedStudents = [alya, raka, sarah, fajar];

  // ── Murid tambahan (sampai 32 di XII IPA 1, 30 di XI IPA 2, 28 di XII IPA 3) ──
  const firstNames = ["Bagas", "Citra", "Dewi", "Eko", "Fitri", "Galih", "Hana", "Ilham", "Joko", "Kirana", "Lutfi", "Maya", "Nanda", "Oscar", "Putri", "Qori", "Rizky", "Sinta", "Tono", "Umi", "Vina", "Wahyu", "Xavier", "Yuni", "Zaki", "Ahmad", "Bunga", "Candra", "Dina", "Erwin", "Fina", "Gita"];
  const lastNameBase = ["Pratama", "Putri", "Saputra", "Lestari", "Nugroho", "Wijaya", "Hartono", "Kusuma", "Santoso", "Utami"];
  let idx = 0;

  const studentsOf = async (count: number, base: typeof namedStudents): Promise<string[]> => {
    const ids = [...base.map((u) => u.id)];
    while (ids.length < count) {
      const name = `${firstNames[idx % firstNames.length]} ${lastNameBase[Math.floor(idx / firstNames.length) % lastNameBase.length]}`;
      const user = await createUser(name, `siswa${idx + 1}@smkn5bdg.sch.id`, "student", schoolId);
      ids.push(user.id);
      idx++;
    }
    return ids;
  };

  const xii1Ids = await studentsOf(32, namedStudents);
  const xi2Ids = await studentsOf(30, []);
  const xii3Ids = await studentsOf(28, []);

  const members = [
    ...xii1Ids.map((studentId) => ({ id: randomUUID(), classId: xii1, studentId, createdAt: ts() })),
    ...xi2Ids.map((studentId) => ({ id: randomUUID(), classId: xi2, studentId, createdAt: ts() })),
    ...xii3Ids.map((studentId) => ({ id: randomUUID(), classId: xii3, studentId, createdAt: ts() })),
  ];
  await db.insert(schema.classMembers).values(members);

  // ── Mata pelajaran ──
  const [matematika, fisika, bindo, binggris, walikelas] = [randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  await db.insert(schema.subjects).values([
    { id: matematika, schoolId, name: "Matematika", teacherId: nabila.id, tone: "teal", createdAt: ts(), updatedAt: ts() },
    { id: fisika, schoolId, name: "Fisika", teacherId: dedi.id, tone: "purple", createdAt: ts(), updatedAt: ts() },
    { id: bindo, schoolId, name: "Bahasa Indonesia", teacherId: sari.id, tone: "coral", createdAt: ts(), updatedAt: ts() },
    { id: binggris, schoolId, name: "Bahasa Inggris", teacherId: dedi.id, tone: "blue", createdAt: ts(), updatedAt: ts() },
    { id: walikelas, schoolId, name: "Wali Kelas", teacherId: nabila.id, tone: "orange", createdAt: ts(), updatedAt: ts() },
  ]);

  // ── Jadwal mingguan ──
  const slots: { classId: string; subjectId: string; teacherId: string; dayOfWeek: number; startTime: string; endTime: string }[] = [
    { classId: xii1, subjectId: matematika, teacherId: nabila.id, dayOfWeek: 1, startTime: "07:30", endTime: "09:00" },
    { classId: xii1, subjectId: matematika, teacherId: nabila.id, dayOfWeek: 3, startTime: "08:00", endTime: "09:30" },
    { classId: xii1, subjectId: walikelas, teacherId: nabila.id, dayOfWeek: 4, startTime: "13:00", endTime: "14:00" },
    { classId: xi2, subjectId: matematika, teacherId: nabila.id, dayOfWeek: 1, startTime: "10:00", endTime: "11:30" },
    { classId: xi2, subjectId: matematika, teacherId: nabila.id, dayOfWeek: 2, startTime: "10:00", endTime: "11:30" },
    { classId: xi2, subjectId: fisika, teacherId: dedi.id, dayOfWeek: 2, startTime: "07:30", endTime: "09:00" },
    { classId: xi2, subjectId: bindo, teacherId: sari.id, dayOfWeek: 3, startTime: "07:30", endTime: "09:00" },
    { classId: xii3, subjectId: matematika, teacherId: nabila.id, dayOfWeek: 1, startTime: "13:00", endTime: "14:30" },
    { classId: xii3, subjectId: matematika, teacherId: nabila.id, dayOfWeek: 3, startTime: "13:00", endTime: "14:30" },
    { classId: xii3, subjectId: fisika, teacherId: dedi.id, dayOfWeek: 4, startTime: "07:30", endTime: "09:00" },
    { classId: xii3, subjectId: bindo, teacherId: sari.id, dayOfWeek: 1, startTime: "07:30", endTime: "09:00" },
    { classId: xii1, subjectId: fisika, teacherId: dedi.id, dayOfWeek: 2, startTime: "07:30", endTime: "09:00" },
    { classId: xii1, subjectId: bindo, teacherId: sari.id, dayOfWeek: 5, startTime: "07:30", endTime: "09:00" },
    { classId: xi2, subjectId: binggris, teacherId: dedi.id, dayOfWeek: 4, startTime: "07:30", endTime: "09:00" },
  ];
  await db.insert(schema.schedules).values(
    slots.map((s) => ({ id: randomUUID(), schoolId, createdAt: ts(), updatedAt: ts(), ...s })),
  );

  // ── Tugas ──
  const due = {
    persamaan: daysFromNow(0, 17, 0),
    statistika: daysFromNow(1, 12, 0),
    refleksi: daysFromNow(1, 15, 30),
    limit: daysFromNow(-5, 12, 0),
    parabola: daysFromNow(1, 12, 0),
    eksplanasi: daysFromNow(-3, 12, 0),
  };

  const assignmentRows = [
    { title: "Persamaan Kuadrat", subjectId: matematika, classId: xii1, dueAt: due.persamaan, weight: 20, steps: ["Kerjakan soal nomor 1 sampai 5.", "Gunakan metode pemfaktoran atau rumus ABC.", "Unggah jawaban dalam format PDF."], desc: "Kerjakan latihan berikut untuk menguji pemahaman siswa tentang akar-akar persamaan kuadrat. Minta siswa menulis langkah pengerjaan dengan jelas." },
    { title: "Statistika Deskriptif", subjectId: matematika, classId: xi2, dueAt: due.statistika, weight: 15, steps: ["Kerjakan soal nomor 1 sampai 4.", "Tuliskan langkah perhitungan.", "Unggah jawaban dalam format PDF."], desc: "Kerjakan latihan statistika deskriptif: mean, median, modus, dan interpretasi data." },
    { title: "Refleksi Proyek Akhir", subjectId: walikelas, classId: xii3, dueAt: due.refleksi, weight: 10, steps: ["Rangkum proses pengerjaan proyek.", "Tulis pelajaran dan kendala.", "Unggah refleksi dalam format PDF."], desc: "Tuliskan refleksi perjalanan proyek akhir kelas dan pelajaran yang didapat." },
    { title: "Latihan Limit Fungsi", subjectId: matematika, classId: xii1, dueAt: due.limit, weight: 15, steps: ["Kerjakan soal nomor 1 sampai 6.", "Sertakan grafik pendekatan.", "Unggah jawaban dalam format PDF."], desc: "Latihan limit fungsi aljabar dan tak hingga." },
    { title: "Rangkuman Gerak Parabola", subjectId: fisika, classId: xi2, dueAt: due.parabola, weight: 10, steps: ["Ringkas konsep dasar gerak parabola.", "Sertakan minimal dua contoh soal.", "Unggah rangkuman dalam format PDF."], desc: "Buat rangkuman materi gerak parabola beserta contoh soal dan penyelesaiannya." },
    { title: "Teks Eksplanasi", subjectId: bindo, classId: xi2, dueAt: due.eksplanasi, weight: 15, steps: ["Tentukan fenomena yang dijelaskan.", "Sertakan sebab dan akibat.", "Unggah teks dalam format PDF."], desc: "Susun teks eksplanasi bertema fenomena alam dengan struktur yang tepat." },
  ];

  const assignments: { id: string; teacherId: string }[] = [];
  for (const row of assignmentRows) {
    const id = randomUUID();
    const teacherId = row.subjectId === matematika ? nabila.id : row.subjectId === fisika ? dedi.id : row.subjectId === bindo ? sari.id : nabila.id;
    await db.insert(schema.assignments).values({
      id,
      schoolId,
      classId: row.classId,
      subjectId: row.subjectId,
      teacherId,
      title: row.title,
      description: row.desc,
      instructions: row.desc,
      steps: JSON.stringify(row.steps),
      dueAt: row.dueAt,
      weight: row.weight,
      format: "PDF, maks. 10 MB",
      attachmentName: `Materi ${row.title}.pdf`,
      attachmentSize: "1.1 MB",
      createdAt: ts(),
      updatedAt: ts(),
    });
    assignments.push({ id, teacherId });
  }
  const [persamaan, statistika, refleksi, limit, parabola, eksplanasi] = assignments;

  // ── Pengumpulan tugas ──
  await db.insert(schema.submissions).values([
    { id: randomUUID(), assignmentId: persamaan.id, studentId: alya.id, fileName: "jawaban-alya.pdf", fileSize: "820 KB", fileUrl: "/uploads/jawaban-alya.pdf", submittedAt: daysFromNow(0, 8, 30), grade: 92, feedback: "Langkah pengerjaan sangat jelas, hasil akhir tepat.", gradedAt: ts() },
    { id: randomUUID(), assignmentId: persamaan.id, studentId: sarah.id, fileName: "jawaban-sarah.pdf", fileSize: "760 KB", fileUrl: "/uploads/jawaban-sarah.pdf", submittedAt: daysFromNow(0, 9, 12) },
    { id: randomUUID(), assignmentId: persamaan.id, studentId: raka.id, fileName: "jawaban-raka.pdf", fileSize: "915 KB", fileUrl: "/uploads/jawaban-raka.pdf", submittedAt: daysFromNow(0, 10, 5) },
    { id: randomUUID(), assignmentId: persamaan.id, studentId: fajar.id, fileName: "jawaban-fajar.pdf", fileSize: "690 KB", fileUrl: "/uploads/jawaban-fajar.pdf", submittedAt: daysFromNow(0, 11, 40), grade: 80, feedback: "Jawaban benar, perhatikan langkah penyelesaian.", gradedAt: ts() },
    { id: randomUUID(), assignmentId: eksplanasi.id, studentId: alya.id, fileName: "eksplanasi-alya.pdf", fileSize: "540 KB", fileUrl: "/uploads/eksplanasi-alya.pdf", submittedAt: daysFromNow(-4, 13, 20), grade: 95, feedback: "Struktur teks lengkap dan bahasa baku.", gradedAt: ts() },
    { id: randomUUID(), assignmentId: limit.id, studentId: alya.id, fileName: "limit-alya.pdf", fileSize: "810 KB", fileUrl: "/uploads/limit-alya.pdf", submittedAt: daysFromNow(-6, 14, 0), grade: 94, feedback: "Semua soal terselesaikan dengan tepat.", gradedAt: ts() },
  ]);

  // ── Nilai ──
  const gradeRows: [typeof alya, string, number, number, number][] = [
    [alya, matematika, 94, 92, 1],
    [alya, fisika, 86, 90, 1],
    [alya, bindo, 95, 94, 1],
    [raka, matematika, 91, 86, 1],
    [raka, fisika, 90, 84, 1],
    [raka, bindo, 88, 92, 1],
    [sarah, matematika, 92, 90, 1],
    [sarah, fisika, 93, 89, 1],
    [sarah, bindo, 90, 93, 1],
    [fajar, matematika, 78, 81, 1],
    [fajar, fisika, 80, 76, 1],
    [fajar, bindo, 82, 80, 1],
  ];
  await db.insert(schema.grades).values(
    gradeRows.flatMap(([student, subjectId, task, exam, days]) => [
      { id: randomUUID(), schoolId, classId: xii1, subjectId, studentId: student.id, teacherId: nabila.id, type: "task", value: task, createdAt: ts(new Date(Date.now() - days * 86400000)), updatedAt: ts() },
      { id: randomUUID(), schoolId, classId: xii1, subjectId, studentId: student.id, teacherId: nabila.id, type: "exam", value: exam, createdAt: ts(new Date(Date.now() - days * 86400000)), updatedAt: ts() },
    ]),
  );

  // ── Pengumuman ──
  await db.insert(schema.announcements).values([
    { id: randomUUID(), schoolId, authorId: admin.id, tag: "Info sekolah", tagTone: "default", icon: "megaphone", title: "Rapat guru bulanan", body: "Rapat koordinasi guru akan dilaksanakan untuk membahas persiapan penilaian tengah semester dan evaluasi kegiatan belajar mengajar bulan ini. Mohon seluruh guru hadir tepat waktu. Agenda rapat meliputi pembaruan kalender akademik, pembagian tugas pengawas, dan sesi berbagi praktik baik.", calloutTitle: "Jumat, 14 Agustus 2026", calloutDetail: "15:30 WIB · Aula utama SMA Negeri 5 Bandung", createdAt: ts(new Date(Date.now() - 2 * 3600000)), updatedAt: ts() },
    { id: randomUUID(), schoolId, authorId: admin.id, tag: "Akademik", tagTone: "purple", icon: "calendar", title: "Pembaruan kalender akademik", body: "Jadwal penilaian tengah semester sudah diperbarui. Silakan cek kalender kelas masing-masing untuk agenda ujian yang sudah disesuaikan.", createdAt: ts(new Date(Date.now() - 86400000)), updatedAt: ts() },
    { id: randomUUID(), schoolId, authorId: admin.id, tag: "KelasHub", tagTone: "teal", icon: "file", title: "Pelatihan fitur baru", body: "Pelajari cara mengumpulkan tugas dan memantau nilai melalui panduan singkat KelasHub. Sesi pelatihan untuk guru baru tersedia pada Senin depan.", createdAt: ts(new Date(Date.now() - 2 * 86400000)), updatedAt: ts() },
  ]);

  // ── Langganan ──
  const subscriptionId = randomUUID();
  const subscriptionStart = daysFromNow(-62);
  await db.insert(schema.subscriptions).values({
    id: subscriptionId,
    schoolId,
    plan: "growth",
    status: "active",
    price: 1250000,
    startsAt: subscriptionStart,
    endsAt: daysFromNow(300),
    mayarTransactionId: "demo-growth-active",
    mayarCheckoutUrl: "https://web.mayar.club/kelashub/pl/growth",
    createdAt: subscriptionStart,
    updatedAt: ts(),
  });

  // ── Riwayat pembayaran (3 lunas + 1 menunggu) ──
  const paymentRows = [
    {
      plan: "growth",
      amount: 1250000,
      status: "paid" as const,
      paymentMethod: "QRIS",
      mayarTransactionId: "demo-txn-jun",
      paidAt: daysFromNow(-62),
      createdAt: daysFromNow(-63),
    },
    {
      plan: "growth",
      amount: 1250000,
      status: "paid" as const,
      paymentMethod: "Virtual Account",
      mayarTransactionId: "demo-txn-jul",
      paidAt: daysFromNow(-32),
      createdAt: daysFromNow(-33),
    },
    {
      plan: "growth",
      amount: 1250000,
      status: "paid" as const,
      paymentMethod: "E-Wallet",
      mayarTransactionId: "demo-txn-aug",
      paidAt: daysFromNow(-2),
      createdAt: daysFromNow(-3),
    },
    {
      plan: "growth",
      amount: 1250000,
      status: "pending" as const,
      paymentMethod: null,
      mayarTransactionId: "demo-txn-sep",
      createdAt: ts(),
    },
  ];
  await db.insert(schema.payments).values(
    paymentRows.map((row) => ({ id: randomUUID(), schoolId, subscriptionId, ...row })),
  );

  // ── Statistik sekolah ──
  await db.insert(schema.schoolStats).values({
    schoolId,
    studentCount: xii1Ids.length + xi2Ids.length + xii3Ids.length,
    teacherCount: 3,
    updatedAt: ts(),
  });

  console.log("Seed selesai.");
  console.log("Akun demo (password: password123):");
  console.log("  Admin : admin@smkn5bdg.sch.id");
  console.log("  Guru  : nabila@smkn5bdg.sch.id");
  console.log("  Murid : alya@smkn5bdg.sch.id");
}

main().catch((error) => {
  console.error("Seed gagal:", error);
  process.exit(1);
});
