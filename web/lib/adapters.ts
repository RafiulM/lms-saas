import type { Task, Tone } from "@/lib/types";

export function initialsOf(name: string): string {
  return (name ?? "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "GU";
}

export function letterGrade(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 93) return "A";
  if (value >= 90) return "A-";
  if (value >= 87) return "B+";
  if (value >= 83) return "B";
  if (value >= 80) return "B-";
  if (value >= 77) return "C+";
  if (value >= 73) return "C";
  if (value >= 70) return "C-";
  return "D";
}

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export function formatDue(dueAt: Date | string | number): string {
  const date = dueAt instanceof Date ? dueAt : new Date(dueAt);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  if (diffDays === 0) return `Hari ini, ${time}`;
  if (diffDays === 1) return `Besok, ${time}`;
  if (diffDays === -1) return `Kemarin, ${time}`;
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDueTimeOnly(dueAt: Date | string | number): string {
  const date = dueAt instanceof Date ? dueAt : new Date(dueAt);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatTimeAgo(date: Date | string | number): string {
  const value = date instanceof Date ? date : new Date(date);
  const diff = Date.now() - value.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "kemarin";
  if (days < 7) return `${days} hari lalu`;
  return `${value.getDate()} ${MONTH_NAMES[value.getMonth()]}`;
}

export function formatDateFull(date: Date | string | number): string {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return `${DAY_NAMES[value.getDay()]}, ${value.getDate()} ${MONTH_NAMES[value.getMonth()]} ${value.getFullYear()}`;
}

export function formatDateShort(date: Date | string | number): string {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return `${value.getDate()} ${MONTH_NAMES[value.getMonth()]} ${value.getFullYear()}`;
}

const toneFromSubject: Record<string, Tone> = {};

export function pickTone(subject: string): Tone {
  if (toneFromSubject[subject]) return toneFromSubject[subject];
  const tones: Tone[] = ["teal", "purple", "coral", "blue", "orange"];
  const tone = tones[Math.floor(Math.random() * tones.length)];
  toneFromSubject[subject] = tone;
  return tone;
}

export interface TaskLike {
  id: string;
  title: string;
  className: string;
  subject: string;
  tone: string;
  teacher: string;
  dueAt: Date;
  weight: number;
  submittedCount?: number;
  totalStudents?: number;
  postedAt?: Date;
  format?: string | null;
  attachmentName?: string | null;
  attachmentSize?: string | null;
  instructions?: string | null;
  description?: string | null;
  steps?: string[];
  graded?: boolean;
}

export function adaptTask(
  dto: TaskLike,
  opts: { status?: Task["status"]; action?: string; submissions?: string } = {},
): Task {
  const total = dto.totalStudents;
  const submissions =
    opts.submissions ??
    (total && dto.submittedCount != null ? `${dto.submittedCount}/${total}` : "");
  const status: Task["status"] =
    opts.status ??
    (dto.graded ? "Sudah dikumpulkan" : total && dto.submittedCount === total ? "Selesai" : "Aktif");

  return {
    id: dto.id,
    title: dto.title,
    subject: dto.subject,
    className: dto.className,
    teacher: dto.teacher,
    submissions,
    due: formatDue(dto.dueAt),
    status,
    tone: (dto.tone as Tone) || pickTone(dto.subject),
    postedAt: dto.postedAt ? formatDateShort(dto.postedAt) : formatDateShort(dto.dueAt),
    weight: dto.weight,
    format: dto.format ?? "PDF, maks. 10 MB",
    attachment: dto.attachmentName ?? `Materi ${dto.title}.pdf`,
    attachmentSize: dto.attachmentSize ?? "Materi pendukung",
    instructions: dto.instructions ?? dto.description ?? "",
    steps: dto.steps?.length ? dto.steps : ["Kerjakan sesuai instruksi.", "Periksa kembali jawabanmu.", "Unggah jawaban sebelum tenggat."],
    action: opts.action ?? "Buka tugas",
  };
}

export function percentLabel(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}
