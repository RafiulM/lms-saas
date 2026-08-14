import type { Announcement, ClassDetail, Plan, Student, Submission, Task, TeacherUser } from "@/lib/types";

export const teacherTasks: Task[] = [
  {
    id: "persamaan-kuadrat",
    title: "Persamaan Kuadrat",
    subject: "Matematika",
    className: "XII IPA 1",
    teacher: "Nabila Rahma",
    submissions: "26/32",
    due: "Hari ini, 17:00",
    status: "Perlu dinilai",
    tone: "teal",
    postedAt: "12 Agustus 2026",
    weight: 20,
    format: "PDF, maks. 10 MB",
    attachment: "Latihan Persamaan Kuadrat.pdf",
    attachmentSize: "Materi pendukung · 1.2 MB",
    instructions: "Kerjakan latihan berikut untuk menguji pemahaman siswa tentang akar-akar persamaan kuadrat. Minta siswa menulis langkah pengerjaan dengan jelas.",
    steps: ["Kerjakan soal nomor 1 sampai 5.", "Gunakan metode pemfaktoran atau rumus ABC.", "Unggah jawaban dalam format PDF."],
    action: "Belum mulai",
  },
  {
    id: "statistika-deskriptif",
    title: "Statistika Deskriptif",
    subject: "Matematika",
    className: "XI IPA 2",
    teacher: "Nabila Rahma",
    submissions: "18/30",
    due: "Besok, 12:00",
    status: "Aktif",
    tone: "purple",
    postedAt: "11 Agustus 2026",
    weight: 15,
    format: "PDF, maks. 10 MB",
    attachment: "Latihan Statistika.pdf",
    attachmentSize: "Materi pendukung · 980 KB",
    instructions: "Kerjakan latihan statistika deskriptif: mean, median, modus, dan interpretasi data.",
    steps: ["Kerjakan soal nomor 1 sampai 4.", "Tuliskan langkah perhitungan.", "Unggah jawaban dalam format PDF."],
    action: "Lanjutkan",
  },
  {
    id: "refleksi-proyek-akhir",
    title: "Refleksi Proyek Akhir",
    subject: "Wali kelas",
    className: "XII IPA 3",
    teacher: "Nabila Rahma",
    submissions: "21/28",
    due: "Besok, 15:30",
    status: "Aktif",
    tone: "coral",
    postedAt: "11 Agustus 2026",
    weight: 10,
    format: "PDF, maks. 10 MB",
    attachment: "Panduan Refleksi.pdf",
    attachmentSize: "Panduan · 640 KB",
    instructions: "Tuliskan refleksi perjalanan proyek akhir kelas dan pelajaran yang didapat.",
    steps: ["Rangkum proses pengerjaan proyek.", "Tulis pelajaran dan kendala.", "Unggah refleksi dalam format PDF."],
    action: "Mulai tugas",
  },
  {
    id: "latihan-limit-fungsi",
    title: "Latihan Limit Fungsi",
    subject: "Matematika",
    className: "XII IPA 1",
    teacher: "Nabila Rahma",
    submissions: "32/32",
    due: "Selesai",
    status: "Selesai",
    tone: "blue",
    postedAt: "8 Agustus 2026",
    weight: 15,
    format: "PDF, maks. 10 MB",
    attachment: "Latihan Limit.pdf",
    attachmentSize: "Materi pendukung · 1.1 MB",
    instructions: "Latihan limit fungsi aljabar dan tak hingga.",
    steps: ["Kerjakan soal nomor 1 sampai 6.", "Sertakan grafik pendekatan.", "Unggah jawaban dalam format PDF."],
    action: "Lihat nilai",
  },
];

export const studentTasks: Task[] = [
  { ...teacherTasks[0], status: "Belum dikerjakan", action: "Belum mulai", submissions: "" },
  {
    id: "rangkuman-gerak-parabola",
    title: "Rangkuman Gerak Parabola",
    subject: "Fisika",
    className: "XI IPA 2",
    teacher: "Pak Dedi",
    submissions: "",
    due: "Besok, 12:00",
    status: "Sedang dikerjakan",
    tone: "purple",
    postedAt: "12 Agustus 2026",
    weight: 10,
    format: "PDF, maks. 10 MB",
    attachment: "Panduan Rangkuman.pdf",
    attachmentSize: "Panduan · 520 KB",
    instructions: "Buat rangkuman materi gerak parabola beserta contoh soal dan penyelesaiannya.",
    steps: ["Ringkas konsep dasar gerak parabola.", "Sertakan minimal dua contoh soal.", "Unggah rangkuman dalam format PDF."],
    action: "Lanjutkan",
  },
  {
    ...teacherTasks[2],
    status: "Belum dikerjakan",
    action: "Mulai tugas",
    due: "Jumat, 15:30",
    submissions: "",
  },
  {
    id: "teks-eksplanasi",
    title: "Teks Eksplanasi",
    subject: "Bahasa Indonesia",
    className: "XI IPA 2",
    teacher: "Bu Sari",
    submissions: "32/32",
    due: "Selesai 10 Agustus",
    status: "Sudah dikumpulkan",
    tone: "blue",
    postedAt: "5 Agustus 2026",
    weight: 15,
    format: "PDF, maks. 10 MB",
    attachment: "Contoh Teks Eksplanasi.pdf",
    attachmentSize: "Contoh · 810 KB",
    instructions: "Susun teks eksplanasi bertema fenomena alam dengan struktur yang tepat.",
    steps: ["Tentukan fenomena yang dijelaskan.", "Sertakan sebab dan akibat.", "Unggah teks dalam format PDF."],
    action: "Lihat nilai",
  },
];

export const submissions: Submission[] = [
  { name: "Raka Pratama", initials: "RP", time: "8 menit lalu", status: "Belum dinilai" },
  { name: "Sarah Nabila", initials: "SN", time: "24 menit lalu", status: "Belum dinilai" },
  { name: "Fajar Ahmad", initials: "FA", time: "1 jam lalu", status: "Sudah dinilai" },
  { name: "Alya Putri", initials: "AP", time: "2 jam lalu", status: "Sudah dinilai" },
];

export const students: Student[] = [
  {
    id: "alya-putri",
    name: "Alya Putri",
    initials: "AP",
    className: "XII IPA 1",
    attendance: "100%",
    average: "93.0",
    tasksDone: "6/6",
    trend: "+4.2%",
    grades: [
      { subject: "Matematika", task: 94, exam: 92, average: "93", grade: "A" },
      { subject: "Fisika", task: 86, exam: 90, average: "88", grade: "B+" },
      { subject: "Bahasa Indonesia", task: 95, exam: 94, average: "94.5", grade: "A" },
    ],
    feedback: { text: "Alya konsisten mengumpulkan tugas tepat waktu dan aktif bertanya selama diskusi kelas.", author: "Bu Nabila Rahma", role: "Wali kelas", time: "2 hari lalu" },
  },
  {
    id: "raka-pratama",
    name: "Raka Pratama",
    initials: "RP",
    className: "XII IPA 1",
    attendance: "98%",
    average: "88.6",
    tasksDone: "5/6",
    trend: "+1.8%",
    grades: [
      { subject: "Matematika", task: 91, exam: 86, average: "88.5", grade: "B+" },
      { subject: "Fisika", task: 90, exam: 84, average: "87", grade: "B+" },
      { subject: "Bahasa Indonesia", task: 88, exam: 92, average: "90", grade: "A-" },
    ],
    feedback: { text: "Raka menunjukkan peningkatan di materi aljabar. Pertahankan konsistensi latihan.", author: "Bu Nabila Rahma", role: "Wali kelas", time: "3 hari lalu" },
  },
  {
    id: "sarah-nabila",
    name: "Sarah Nabila",
    initials: "SN",
    className: "XII IPA 1",
    attendance: "96%",
    average: "91.2",
    tasksDone: "6/6",
    trend: "+2.1%",
    grades: [
      { subject: "Matematika", task: 92, exam: 90, average: "91", grade: "A-" },
      { subject: "Fisika", task: 93, exam: 89, average: "91", grade: "A-" },
      { subject: "Bahasa Indonesia", task: 90, exam: 93, average: "91.5", grade: "A-" },
    ],
    feedback: { text: "Sarah rapi dalam menyusun jawaban dan sering membantu teman sekelas.", author: "Bu Nabila Rahma", role: "Wali kelas", time: "1 minggu lalu" },
  },
  {
    id: "fajar-ahmad",
    name: "Fajar Ahmad",
    initials: "FA",
    className: "XII IPA 1",
    attendance: "90%",
    average: "79.4",
    tasksDone: "4/6",
    trend: "-1.2%",
    grades: [
      { subject: "Matematika", task: 78, exam: 81, average: "79.5", grade: "B" },
      { subject: "Fisika", task: 80, exam: 76, average: "78", grade: "B" },
      { subject: "Bahasa Indonesia", task: 82, exam: 80, average: "81", grade: "B" },
    ],
    feedback: { text: "Fajar perlu mengejar tugas tertinggal. Diberikan kesempatan remedial pekan ini.", author: "Bu Nabila Rahma", role: "Wali kelas", time: "2 hari lalu" },
  },
];

export const classDetail: ClassDetail = {
  id: "xii-ipa-1",
  name: "XII IPA 1",
  level: "Kelas unggulan",
  homeroom: "Nabila Rahma",
  room: "Ruang 203",
  students: 32,
  average: "86.4",
  attendance: "94%",
  subjects: [
    { name: "Matematika", teacher: "Bu Nabila", hours: "4 jam/minggu", tone: "teal" },
    { name: "Fisika", teacher: "Pak Dedi", hours: "3 jam/minggu", tone: "purple" },
    { name: "Bahasa Indonesia", teacher: "Bu Sari", hours: "3 jam/minggu", tone: "coral" },
  ],
  roster: students,
};

export const announcements: Announcement[] = [
  {
    id: "rapat-guru-bulanan",
    tag: "Info sekolah",
    tagTone: "default",
    title: "Rapat guru bulanan",
    body: "Rapat koordinasi guru akan dilaksanakan untuk membahas persiapan penilaian tengah semester dan evaluasi kegiatan belajar mengajar bulan ini. Mohon seluruh guru hadir tepat waktu. Agenda rapat meliputi pembaruan kalender akademik, pembagian tugas pengawas, dan sesi berbagi praktik baik.",
    author: "Andi Ramadhan",
    authorInitials: "AR",
    time: "13 Agustus 2026 · 2 jam lalu",
    icon: "megaphone",
    callout: { title: "Jumat, 14 Agustus 2026", detail: "15:30 WIB · Aula utama SMA Negeri 5 Bandung" },
  },
  {
    id: "pembaruan-kalender-akademik",
    tag: "Akademik",
    tagTone: "purple",
    title: "Pembaruan kalender akademik",
    body: "Jadwal penilaian tengah semester sudah diperbarui. Silakan cek kalender kelas masing-masing untuk agenda ujian yang sudah disesuaikan.",
    author: "Admin sekolah",
    authorInitials: "AD",
    time: "Kemarin",
    icon: "calendar",
  },
  {
    id: "pelatihan-kelashub",
    tag: "KelasHub",
    tagTone: "teal",
    title: "Pelatihan fitur baru",
    body: "Pelajari cara mengumpulkan tugas dan memantau nilai melalui panduan singkat KelasHub. Sesi pelatihan untuk guru baru tersedia pada Senin depan.",
    author: "Tim KelasHub",
    authorInitials: "KH",
    time: "2 hari lalu",
    icon: "file",
  },
];

export const plans: Plan[] = [
  {
    name: "Starter",
    description: "Untuk sekolah kecil yang mulai beralih dari Excel.",
    capacity: "100",
    price: "450rb",
    action: "Mulai dengan Starter",
    featured: false,
  },
  {
    name: "Growth",
    description: "Semua yang dibutuhkan sekolah yang sedang berkembang.",
    capacity: "500",
    price: "1,25jt",
    action: "Paket saat ini",
    featured: true,
  },
  {
    name: "Scale",
    description: "Kapasitas fleksibel untuk sekolah dengan banyak kelas.",
    capacity: "Tak terbatas",
    price: "Custom",
    action: "Hubungi tim kami",
    featured: false,
  },
];

export const teacherUsers: TeacherUser[] = [
  { name: "Alya Putri", initials: "AP", role: "Murid", group: "XII IPA 1", status: "Aktif", slug: "alya-putri" },
  { name: "Bagas Pratama", initials: "BP", role: "Murid", group: "XII IPA 1", status: "Aktif", slug: "raka-pratama" },
  { name: "Citra Lestari", initials: "CL", role: "Murid", group: "XII IPA 2", status: "Aktif", slug: "sarah-nabila" },
  { name: "Dewi Kartika", initials: "DK", role: "Guru", group: "Matematika", status: "Aktif" },
  { name: "Fajar Nugroho", initials: "FN", role: "Guru", group: "Fisika", status: "Menunggu" },
];

export function getTask(id: string, role: "teacher" | "student" = "teacher"): Task {
  const pool = role === "student" ? studentTasks : teacherTasks;
  return pool.find((task) => task.id === id) ?? pool[0];
}

export function getAnyTask(id: string): Task {
  const task = studentTasks.find((item) => item.id === id) ?? teacherTasks.find((item) => item.id === id);
  return task ?? teacherTasks[0];
}

export function getClassDetail(id: string): ClassDetail {
  return classDetail.id === id ? classDetail : classDetail;
}

export function getStudent(id: string): Student {
  return students.find((student) => student.id === id) ?? students[0];
}

export function getAnnouncement(id: string): Announcement {
  return announcements.find((item) => item.id === id) ?? announcements[0];
}
