export type Role = "teacher" | "student";

export type Tone = "teal" | "purple" | "coral" | "blue" | "orange";

export type TaskStatus =
  | "Perlu dinilai"
  | "Aktif"
  | "Selesai"
  | "Belum dikerjakan"
  | "Sedang dikerjakan"
  | "Sudah dikumpulkan";

export interface Task {
  id: string;
  title: string;
  subject: string;
  className: string;
  teacher: string;
  submissions: string;
  due: string;
  status: TaskStatus;
  tone: Tone;
  postedAt: string;
  weight: number;
  format: string;
  attachment: string;
  attachmentSize: string;
  instructions: string;
  steps: string[];
  action: string;
}

export interface Submission {
  name: string;
  initials: string;
  time: string;
  status: "Belum dinilai" | "Sudah dinilai";
}

export interface ClassDetail {
  id: string;
  name: string;
  level: string;
  homeroom: string;
  room: string;
  students: number;
  average: string;
  attendance: string;
  subjects: { name: string; teacher: string; hours: string; tone: Tone }[];
  roster: Student[];
}

export interface Student {
  id: string;
  name: string;
  initials: string;
  className: string;
  attendance: string;
  average: string;
  tasksDone: string;
  trend: string;
  grades: { subject: string; task: number; exam: number; average: string; grade: string }[];
  feedback: { text: string; author: string; role: string; time: string };
}

export interface Announcement {
  id: string;
  tag: string;
  tagTone: "default" | "purple" | "teal";
  title: string;
  body: string;
  author: string;
  authorInitials: string;
  time: string;
  icon: "megaphone" | "calendar" | "file";
  callout?: { title: string; detail: string };
  unread?: boolean;
}

export interface Plan {
  name: string;
  description: string;
  capacity: string;
  price: string;
  action: string;
  featured: boolean;
}

export interface TeacherUser {
  name: string;
  initials: string;
  role: "Murid" | "Guru";
  group: string;
  status: "Aktif" | "Menunggu";
  slug?: string;
}
