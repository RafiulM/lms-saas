import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Better Auth core tables — named per the PRD (users) and mapped via
 * `drizzleAdapter(db, { provider: "sqlite", schema: { user: users, ... } })`.
 */

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    schoolId: text("school_id"),
    role: text("role").notNull().default("student"), // admin | teacher | student
    banned: integer("banned", { mode: "boolean" }).notNull().default(false),
    banReason: text("ban_reason"),
    banExpires: integer("ban_expires", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("users_school_idx").on(table.schoolId),
    index("users_role_idx").on(table.role),
  ],
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

/** Domain tables per PRD. */

export const schools = sqliteTable("schools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  email: text("email"),
  phone: text("phone"),
  logo: text("logo"),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const classes = sqliteTable(
  "classes",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    level: text("level"),
    room: text("room"),
    homeroomTeacherId: text("homeroom_teacher_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("classes_school_idx").on(table.schoolId)],
);

export const classMembers = sqliteTable(
  "class_members",
  {
    id: text("id").primaryKey(),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("class_members_unique").on(table.classId, table.studentId),
    index("class_members_student_idx").on(table.studentId),
  ],
);

export const subjects = sqliteTable(
  "subjects",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    teacherId: text("teacher_id").references(() => users.id, { onDelete: "set null" }),
    tone: text("tone").notNull().default("teal"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("subjects_school_idx").on(table.schoolId),
    uniqueIndex("subjects_name_school_unique").on(table.name, table.schoolId),
  ],
);

export const schedules = sqliteTable(
  "schedules",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id").references(() => users.id, { onDelete: "set null" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Minggu … 6 = Sabtu
    startTime: text("start_time").notNull(), // "07:30"
    endTime: text("end_time").notNull(), // "09:00"
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("schedules_class_idx").on(table.classId),
    index("schedules_teacher_idx").on(table.teacherId),
  ],
);

export const assignments = sqliteTable(
  "assignments",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    instructions: text("instructions"),
    steps: text("steps"), // JSON array string
    dueAt: integer("due_at", { mode: "timestamp_ms" }).notNull(),
    weight: real("weight").notNull().default(10),
    format: text("format"),
    maxSizeMb: real("max_size_mb").notNull().default(10),
    attachmentUrl: text("attachment_url"),
    attachmentName: text("attachment_name"),
    attachmentSize: text("attachment_size"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("assignments_class_idx").on(table.classId),
    index("assignments_teacher_idx").on(table.teacherId),
  ],
);

export const submissions = sqliteTable(
  "submissions",
  {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fileUrl: text("file_url"),
    fileName: text("file_name"),
    fileSize: text("file_size"),
    content: text("content"),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull(),
    grade: real("grade"),
    feedback: text("feedback"),
    gradedAt: integer("graded_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("submissions_assignment_student_unique").on(
      table.assignmentId,
      table.studentId,
    ),
    index("submissions_student_idx").on(table.studentId),
  ],
);

export const grades = sqliteTable(
  "grades",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignmentId: text("assignment_id").references(() => assignments.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull().default("task"), // task | exam
    value: real("value").notNull(),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("grades_class_idx").on(table.classId),
    index("grades_student_idx").on(table.studentId),
  ],
);

export const announcements = sqliteTable(
  "announcements",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tag: text("tag").notNull().default("Info sekolah"),
    tagTone: text("tag_tone").notNull().default("default"), // default | purple | teal
    icon: text("icon").notNull().default("megaphone"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    calloutTitle: text("callout_title"),
    calloutDetail: text("callout_detail"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("announcements_school_idx").on(table.schoolId)],
);

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  schoolId: text("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" })
    .unique(),
  plan: text("plan").notNull().default("starter"), // starter | growth | scale
  status: text("status").notNull().default("active"), // active | past_due | cancelled
  price: real("price"),
  currency: text("currency").notNull().default("IDR"),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }),
  mayarCheckoutUrl: text("mayar_checkout_url"),
  mayarTransactionId: text("mayar_transaction_id"),
  mayarPaymentLinkId: text("mayar_payment_link_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

/** Riwayat pembayaran langganan via Mayar.id. */
export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    plan: text("plan").notNull(), // starter | growth | scale
    amount: real("amount").notNull(),
    currency: text("currency").notNull().default("IDR"),
    status: text("status").notNull().default("pending"), // pending | paid | failed
    paymentMethod: text("payment_method"),
    mayarTransactionId: text("mayar_transaction_id"),
    mayarPaymentLinkId: text("mayar_payment_link_id"),
    mayarWebhookId: text("mayar_webhook_id"),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("payments_school_idx").on(table.schoolId),
    index("payments_transaction_idx").on(table.mayarTransactionId),
  ],
);

/** Stats kept up-to-date for subscription billing (jumlah murid & guru aktif). */
export const schoolStats = sqliteTable("school_stats", {
  schoolId: text("school_id")
    .primaryKey()
    .references(() => schools.id, { onDelete: "cascade" }),
  studentCount: integer("student_count").notNull().default(0),
  teacherCount: integer("teacher_count").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const now = sql`(unixepoch() * 1000)`;
