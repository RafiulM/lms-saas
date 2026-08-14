"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Icon, PageIntro, PageLoading } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { deleteSchedule, getScheduleGrid, getScheduleOptions, upsertSchedule } from "@/lib/actions/schedules";
import type { Tone } from "@/lib/types";

interface WeekBlock {
  id: string;
  subject: string;
  small: string;
  time: string;
  tone: Tone;
  classId: string;
  subjectId: string;
  teacherId: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface WeekRow {
  time: string;
  cells: (WeekBlock | null)[];
}

type ScheduleOptions = Awaited<ReturnType<typeof getScheduleOptions>>;

function buildRows(schedules: { id: string; dayOfWeek: number; startTime: string; endTime: string; subject: string; className: string; tone: string; teacher: string; classId: string; subjectId: string; teacherId: string | null }[], isStudent: boolean): WeekRow[] {
  const times = [...new Set(schedules.map((s) => s.startTime))].sort();
  return times.map((time) => {
    const cells: (WeekBlock | null)[] = [null, null, null, null, null, null, null];
    for (const s of schedules) {
      if (s.startTime !== time) continue;
      cells[s.dayOfWeek] = {
        id: s.id,
        subject: s.subject,
        small: isStudent ? s.teacher : s.className,
        time: `${s.startTime} - ${s.endTime}`,
        tone: (s.tone as Tone) ?? "teal",
        classId: s.classId,
        subjectId: s.subjectId,
        teacherId: s.teacherId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      };
    }
    return { time: `${time.slice(0, 2)}:00`, cells };
  });
}

function ScheduleModal({
  schedule,
  defaultDay,
  onClose,
  onSaved,
}: {
  schedule: WeekBlock | null;
  defaultDay: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useApp();
  const [options, setOptions] = useState<ScheduleOptions | null>(null);
  const [classId, setClassId] = useState(schedule?.classId ?? "");
  const [subjectId, setSubjectId] = useState(schedule?.subjectId ?? "");
  const [teacherId, setTeacherId] = useState(schedule?.teacherId ?? "");
  const [day, setDay] = useState(schedule?.dayOfWeek ?? defaultDay);
  const [startTime, setStartTime] = useState(schedule?.startTime ?? "07:30");
  const [endTime, setEndTime] = useState(schedule?.endTime ?? "09:00");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (options) return;
    getScheduleOptions().then(setOptions).catch(() => undefined);
  }, [options]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await upsertSchedule(
        { classId, subjectId, teacherId: teacherId || undefined, dayOfWeek: day, startTime, endTime },
        schedule?.id,
      );
      showToast(schedule ? "Jadwal berhasil diperbarui." : "Jadwal berhasil ditambahkan.");
      onClose();
      onSaved();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan jadwal.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;
    setDeleting(true);
    try {
      await deleteSchedule(schedule.id);
      showToast("Jadwal dihapus.");
      onClose();
      onSaved();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menghapus jadwal.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
        <div className="modal-header">
          <div>
            <p className="section-kicker">{schedule ? "Ubah jadwal" : "Jadwal baru"}</p>
            <h2 id="schedule-modal-title">{schedule ? "Edit jadwal pelajaran" : "Tambah jadwal pelajaran"}</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Tutup dialog" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-field">
              <span>Kelas</span>
              <select value={classId} onChange={(event) => setClassId(event.target.value)} required>
                <option value="">Pilih kelas</option>
                {options?.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Mata pelajaran</span>
              <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} required>
                <option value="">Pilih mapel</option>
                {options?.subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>Guru pengajar <small>(opsional)</small></span>
              <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
                <option value="">Belum ditentukan</option>
                {options?.teachers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Hari</span>
              <select value={day} onChange={(event) => setDay(Number(event.target.value))}>
                {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((name, index) => (
                  <option key={name} value={index}>{name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>Jam mulai</span>
              <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
            </label>
            <label className="form-field">
              <span>Jam selesai</span>
              <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
            </label>
          </div>
          <div className="modal-footer">
            {schedule ? (
              <button className="danger-button" type="button" disabled={deleting} onClick={() => void handleDelete()}>
                {deleting ? "Menghapus…" : "Hapus jadwal"}
              </button>
            ) : null}
            <span className="modal-footer-spacer"></span>
            <button className="secondary-button" type="button" onClick={onClose}>Batal</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Menyimpan…" : schedule ? "Simpan perubahan" : "Tambah jadwal"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WeeklyGrid({
  rows,
  isStudent,
  onAdd,
  onEdit,
}: {
  rows: WeekRow[];
  isStudent?: boolean;
  onAdd?: (day: number, time: string) => void;
  onEdit?: (block: WeekBlock) => void;
}) {
  const todayIndex = new Date().getDay();
  const headerDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const gridDays = [1, 2, 3, 4, 5];
  return (
    <div className="weekly-grid">
      <div className="weekly-head">
        <span>Jam</span>
        {headerDays.map((day, index) => {
          const date = new Date();
          const offset = gridDays[index] - date.getDay();
          date.setDate(date.getDate() + offset);
          return (
            <strong key={day} className={gridDays[index] === todayIndex ? "today-col" : ""}>
              {day} <small>{date.getDate()}</small>
            </strong>
          );
        })}
      </div>
      {rows.map((row) => (
        <div key={row.time} className="weekly-row">
          <span className="time-slot">{row.time}</span>
          {gridDays.map((day, index) => {
            const cell = row.cells[day] ?? null;
            return cell ? (
              <div key={day} className={`week-cell${day === todayIndex ? " today-col" : ""}`}>
                <button
                  type="button"
                  className={`class-block ${cell.tone}-block`}
                  onClick={() => onEdit?.(cell)}
                  title="Klik untuk mengubah jadwal"
                >
                  <strong>{cell.subject}</strong>
                  <small>{cell.small}</small>
                  <em>{cell.time}</em>
                </button>
              </div>
            ) : (
              <div key={day} className="week-cell">
                <button
                  type="button"
                  className="empty-slot"
                  disabled={!onAdd}
                  onClick={() => onAdd?.(gridDays[index], row.time)}
                >
                  {isStudent ? "" : "+ Tambah"}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function TeacherSchedule({ live, onRefetch }: { live: Awaited<ReturnType<typeof getScheduleGrid>>; onRefetch: () => void }) {
  const [modal, setModal] = useState<{ schedule: WeekBlock | null; day: number } | null>(null);
  const rows = live ? buildRows(live.schedules, false) : [];

  return (
    <>
      <PageIntro
        kicker="Akademik"
        title="Jadwal Pelajaran"
        subtitle="Susun jadwal mingguan dan bagikan agenda ke setiap kelas."
        actions={
          <button className="primary-button" type="button" onClick={() => setModal({ schedule: null, day: 1 })}>
            <Icon name="plus" />Buat jadwal
          </button>
        }
      />
      <div className="page-toolbar">
        <div className="toolbar-group">
          <button className="select-control" type="button">Semua kelas <Icon name="chevron" /></button>
          <button className="select-control" type="button">Semua guru <Icon name="chevron" /></button>
        </div>
        <div className="toolbar-group">
          <button className="outline-icon-button" type="button" aria-label="Minggu sebelumnya"><Icon name="arrow" /></button>
          <strong className="toolbar-date">{`${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`}</strong>
          <button className="outline-icon-button" type="button" aria-label="Minggu berikutnya"><Icon name="arrow" /></button>
        </div>
      </div>
      <section className="panel schedule-board">
        <div className="panel-header">
          <div><p className="section-kicker">Kalender mingguan</p><h2>Jadwal mengajar</h2></div>
          <span className="soft-status"><span className="status-dot"></span>Data dari database</span>
        </div>
        <WeeklyGrid
          rows={rows}
          onAdd={(day, time) => setModal({ schedule: null, day })}
          onEdit={(schedule) => setModal({ schedule, day: schedule.dayOfWeek })}
        />
        {!rows.length ? (
          <p className="empty-state">Belum ada jadwal untuk minggu ini. Gunakan tombol &quot;Buat jadwal&quot; untuk menambahkan sesi mengajar.</p>
        ) : null}
      </section>
      {modal ? (
        <ScheduleModal
          schedule={modal.schedule}
          defaultDay={modal.day}
          onClose={() => setModal(null)}
          onSaved={onRefetch}
        />
      ) : null}
    </>
  );
}

function StudentSchedule({ live }: { live: Awaited<ReturnType<typeof getScheduleGrid>> }) {
  const rows = live ? buildRows(live.schedules, true) : [];
  const myClass = live?.myClassName || "Kelas";

  return (
    <>
      <PageIntro
        kicker="Akademik"
        title="Jadwal Pelajaran"
        subtitle="Lihat semua agenda kelas dan persiapkan pelajaranmu."
        actions={
          <button className="secondary-button" type="button"><Icon name="calendar" />Hari ini</button>
        }
      />
      <div className="page-toolbar">
        <div className="toolbar-group">
          <button className="select-control" type="button">{myClass} <Icon name="chevron" /></button>
          <button className="outline-icon-button" type="button" aria-label="Minggu sebelumnya"><Icon name="arrow" /></button>
          <strong className="toolbar-date">{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong>
          <button className="outline-icon-button" type="button" aria-label="Minggu berikutnya"><Icon name="arrow" /></button>
        </div>
        <span className="soft-status"><span className="status-dot"></span>{live ? "Jadwal terbaru" : "Jadwal terbaru"}</span>
      </div>
      <section className="panel schedule-board student-schedule-board">
        <div className="panel-header">
          <div><p className="section-kicker">Kelas {myClass}</p><h2>Jadwal mingguan</h2></div>
          <span className="room-note">Jadwal kelas dari database</span>
        </div>
        <WeeklyGrid rows={rows} isStudent />
        {!rows.length ? (
          <p className="empty-state">Belum ada jadwal untuk kelasmu minggu ini.</p>
        ) : null}
      </section>
    </>
  );
}

export function SchedulePage() {
  const { role } = useApp();
  const [live, setLive] = useState<Awaited<ReturnType<typeof getScheduleGrid>>>(null);
  const [loading, setLoading] = useState(true);

  const refetch = () => {
    getScheduleGrid()
      .then((data) => {
        if (data) setLive(data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refetch();
  }, []);

  if (loading) return <PageLoading />;
  return role === "student" ? (
    <StudentSchedule live={live} />
  ) : (
    <TeacherSchedule live={live} onRefetch={refetch} />
  );
}
