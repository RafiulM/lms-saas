"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Icon, MetricCard, PageIntro, StatusPill } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { students as mockStudents } from "@/lib/data";
import { bulkInputGrades, exportGradesCsv, getClassRoster, getGradeRecap, getMyGrades } from "@/lib/actions/grades";
import { listClasses } from "@/lib/actions/classes";
import { listSubjects } from "@/lib/actions/subjects";
import { initialsOf, letterGrade } from "@/lib/adapters";

function TeacherGrades() {
  const { showToast } = useApp();
  const router = useRouter();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [roster, setRoster] = useState<{ id: string; name: string }[]>([]);
  const [recapState, setRecap] = useState<Awaited<ReturnType<typeof getGradeRecap>>>(null);
  const [entering, setEntering] = useState(false);
  const [gradeType, setGradeType] = useState<"task" | "exam">("task");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("Semua nilai");
  const tabs = ["Semua nilai", "Tugas", "Ulangan"];

  useEffect(() => {
    listClasses().then((data) => {
      if (!data?.classes.length) return;
      setClasses(data.classes.map((c) => ({ id: c.id, name: c.name })));
      setClassId((current) => current || data.classes[0].id);
    });
    listSubjects().then((data) => {
      if (!data?.subjects.length) return;
      setSubjects(data.subjects.map((s) => ({ id: s.id, name: s.name })));
      setSubjectId((current) => current || data.subjects[0].id);
    });
  }, []);

  useEffect(() => {
    if (!classId) return;
    getClassRoster(classId).then((data) => {
      if (data) setRoster(data);
    });
    getGradeRecap(classId, subjectId || undefined)
      .then((data) => data && setRecap(data))
      .catch(() => undefined);
  }, [classId, subjectId]);

  const recap = recapState;
  const students = recap?.students ?? mockStudents.map((s) => ({
    studentId: s.id,
    name: s.name,
    subjects: s.grades.map((g) => ({ subject: g.subject, task: g.task, exam: g.exam })),
    average: Number(s.average),
  }));

  const valuesOf = (entry: { task: number | null; exam: number | null }) => (tab === "Tugas" ? entry.task : tab === "Ulangan" ? entry.exam : entry.task ?? entry.exam);
  const classAverage = recap?.classAverage ?? (students.length ? Number((students.reduce((sum, s) => sum + (s.average ?? 0), 0) / students.length).toFixed(1)) : 0);
  const missingCount = students.filter((s) => s.average == null).length;

  const handleSave = async () => {
    const entries = Object.entries(draft)
      .filter(([, value]) => value.trim() !== "")
      .map(([studentId, value]) => ({ studentId, value: Number(value) }));
    if (!entries.length) {
      showToast("Belum ada nilai yang diisi.");
      return;
    }
    try {
      await bulkInputGrades({ classId, subjectId, type: gradeType, entries });
      showToast(`Nilai ${gradeType === "task" ? "tugas" : "ulangan"} untuk ${entries.length} murid berhasil disimpan.`);
      setEntering(false);
      setDraft({});
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan nilai.");
    }
  };

  const handleExport = async () => {
    try {
      const csv = await exportGradesCsv(classId, subjectId);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nilai-${classes.find((c) => c.id === classId)?.name ?? "kelas"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("File nilai berhasil diunduh.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal mengunduh nilai.");
    }
  };

  return (
    <>
      <PageIntro
        kicker="Akademik"
        title="Input Nilai"
        subtitle="Catat nilai tugas dan ulangan, lalu lihat rekap kelas secara menyeluruh."
        actions={
          <>
            <button className="secondary-button" type="button" onClick={() => void handleExport()}>
              <Icon name="download" />Unduh nilai
            </button>
            <button className="primary-button" type="button" onClick={() => setEntering((value) => !value)}>
              <Icon name="plus" />{entering ? "Batal catat" : "Catat nilai"}
            </button>
          </>
        }
      />
      <div className="page-toolbar">
        <div className="toolbar-group">
          <select className="select-control select-real" value={classId} onChange={(event) => setClassId(event.target.value)}>
            {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="select-control select-real" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
            {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <span className="toolbar-hint">Semester Ganjil 2026/2027</span>
      </div>
      <section className="metric-grid compact-metrics">
        <MetricCard tone="teal" label="Rata-rata kelas" value={<>{classAverage || "—"} <span>/ 100</span></>} detail="Dari semua nilai" />
        <MetricCard tone="purple" label="Nilai tertinggi" value={<>{students.length ? Math.max(...students.map((s) => s.average ?? 0), 0) : "—"} <span>poin</span></>} detail={students[0]?.name ?? ""} />
        <MetricCard tone="coral" label="Belum lengkap" value={<>{missingCount} <span>siswa</span></>} detail="Perlu ditindaklanjuti" />
      </section>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <p className="section-kicker">Rekap nilai</p>
            <h2>Nilai siswa {classes.find((c) => c.id === classId)?.name ?? ""}</h2>
          </div>
          <div className="filter-tabs">
            {tabs.map((name) => (
              <button key={name} type="button" className={`filter-tab${tab === name ? " active" : ""}`} onClick={() => setTab(name)}>{name}</button>
            ))}
          </div>
        </div>
        {entering ? (
          <div className="grade-entry-banner">
            <div className="filter-tabs">
              <button type="button" className={`filter-tab${gradeType === "task" ? " active" : ""}`} onClick={() => setGradeType("task")}>Nilai tugas</button>
              <button type="button" className={`filter-tab${gradeType === "exam" ? " active" : ""}`} onClick={() => setGradeType("exam")}>Nilai ulangan</button>
            </div>
            <button className="primary-button small-button" type="button" onClick={() => void handleSave()}>Simpan {roster.length} murid</button>
          </div>
        ) : null}
        <div className="table-scroll">
          <table className="app-table grade-table">
            <thead><tr><th>Nama siswa</th><th>{tab === "Ulangan" ? "Ulangan" : "Tugas"}</th><th>Rata-rata</th><th>Predikat</th><th></th></tr></thead>
            <tbody>
              {(entering ? roster : students).map((student, index) => {
                const id = "studentId" in student ? student.studentId : student.id;
                const name = student.name;
                const entry = "subjects" in student ? student : students.find((s) => s.studentId === id);
                const value = entry ? valuesOf(entry.subjects[0] ?? { subject: "", task: null, exam: null }) : null;
                return (
                  <tr key={id ?? `row-${index}`}>
                    <td>
                      <div className="table-primary">
                        <Avatar initials={initialsOf(name)} tone="blue" />
                        <strong>{name}</strong>
                      </div>
                    </td>
                    {entering ? (
                      <td>
                        <input className="grade-input" type="number" min="0" max="100" placeholder="Nilai…" value={draft[id] ?? ""} onChange={(event) => setDraft((current) => ({ ...current, [id]: event.target.value }))} />
                      </td>
                    ) : (
                      <td>{value ?? "—"}</td>
                    )}
                    <td><strong>{entry?.average ?? "—"}</strong></td>
                    <td><span className="grade-badge">{entry ? letterGrade(entry.average) : "—"}</span></td>
                    <td>{entry ? <Link className="row-arrow" href={`/murid/${id}`} aria-label={`Edit nilai ${name}`}><Icon name="arrow" /></Link> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function StudentGrades({ live }: { live: Awaited<ReturnType<typeof getMyGrades>> | null }) {
  const rows = live?.subjects ?? [
    { subject: "Matematika", teacher: "Bu Nabila", task: 93, exam: null },
    { subject: "Fisika", teacher: "Pak Dedi", task: 87, exam: null },
    { subject: "Bahasa Indonesia", teacher: "Bu Sari", task: 91, exam: null },
  ];
  const average = live?.average ?? 88.6;

  return (
    <>
      <PageIntro
        kicker="Perkembangan"
        title="Nilai Saya"
        subtitle="Pantau progres belajar dan lihat umpan balik dari guru."
        actions={
          <button className="secondary-button" type="button"><Icon name="download" />Unduh rapor</button>
        }
      />
      <section className="grade-overview">
        <div className="grade-ring"><strong>{average ?? "—"}</strong><span>rata-rata</span></div>
        <div className="grade-overview-copy">
          <p className="section-kicker">Semester Ganjil 2026/2027</p>
          <h2>Performa belajarmu stabil.</h2>
          <p>{live ? `Rata-ratamu ${average} dari ${rows.length} mata pelajaran.` : "Nilaimu berada di atas rata-rata kelas. Pertahankan konsistensi pada tugas dan ulangan berikutnya."}</p>
          <div className="grade-legend">
            <span><i className="legend-teal"></i>Nilai tugas</span>
            <span><i className="legend-purple"></i>Nilai ulangan</span>
          </div>
        </div>
        <div className="grade-mini-stat"><strong>{live ? "Terbaru" : "+2.4%"}</strong><span>{live ? "diperbarui dari database" : "dibanding bulan lalu"}</span></div>
      </section>
      <section className="panel table-panel">
        <div className="panel-header">
          <div><p className="section-kicker">Rekap mata pelajaran</p><h2>Nilai terbaru</h2></div>
          <span className="soft-status"><span className="status-dot"></span>{live ? "Data dari database" : "Diperbarui hari ini"}</span>
        </div>
        <div className="table-scroll">
          <table className="app-table student-grade-table">
            <thead><tr><th>Mata pelajaran</th><th>Guru</th><th>Tugas</th><th>Ulangan</th><th>Rata-rata</th><th>Predikat</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const values = [row.task, row.exam].filter((v): v is number => v != null);
                const avg = values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : null;
                return (
                  <tr key={row.subject}>
                    <td><div className="table-primary"><span className="table-icon teal-soft"><Icon name="chart" /></span><strong>{row.subject}</strong></div></td>
                    <td>{row.teacher}</td>
                    <td>{row.task ?? "—"}</td>
                    <td>{row.exam ?? "—"}</td>
                    <td><strong className="large-grade">{avg ?? "—"}</strong></td>
                    <td><span className="grade-badge">{avg != null ? letterGrade(avg) : "—"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function GradesPage() {
  const { role } = useApp();
  const [studentLive, setStudentLive] = useState<Awaited<ReturnType<typeof getMyGrades>> | null>(null);

  useEffect(() => {
    if (role !== "teacher") {
      getMyGrades().then((data) => data && setStudentLive(data)).catch(() => undefined);
    }
  }, [role]);

  return role === "student" ? <StudentGrades live={studentLive} /> : <TeacherGrades />;
}
