"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Avatar, Icon, PageIntro } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { getClassDetail as getMockClass } from "@/lib/data";
import { getClassDetailData, updateClass } from "@/lib/actions/classes";
import { getGradeRecap } from "@/lib/actions/grades";
import { listUsers } from "@/lib/actions/users";
import { initialsOf } from "@/lib/adapters";

type TeacherOption = { id: string; name: string };

function ClassEditModal({
  classId,
  className,
  level,
  room,
  homeroom,
  onClose,
  onSaved,
}: {
  classId: string;
  className: string;
  level: string | null;
  room: string | null;
  homeroom: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useApp();
  const [name, setName] = useState(className);
  const [newLevel, setNewLevel] = useState(level ?? "");
  const [newRoom, setNewRoom] = useState(room ?? "");
  const [teacherId, setTeacherId] = useState("");
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listUsers()
      .then((data) => {
        if (!data) return;
        const rows = data.users.filter((u) => u.role === "teacher" || u.role === "admin").map((u) => ({ id: u.id, name: u.name }));
        setTeachers(rows);
        const current = homeroom ? rows.find((t) => t.name === homeroom) : undefined;
        if (current) setTeacherId(current.id);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateClass(classId, {
        name,
        level: newLevel,
        room: newRoom,
        homeroomTeacherId: teacherId || null,
      });
      showToast("Kelas berhasil diperbarui.");
      onClose();
      onSaved();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan kelas.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="class-modal-title">
        <div className="modal-header">
          <div>
            <p className="section-kicker">Edit kelas</p>
            <h2 id="class-modal-title">Perbarui informasi kelas</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Tutup dialog" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Nama kelas</span>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: XII IPA 1" required />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Jenjang <small>(opsional)</small></span>
              <input type="text" value={newLevel} onChange={(event) => setNewLevel(event.target.value)} placeholder="Contoh: Kelas unggulan" />
            </label>
            <label className="form-field">
              <span>Ruang <small>(opsional)</small></span>
              <input type="text" value={newRoom} onChange={(event) => setNewRoom(event.target.value)} placeholder="Contoh: Ruang 203" />
            </label>
          </div>
          <label className="form-field">
            <span>Wali kelas <small>(opsional)</small></span>
            <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
              <option value="">Belum ada wali kelas</option>
              {teachers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <div className="modal-footer">
            <button className="secondary-button" type="button" onClick={onClose}>Batal</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Menyimpan…" : "Simpan perubahan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ClassDetailPage() {
  const { user: currentUser, showToast } = useApp();
  const params = useParams<{ id: string }>();
  const mock = getMockClass(params.id);
  const [live, setLive] = useState<Awaited<ReturnType<typeof getClassDetailData>>>(null);
  const [tab, setTab] = useState("Semua murid");
  const [editOpen, setEditOpen] = useState(false);

  const refetch = () => {
    getClassDetailData(params.id)
      .then((data) => data && setLive(data))
      .catch(() => undefined);
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const detail = live ?? {
    name: mock.name,
    level: mock.level,
    room: mock.room,
    homeroom: mock.homeroom,
    studentCount: mock.students,
    roster: mock.roster.map((s) => ({ id: s.id, name: s.name })),
    subjects: mock.subjects.map((s) => ({ name: s.name, teacher: s.teacher, tone: s.tone })),
    schedule: [],
  };
  const isAdmin = currentUser?.role === "admin";

  return (
    <>
      <PageIntro
        kicker="Pengguna & Kelas"
        title={detail.name}
        subtitle="Detail kelas, daftar murid, dan perkembangan belajar dalam satu tampilan."
        actions={
          <>
            <Link className="secondary-button" href="/pengguna"><Icon name="arrow" />Kembali ke pengguna</Link>
            {isAdmin ? (
              <button className="primary-button" type="button" onClick={() => setEditOpen(true)}>
                <Icon name="settings" />Edit kelas
              </button>
            ) : null}
          </>
        }
      />
      <section className="class-detail-hero">
        <div className="class-symbol">{detail.name.split(" ")[0]}</div>
        <div>
          <span className="class-level">{detail.level ?? "Kelas"}</span>
          <h2>{detail.name}</h2>
          <p>Wali kelas: {detail.homeroom ?? "—"}{detail.room ? ` · ${detail.room}` : ""}</p>
        </div>
        <div className="class-hero-stats">
          <div><strong>{detail.studentCount}</strong><span>murid</span></div>
          <div><strong>{detail.subjects.length}</strong><span>mata pelajaran</span></div>
          <div><strong>{detail.schedule.length}</strong><span>slot jadwal</span></div>
        </div>
      </section>
      <div className="class-detail-grid">
        <section className="panel roster-panel">
          <div className="table-toolbar">
            <div><p className="section-kicker">Daftar murid</p><h2>{detail.studentCount} murid terdaftar</h2></div>
            <div className="filter-tabs">
              <button type="button" className={`filter-tab${tab === "Semua murid" ? " active" : ""}`} onClick={() => setTab("Semua murid")}>Semua</button>
              <button type="button" className={`filter-tab${tab === "Perlu perhatian" ? " active" : ""}`} onClick={() => setTab("Perlu perhatian")}>Perlu perhatian</button>
            </div>
          </div>
          <div className="table-scroll">
            <table className="app-table">
              <thead><tr><th>Nama murid</th><th>Kelas</th><th></th></tr></thead>
              <tbody>
                {detail.roster.slice(0, 30).map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="table-primary">
                        <Avatar initials={initialsOf(student.name)} tone="blue" />
                        <strong>{student.name}</strong>
                      </div>
                    </td>
                    <td>{detail.name}</td>
                    <td><Link className="row-arrow" href={`/murid/${student.id}`} aria-label={`Buka ${student.name}`}><Icon name="arrow" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {detail.roster.length > 30 ? (
            <button className="text-button roster-more" type="button" onClick={() => showToast("Seluruh murid ditampilkan.")}>
              Lihat {detail.roster.length - 30} murid lainnya <Icon name="arrow" />
            </button>
          ) : null}
        </section>
        <aside className="class-side-stack">
          <section className="panel class-subjects">
            <p className="section-kicker">Mata pelajaran</p>
            <h2>Jadwal kelas</h2>
            <div className="subject-list">
              {detail.subjects.map((subject) => (
                <div key={`${subject.name}-${subject.teacher}`}>
                  <span className={`subject-dot ${subject.tone}-subject`}></span>
                  <strong>{subject.name}</strong>
                  <small>{subject.teacher}</small>
                </div>
              ))}
            </div>
            <Link className="text-button" href="/jadwal">Lihat jadwal kelas <Icon name="arrow" /></Link>
          </section>
          <section className="panel class-progress">
            <p className="section-kicker">Performa kelas</p>
            <h2>Target semester</h2>
            <div className="class-progress-row">
              <span>Jadwal mingguan</span><strong>{detail.schedule.length} slot</strong>
              <div className="thin-progress"><span style={{ width: `${Math.min(100, detail.schedule.length * 7)}%` }}></span></div>
            </div>
            <div className="class-progress-row">
              <span>Murid terdaftar</span><strong>{detail.studentCount} orang</strong>
              <div className="thin-progress blue-thin"><span style={{ width: "100%" }}></span></div>
            </div>
          </section>
        </aside>
      </div>

      {editOpen && live ? (
        <ClassEditModal
          classId={live.id}
          className={live.name}
          level={live.level ?? null}
          room={live.room ?? null}
          homeroom={live.homeroom ?? null}
          onClose={() => setEditOpen(false)}
          onSaved={refetch}
        />
      ) : null}
    </>
  );
}
