"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, Icon, MetricCard, PageIntro, StatusPill } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { teacherTasks } from "@/lib/data";
import { getActivityReport, getDashboard, getRecentActivity } from "@/lib/actions/dashboard";
import { formatDueTimeOnly, formatTimeAgo, initialsOf } from "@/lib/adapters";
import type { Task, TaskStatus, Tone } from "@/lib/types";

type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
type ActivityData = Awaited<ReturnType<typeof getRecentActivity>>;

function ActivityModal({ activity, onClose }: { activity: ActivityData; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="activity-modal-title">
        <div className="modal-header">
          <div>
            <p className="section-kicker">Aktivitas sekolah</p>
            <h2 id="activity-modal-title">Riwayat aktivitas</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Tutup dialog" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="activity-list">
          {activity.submissions.length ? activity.submissions.map((item) => (
            <article key={item.id} className="activity-item">
              <div className="activity-avatar">{initialsOf(item.studentName)}</div>
              <div>
                <strong>{item.studentName} mengumpulkan <span>{item.assignmentTitle}</span></strong>
                <small>{item.subject}{item.className ? ` · ${item.className}` : ""} · {formatTimeAgo(item.submittedAt)}</small>
              </div>
              <span className={`status-pill ${item.graded ? "done-pill" : "upcoming-pill"}`}>{item.graded ? "Dinilai" : "Belum dinilai"}</span>
            </article>
          )) : (
            <p className="modal-hint">Belum ada pengumpulan tugas.</p>
          )}
          {activity.announcements.length ? (
            <div className="activity-divider"></div>
          ) : null}
          {activity.announcements.map((item) => (
            <article key={item.id} className="activity-item">
              <div className="activity-avatar activity-avatar-megaphone"><Icon name="megaphone" /></div>
              <div>
                <strong>Pengumuman: <span>{item.title}</span></strong>
                <small>{formatTimeAgo(item.createdAt)}</small>
              </div>
              <Link className="row-arrow" href={`/pengumuman/${item.id}`} aria-label="Buka pengumuman"><Icon name="arrow" /></Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const text = String(value).replace(/"/g, '""');
    return /[",\n]/.test(text) ? `"${text}"` : text;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const TODAY = new Date();
const todayLabel = TODAY.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
const todayShort = TODAY.toLocaleDateString("id-ID", { weekday: "short" }).toUpperCase();
const todayMonthShort = TODAY.toLocaleDateString("id-ID", { month: "short" }).toUpperCase();
const todayFull = TODAY.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function submissionWidth(submissions: string): number {
  const [submitted, total] = submissions.split("/").map(Number);
  if (!total) return 0;
  return Math.round((submitted / total) * 100);
}

function taskPill(status: TaskStatus): "current" | "upcoming" | "done" {
  if (status === "Perlu dinilai" || status === "Belum dikerjakan") return "current";
  if (status === "Selesai" || status === "Sudah dikumpulkan") return "done";
  return "upcoming";
}

const urgentToneIcon: Record<Tone, "file" | "chart" | "school"> = {
  teal: "file",
  purple: "chart",
  coral: "school",
  blue: "file",
  orange: "file",
};

function TeacherHome({ live }: { live: DashboardData }) {
  const { openTaskModal, showToast } = useApp();
  const [downloading, setDownloading] = useState(false);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const assignments = live?.assignments ?? [];
  const schedule = live?.schedule ?? [];
  const announcements = live?.announcements ?? [];
  const stats = live?.stats ?? { studentCount: 284, teacherCount: 24, classAverage: 86.4 };

  const handleOpenActivity = () => {
    setActivityLoading(true);
    getRecentActivity()
      .then((data) => {
        if (data) setActivity(data);
      })
      .catch(() => undefined)
      .finally(() => setActivityLoading(false));
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const report = await getActivityReport();
      if (!report) throw new Error("Laporan belum tersedia.");
      const dateLabel = new Date().toISOString().slice(0, 10);
      downloadCsv(`laporan-aktivitas-${dateLabel}.csv`, report.assignments);
      downloadCsv(`pengumuman-${dateLabel}.csv`, report.announcements);
      showToast(`Laporan diunduh: ${report.assignments.length} tugas, ${report.stats.submissionCount} pengumpulan.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal mengunduh laporan.");
    } finally {
      setDownloading(false);
    }
  };

  const urgent: Task[] = assignments.map((a, index) => ({
    id: a.id,
    title: a.title,
    subject: a.subject,
    className: a.className,
    teacher: a.teacher,
    submissions: a.totalStudents ? `${a.submittedCount}/${a.totalStudents}` : "",
    due: formatDueTimeOnly(a.dueAt),
    status: (a.submittedCount < (a.totalStudents || 1) ? "Perlu dinilai" : "Aktif") as TaskStatus,
    tone: (a.tone as Tone) ?? "teal",
    postedAt: "",
    weight: 10,
    format: "PDF, maks. 10 MB",
    attachment: "",
    attachmentSize: "",
    instructions: "",
    steps: [],
    action: "Buka",
  })).slice(0, 3);

  const totalSubmitted = assignments.reduce((sum, a) => sum + (a.submittedCount ?? 0), 0);
  
  const greetingName = (live?.user?.name ?? "Nabila").split(" ")[0];
  const greetingInitial = initialsOf(live?.user?.name ?? "Nabila");

  const scheduleRows = schedule.map((s) => ({
    time: s.startTime,
    end: s.endTime,
    subject: s.subject,
    className: s.className,
    teacher: s.teacher || s.className,
    tone: s.tone,
  }));

  return (
    <>
      <PageIntro
        kicker={todayLabel}
        title={<>Selamat pagi, <span>{greetingName}.</span></>}
        subtitle="Semua yang perlu kamu tahu untuk mengajar hari ini."
        actions={
          <>
            <button className="secondary-button" type="button" disabled={downloading} onClick={() => void handleDownloadReport()}>
              <Icon name="download" />{downloading ? "Menyiapkan…" : "Unduh laporan"}
            </button>
            <button className="primary-button" type="button" onClick={openTaskModal}>
              <Icon name="plus" />Buat tugas
            </button>
          </>
        }
      />

      <section className="focus-card" aria-labelledby="focus-title">
        <div className="focus-content">
          <p className="focus-kicker"><span></span>Fokus hari ini</p>
          <h2 id="focus-title">{schedule.length ? `${schedule.length} sesi mengajar\nmenunggumu hari ini.` : "Tiga kelas menunggumu\nhari ini."}</h2>
          <p className="focus-description">Mulai dari jadwal pertama, cek tugas yang masuk, lalu beri umpan balik terbaikmu.</p>
          <div className="focus-actions">
            <Link className="light-button" href="/jadwal">Lihat agenda <Icon name="arrow" /></Link>
            <span className="focus-note"><span className="pulse-dot"></span>{schedule.some((s) => s.startTime) ? "Jadwal hari ini siap" : "1 kelas sedang berlangsung"}</span>
          </div>
        </div>
        <div className="focus-visual" aria-hidden="true">
          <div className="visual-orbit orbit-one"></div>
          <div className="visual-orbit orbit-two"></div>
          <div className="visual-calendar">
            <div className="calendar-topline"><span></span><span></span><span></span></div>
            <div className="calendar-date">{TODAY.getDate()} <small>{todayMonthShort}</small></div>
            <div className="calendar-grid">
              <i></i><i></i><i></i><i className="marked"></i><i></i><i></i><i></i><i></i><i className="soft-marked"></i><i></i><i></i><i></i><i className="marked"></i><i></i><i></i><i></i><i className="soft-marked"></i><i></i><i></i><i></i><i></i>
            </div>
          </div>
          <div className="floating-stat stat-students"><span className="floating-icon">+</span><strong>{stats.studentCount}</strong><small>siswa aktif</small></div>
          <div className="floating-stat stat-classes"><span className="floating-icon check-icon">&#10003;</span><strong>{stats.classAverage ?? 86.4}</strong><small>rata-rata kelas</small></div>
        </div>
      </section>

      <section className="metric-grid" aria-label="Ringkasan aktivitas">
        <MetricCard tone="teal" label="Tugas aktif" value={<>{assignments.length || 8} <span>tugas</span></>} detail={urgent.length ? `${urgent.length} menunggu penilaian` : "Semua sudah dinilai"} trend={live ? `${assignments.length} minggu ini` : "+2 minggu ini"} />
        <MetricCard tone="purple" label="Rata-rata kelas" value={<>{stats.classAverage ?? "—"} <span>/ 100</span></>} detail="Dari seluruh mata pelajaran" trend={live ? "Terbaru" : "+4.8% bulan ini"} />
        <MetricCard tone="coral" label="Siswa aktif" value={<>{stats.studentCount} <span>siswa</span></>} detail={stats.teacherCount ? `${stats.teacherCount} guru aktif` : "Dari 6 kelas yang kamu ajar"} trend={live ? "Terhitung otomatis" : "Stabil minggu ini"} trendTone="neutral" />
        <MetricCard tone="blue" label="Pengumpulan baru" value={<>{totalSubmitted || 26} <span>jawaban</span></>} detail="Semua tugas berjalan" trend={live ? `${assignments.length} tugas aktif` : "+12 hari ini"} />
      </section>

      <div className="content-grid">
        <section className="panel schedule-panel" aria-labelledby="schedule-title">
          <div className="panel-header">
            <div><p className="section-kicker">Jadwal hari ini</p><h2>Agenda {todayLabel}</h2></div>
            <Link className="text-button" href="/jadwal">Lihat semua <Icon name="arrow" /></Link>
          </div>
          <div className="schedule-summary">
            <div className="date-tile"><span>{todayShort}</span><strong>{TODAY.getDate()}</strong></div>
            <div className="summary-copy"><strong>{schedule.length ? `${schedule.length} sesi belajar` : "4 sesi belajar"}</strong><span>{schedule.length ? `${schedule[0]?.startTime ?? "07:30"} - ${schedule[schedule.length - 1]?.endTime ?? "15:30"} WIB` : "08:00 - 15:30 WIB"}</span></div>
            <div className="live-status"><span className="live-status-dot"></span>{schedule.length ? "Jadwal tersedia" : "1 kelas berlangsung"}</div>
          </div>
          <div className="schedule-list">
            {(scheduleRows.length ? scheduleRows : [
              { time: "08:00", end: "09:30", subject: "Matematika", className: "XII IPA 1", teacher: "Ruang 203", tone: "teal" },
              { time: "10:00", end: "11:30", subject: "Matematika", className: "XI IPA 2", teacher: "Ruang 201", tone: "teal" },
              { time: "13:00", end: "14:30", subject: "Statistika", className: "XII IPA 3", teacher: "Ruang 204", tone: "coral" },
              { time: "14:45", end: "15:30", subject: "Wali Kelas", className: "XII IPA 1", teacher: "Ruang 203", tone: "orange" },
            ]).map((row, index) => (
              <article key={`${row.time}-${index}`} className={`schedule-row${index === 0 ? " current" : ""}${index === (scheduleRows.length ? scheduleRows.length - 1 : 3) ? " last-row" : ""}`}>
                <div className="schedule-time"><strong>{row.time}</strong><span>{row.end}</span></div>
                <div className="schedule-line"><span className="schedule-marker"></span></div>
                <div className="schedule-detail">
                  <div className="schedule-title-row">
                    <strong>{row.subject}</strong>
                    {index === 0 && live ? <span className="status-pill current-pill">Berlangsung</span> : null}
                  </div>
                  <h3>{row.className}</h3>
                  <p><Icon name="school" />{row.teacher} <span className="detail-separator"></span>{row.tone ? "Kelas aktif" : "32 siswa"}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel announcement-panel" aria-labelledby="announcement-title">
          <div className="panel-header">
            <div><p className="section-kicker">Dari sekolah</p><h2>Pengumuman terbaru</h2></div>
            <Link className="round-arrow" href="/pengumuman" aria-label="Lihat semua pengumuman"><Icon name="arrow" /></Link>
          </div>
          {(announcements.length ? announcements : [
            { id: "rapat-guru-bulanan", tag: "Info sekolah", title: "Rapat guru bulanan", body: "Rapat koordinasi akan dilaksanakan Jumat, 14 Agustus pukul 15:30 di aula utama.", author: "Andi Ramadhan", createdAt: TODAY },
            { id: "pembaruan-kalender-akademik", tag: "Akademik", title: "Pembaruan kalender akademik", body: "", author: "Admin sekolah", createdAt: new Date(TODAY.getTime() - 86400000) },
            { id: "pelatihan-kelashub", tag: "KelasHub", title: "Pelatihan platform KelasHub", body: "", author: "Tim KelasHub", createdAt: new Date(TODAY.getTime() - 2 * 86400000) },
          ] as { id: string; tag: string; title: string; body: string; author: string; createdAt: Date }[]).map((item, index) => (
            index === 0 ? (
              <Link key={item.id} href={`/pengumuman/${item.id}`} className="announcement-featured">
                <div className="announcement-art">
                  <span className="art-sun"></span><span className="art-cloud cloud-one"></span><span className="art-cloud cloud-two"></span><span className="art-hill hill-back"></span><span className="art-hill hill-front"></span><span className="art-building"><i></i><i></i><i></i><i></i></span>
                </div>
                <div className="announcement-content">
                  <span className="announcement-tag">{item.tag}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body.slice(0, 110)}{item.body.length > 110 ? "…" : ""}</p>
                  <div className="announcement-meta"><Avatar initials={initialsOf(item.author)} tone="rust" /><span>{item.author}</span><span className="meta-separator"></span><span>{formatTimeAgo(item.createdAt)}</span></div>
                </div>
              </Link>
            ) : (
              <Link key={item.id} href={`/pengumuman/${item.id}`} className="announcement-row"><span className="announcement-index">{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><span>{item.author} <i></i>{formatTimeAgo(item.createdAt)}</span></div><Icon name="arrow" /></Link>
            )
          ))}
        </section>
      </div>

      <div className="bottom-grid">
        <section className="panel urgent-panel" aria-labelledby="urgent-title">
          <div className="panel-header">
            <div><p className="section-kicker">Perlu perhatian</p><h2>Tugas yang mendesak</h2></div>
            <Link className="text-button" href="/tugas">Kelola tugas <Icon name="arrow" /></Link>
          </div>
          <div className="urgent-list">
            {(urgent.length ? urgent : teacherTasks.slice(0, 3)).map((task) => (
              <article key={task.id} className="urgent-row">
                <div className={`assignment-icon assignment-${task.tone}`}><Icon name={urgentToneIcon[task.tone]} /></div>
                <div className="assignment-copy"><strong>{task.title}</strong><span>{task.className} <i></i>{task.subject}</span></div>
                <div className="submission-progress">
                  <div className="progress-label"><strong>{task.submissions || "0/0"}</strong><span>terkumpul</span></div>
                  <div className="thin-progress"><span style={{ width: `${submissionWidth(task.submissions)}%` }}></span></div>
                </div>
                <div className={`due-date ${task.status === "Perlu dinilai" ? "due-today" : "due-tomorrow"}`}>
                  <span>{"Besok"}</span>
                  <strong>{task.due}</strong>
                </div>
                <Link className="row-arrow" href={`/tugas/${task.id}`} aria-label={`Buka ${task.title}`}><Icon name="arrow" /></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="panel activity-panel" aria-labelledby="activity-title">
          <div className="panel-header">
            <div><p className="section-kicker">Jejak terbaru</p><h2>Aktivitas terkini</h2></div>
            <button className="round-arrow" type="button" aria-label="Lihat aktivitas lengkap" disabled={activityLoading} onClick={handleOpenActivity}><Icon name="arrow" /></button>
          </div>
          <div className="activity-list">
            {assignments.slice(0, 4).map((a) => (
              <article key={a.id} className="activity-row"><Avatar initials={initialsOf(a.teacher)} tone="blue" /><div><p>Tugas <strong>{a.title}</strong> aktif untuk {a.className}</p><span>{a.subject} <i className="activity-dot teal-dot"></i> {a.submittedCount} terkumpul</span></div></article>
            ))}
            {!assignments.length ? (
              <article className="activity-row"><span className="activity-system"><Icon name="grid" /></span><div><p><strong>Admin sekolah</strong> mengelola ruang kerja</p><span>baru saja <i className="activity-dot blue-dot"></i> Sistem</span></div></article>
            ) : null}
          </div>
        </section>
      </div>

      <footer className="main-footer">
        <span><span className="footer-pulse"></span>Semua sistem berjalan normal</span>
        <span>Data terakhir diperbarui {live ? "saat ini" : "2 menit lalu"}</span>
      </footer>

      {activity ? <ActivityModal activity={activity} onClose={() => setActivity(null)} /> : null}
    </>
  );
}

function StudentHome({ live }: { live: DashboardData }) {
  const schedule = live?.schedule ?? [];
  const assignments = live?.assignments ?? [];
  const announcements = live?.announcements ?? [];
  const student = live?.student;
  const greetingName = (live?.user?.name ?? "Raka").split(" ")[0];
  const donePercent = student && student.totalAssignments ? Math.round((student.submittedCount / student.totalAssignments) * 100) : 82;
  const featured = assignments.slice(0, 3).map((a) => ({
    id: a.id,
    title: a.title,
    subject: a.subject,
    className: a.className,
    tone: (a.tone as Tone) ?? "teal",
    due: formatDueTimeOnly(a.dueAt),
    status: student?.submittedIds?.includes(a.id) ? "Sedang dikerjakan" : "Belum dikerjakan",
  }));

  const studentScheduleRows = schedule.map((s) => ({
    time: s.startTime,
    end: s.endTime,
    subject: s.subject,
    className: s.className,
    teacher: s.teacher || s.className,
  }));

  return (
    <>
      <PageIntro
        kicker={todayFull}
        title={<>Selamat pagi, <span>{greetingName}.</span></>}
        subtitle="Siap belajar? Ini yang perlu kamu selesaikan hari ini."
        actions={
          <Link className="secondary-button" href="/jadwal"><Icon name="calendar" />Lihat jadwal</Link>
        }
      />

      <section className="student-hero">
        <div>
          <p className="focus-kicker"><span></span>Perjalanan belajarmu</p>
          <h2>Tetap satu langkah<br />di depan.</h2>
          <p>{student && student.totalAssignments ? `Kamu sudah mengumpulkan ${student.submittedCount} dari ${student.totalAssignments} tugas aktif.` : "Kamu sudah menyelesaikan 82% tugas minggu ini. Sedikit lagi menuju targetmu."}</p>
          <div className="student-hero-progress">
            <div><span>Minggu ke-3</span><strong>{donePercent}%</strong></div>
            <div className="student-progress-track"><span style={{ width: `${donePercent}%` }}></span></div>
          </div>
        </div>
        <div className="student-hero-art" aria-hidden="true">
          <div className="student-medal">{donePercent}<small>%</small></div>
          <span className="art-star star-one">+</span><span className="art-star star-two">+</span>
          <div className="student-book"><Icon name="file" /></div>
        </div>
      </section>

      <section className="metric-grid student-metrics">
        <MetricCard tone="teal" label="Tugas belum selesai" value={<>{student ? Math.max(0, student.totalAssignments - student.submittedCount) : 5} <span>tugas</span></>} detail={`${assignments.length} aktif minggu ini`} trend="Perlu dikerjakan" />
        <MetricCard tone="purple" label="Rata-rata nilaimu" value={<>{student?.average ?? 88.6} <span>/ 100</span></>} detail="Dari tugas dan ulangan" trend={live ? "Terbaru" : "+2.4% bulan ini"} />
        <MetricCard tone="coral" label="Jadwal belajar" value={<>{schedule.length || 4} <span>pelajaran</span></>} detail={schedule.length ? `${schedule[0]?.startTime ?? "07:30"} - ${schedule[schedule.length - 1]?.endTime ?? "15:30"} WIB` : "08:00 - 15:30 WIB"} trend="Hari ini" trendTone="neutral" />
      </section>

      <div className="student-content-grid">
        <section className="panel student-schedule">
          <div className="panel-header">
            <div><p className="section-kicker">Jadwal hari ini</p><h2>Agenda belajarmu</h2></div>
            <Link className="text-button" href="/jadwal">Lihat semua <Icon name="arrow" /></Link>
          </div>
          <div className="student-agenda">
            {(studentScheduleRows.length ? studentScheduleRows : [
              { time: "08:00", end: "09:30", subject: "Matematika", status: "Sedang berlangsung", className: "XI IPA 2", teacher: "Bu Nabila" },
              { time: "10:00", end: "11:30", subject: "Fisika", className: "XI IPA 2", teacher: "Pak Dedi" },
              { time: "13:00", end: "14:30", subject: "Bahasa Indonesia", className: "XI IPA 2", teacher: "Bu Sari" },
            ]).map((row) => (
              <article key={`${row.time}-${row.subject}`} className="student-agenda-row">
                <div className="student-time"><strong>{row.time}</strong><span>{row.end}</span></div>
                <div>
                  <div className="schedule-title-row">
                    <strong>{row.subject}</strong>
                    {row.status ? <span className="status-pill current-pill">{row.status}</span> : null}
                  </div>
                  <h3>{row.className}</h3>
                  <p><Icon name="school" />{row.teacher ? `Kelas ${row.className}` : "Kelas aktif"} <span className="detail-separator"></span>{row.teacher}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel student-task-panel">
          <div className="panel-header">
            <div><p className="section-kicker">Perlu dikerjakan</p><h2>Tugas terdekat</h2></div>
            <Link className="round-arrow" href="/tugas" aria-label="Lihat tugas"><Icon name="arrow" /></Link>
          </div>
          <div className="student-task-list">
            {(featured.length ? featured : [
              { id: "persamaan-kuadrat", title: "Persamaan Kuadrat", subject: "Matematika", tone: "teal" as Tone, due: "17:00", status: "Belum dikerjakan" },
              { id: "rangkuman-gerak-parabola", title: "Rangkuman Gerak Parabola", subject: "Fisika", tone: "purple" as Tone, due: "12:00", status: "Sedang dikerjakan" },
              { id: "refleksi-proyek-akhir", title: "Refleksi Proyek Akhir", subject: "Wali kelas", tone: "coral" as Tone, due: "15:30", status: "Belum dikerjakan" },
            ]).map((task) => (
              <Link key={task.id} href={`/tugas/${task.id}`} className="student-task-item">
                <span className={`assignment-icon assignment-${task.tone}`}><Icon name={urgentToneIcon[task.tone]} /></span>
                <div><strong>{task.title}</strong><span>{task.subject} <i></i>{task.due}</span></div>
                <span className={task.status === "Belum dikerjakan" ? "task-priority" : "task-priority tomorrow-priority"}>{task.status === "Sedang dikerjakan" ? "Lanjutkan" : "Penting"}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {announcements[0] ? (
        <section className="panel student-announcement-strip">
          <div className="announcement-strip-icon"><Icon name="megaphone" /></div>
          <div>
            <p className="section-kicker">Pengumuman sekolah</p>
            <strong>{announcements[0].title}</strong>
            <span>{formatTimeAgo(announcements[0].createdAt)} oleh {announcements[0].author}</span>
          </div>
          <Link className="text-button" href={`/pengumuman/${announcements[0].id}`}>Baca <Icon name="arrow" /></Link>
        </section>
      ) : (
        <section className="panel student-announcement-strip">
          <div className="announcement-strip-icon"><Icon name="megaphone" /></div>
          <div>
            <p className="section-kicker">Pengumuman sekolah</p>
            <strong>Rapat orang tua murid akan dilaksanakan Sabtu, 16 Agustus.</strong>
            <span>2 jam lalu oleh Admin sekolah</span>
          </div>
          <Link className="text-button" href="/pengumuman/rapat-guru-bulanan">Baca <Icon name="arrow" /></Link>
        </section>
      )}
    </>
  );
}

export function HomePage() {
  const { role } = useApp();
  const [live, setLive] = useState<DashboardData>(null);

  useEffect(() => {
    getDashboard().then((data) => {
      if (data) setLive(data);
    });
  }, []);

  return role === "student" ? <StudentHome live={live} /> : <TeacherHome live={live} />;
}
