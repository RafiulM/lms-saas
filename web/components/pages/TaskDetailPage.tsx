"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, Icon, PageIntro, StatusPill } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { getTask, submissions as mockSubmissions } from "@/lib/data";
import {
  getAssignment,
  getMySubmission,
  gradeSubmission,
  listSubmissions,
  submitAssignment,
  updateAssignment,
} from "@/lib/actions/assignments";
import { createAnnouncement } from "@/lib/actions/announcements";
import { formatDue, formatTimeAgo, initialsOf } from "@/lib/adapters";
import type { Task } from "@/lib/types";

type AssignmentData = NonNullable<Awaited<ReturnType<typeof getAssignment>>>;

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function AnnouncementComposerModal({
  taskTitle,
  onClose,
}: {
  taskTitle: string;
  onClose: () => void;
}) {
  const { showToast } = useApp();
  const [title, setTitle] = useState(`Pengumuman tugas: ${taskTitle}`);
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("Info sekolah");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createAnnouncement({ title, body, tag });
      showToast("Pengumuman berhasil diterbitkan.");
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menerbitkan pengumuman.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-announcement-modal-title">
        <div className="modal-header">
          <div>
            <p className="section-kicker">Pengumuman baru</p>
            <h2 id="task-announcement-modal-title">Beri pengumuman ke sekolah</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Tutup dialog" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Judul</span>
            <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="form-field">
            <span>Isi pengumuman</span>
            <textarea rows={5} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tulis pengumuman untuk guru dan murid..." required></textarea>
          </label>
          <label className="form-field">
            <span>Kategori</span>
            <select value={tag} onChange={(event) => setTag(event.target.value)}>
              <option>Info sekolah</option>
              <option>Akademik</option>
              <option>KelasHub</option>
            </select>
          </label>
          <div className="modal-footer">
            <button className="secondary-button" type="button" onClick={onClose}>Batal</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Menerbitkan…" : "Terbitkan pengumuman"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskEditModal({
  assignment,
  onClose,
  onSaved,
}: {
  assignment: AssignmentData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useApp();
  const [title, setTitle] = useState(assignment.title);
  const [due, setDue] = useState(toLocalInputValue(new Date(assignment.dueAt)));
  const [weight, setWeight] = useState(String(assignment.weight ?? 10));
  const [instructions, setInstructions] = useState(assignment.instructions ?? assignment.description ?? "");
  const [steps, setSteps] = useState(assignment.steps.join("\n"));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateAssignment(assignment.id, {
        title,
        dueAt: due,
        weight: Number(weight) || 10,
        instructions,
        steps: steps.split("\n").map((step) => step.trim()).filter(Boolean),
      });
      showToast("Tugas berhasil diperbarui.");
      onClose();
      onSaved();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan tugas.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-edit-modal-title">
        <div className="modal-header">
          <div>
            <p className="section-kicker">Edit tugas</p>
            <h2 id="task-edit-modal-title">Perbarui tugas</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Tutup dialog" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Judul tugas</span>
            <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Tenggat waktu</span>
              <input type="datetime-local" value={due} onChange={(event) => setDue(event.target.value)} required />
            </label>
            <label className="form-field">
              <span>Bobot nilai</span>
              <input type="number" min="1" max="100" value={weight} onChange={(event) => setWeight(event.target.value)} />
            </label>
          </div>
          <label className="form-field">
            <span>Instruksi <small>(opsional)</small></span>
            <textarea rows={3} value={instructions} onChange={(event) => setInstructions(event.target.value)}></textarea>
          </label>
          <label className="form-field">
            <span>Langkah pengerjaan <small>(opsional, satu per baris)</small></span>
            <textarea rows={3} value={steps} onChange={(event) => setSteps(event.target.value)}></textarea>
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

type SubmissionRow = {
  id: string;
  studentName: string;
  fileName: string | null;
  fileUrl: string | null;
  fileSize: string | null;
  submittedAt: Date;
  grade: number | null;
  feedback: string | null;
};

const TODAY = new Date();

export function TaskDetailPage() {
  const { role, showToast } = useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const taskId = params.id;
  const isStudent = role === "student";

  const mockTask = getTask(taskId, role);
  const [task, setTask] = useState<Task | null>(null);
  const [raw, setRaw] = useState<AssignmentData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionRow[] | null>(null);
  const [mySubmission, setMySubmission] = useState<{ grade: number | null; feedback: string | null; fileName: string | null; fileUrl: string | null; submittedAt: Date | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    getAssignment(taskId).then((data) => {
      if (!data) return;
      setRaw(data);
      setTask({
        id: data.id,
        title: data.title,
        subject: data.subject,
        className: data.className,
        teacher: data.teacher,
        submissions: "",
        due: formatDue(data.dueAt),
        status: "Aktif",
        tone: data.tone as Task["tone"],
        postedAt: formatTimeAgo(data.createdAt),
        weight: data.weight,
        format: data.format ?? "PDF, maks. 10 MB",
        attachment: data.attachmentName ?? `Materi ${data.title}.pdf`,
        attachmentSize: data.attachmentSize ?? "Materi pendukung",
        instructions: data.instructions ?? data.description ?? "",
        steps: data.steps.length ? data.steps : ["Kerjakan sesuai instruksi.", "Periksa kembali jawabanmu.", "Unggah jawaban sebelum tenggat."],
        action: "Buka",
      });
    });
    if (isStudent) {
      getMySubmission(taskId).then((data) => {
        if (!data) return;
        setMySubmission({ grade: data.grade, feedback: data.feedback, fileName: data.fileName, fileUrl: data.fileUrl, submittedAt: data.submittedAt });
      });
    } else {
      listSubmissions(taskId)
        .then((rows) => {
          setSubmissions(
            rows.map((row) => ({
              id: row.id,
              studentName: row.studentName,
              fileName: row.fileName,
              fileUrl: row.fileUrl,
              fileSize: row.fileSize,
              submittedAt: row.submittedAt,
              grade: row.grade,
              feedback: row.feedback,
            })),
          );
        })
        .catch(() => undefined);
    }
  }, [taskId, isStudent]);

  useEffect(() => {
    load();
  }, [load]);

  const current = task ?? mockTask;

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Upload gagal.");
      }
      const { url, name, size } = await res.json();
      await submitAssignment({ assignmentId: taskId, fileUrl: url, fileName: name, fileSize: size });
      showToast("Jawaban berhasil dikumpulkan.");
      load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Upload gagal. Coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const handleGrade = async (submissionId: string) => {
    try {
      await gradeSubmission(submissionId, Number(gradeValue), feedback);
      showToast("Nilai berhasil disimpan.");
      setGradingId(null);
      setGradeValue("");
      setFeedback("");
      load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan nilai.");
    }
  };

  const liveSubmissions = submissions ?? (isStudent ? [] : mockSubmissions.map((m, index) => ({
    id: m.name,
    studentName: m.name,
    fileName: "jawaban.pdf",
    fileUrl: null,
    fileSize: "820 KB",
    submittedAt: new Date(TODAY.getTime() - (index + 1) * 60 * 60000),
    grade: m.status === "Sudah dinilai" ? 92 : null,
    feedback: null,
  })));

  if (isStudent) {
    const submitted = Boolean(mySubmission);
    return (
      <>
        <PageIntro
          kicker="Tugas Saya"
          title={current.title}
          subtitle={`${current.subject} · ${current.className}`}
          actions={
            <>
              <Link className="secondary-button" href="/tugas"><Icon name="arrow" />Kembali ke tugas</Link>
              <button className="primary-button" type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Icon name="file" />{uploading ? "Mengunggah…" : submitted ? "Ganti jawaban" : "Kumpulkan jawaban"}
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden-input" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleUpload(file); event.target.value = ""; }} />
            </>
          }
        />
        <div className="detail-layout">
          <article className="panel detail-main">
            <div className="detail-heading">
              <div className={`assignment-icon assignment-${current.tone}`}><Icon name="file" /></div>
              <div>
                <StatusPill tone={submitted ? "done" : "current"}>{submitted ? (mySubmission?.grade != null ? "Sudah dinilai" : "Sedang dikerjakan") : "Belum dikerjakan"}</StatusPill>
                <h2>{current.title}</h2>
                <p>Diposting oleh {current.teacher} · {current.postedAt}</p>
              </div>
            </div>
            <div className="detail-divider"></div>
            <div className="detail-copy">
              <p className="section-kicker">Instruksi tugas</p>
              <p>{current.instructions}</p>
              <ol>{current.steps.map((step) => <li key={step}>{step}</li>)}</ol>
            </div>
          </article>
          <aside className="detail-side">
            <section className="panel deadline-card">
              <p className="section-kicker">Tenggat waktu</p>
              <strong>{current.due}</strong>
              <span className="countdown-label">{submitted ? `Dikumpulkan ${mySubmission?.submittedAt ? formatTimeAgo(mySubmission.submittedAt) : "sebelumnya"}` : "Belum dikumpulkan"}</span>
              <div className="countdown-bar"><span style={{ width: submitted ? "100%" : "72%" }}></span></div>
              <div className="detail-meta-list">
                <div><span>Kelas</span><strong>{current.className}</strong></div>
                <div><span>Bobot nilai</span><strong>{current.weight} poin</strong></div>
                <div><span>Format</span><strong>{current.format}</strong></div>
              </div>
            </section>
            <section className="panel upload-card">
              <div className="upload-icon"><Icon name="download" /></div>
              <h2>{submitted ? "Jawaban sudah dikumpulkan" : "Siap mengumpulkan?"}</h2>
              <p>{mySubmission?.feedback ? `Umpan balik guru: "${mySubmission.feedback}"` : "Pastikan nama dan kelas tercantum di dokumen jawabanmu."}</p>
              {mySubmission?.fileUrl && mySubmission.fileName ? (
                <a className="primary-button file-download-link" href={mySubmission.fileUrl} download={mySubmission.fileName}>
                  <Icon name="download" />Unduh file {mySubmission.fileName.length > 24 ? `${mySubmission.fileName.slice(0, 21)}…` : mySubmission.fileName}
                </a>
              ) : null}
              <button className="primary-button" type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Icon name="file" />{uploading ? "Mengunggah…" : submitted ? "Ganti jawaban" : "Upload jawaban"}
              </button>
            </section>
          </aside>
        </div>
      </>
    );
  }

  return (
    <>
      <PageIntro
        kicker="Tugas & Pengumpulan"
        title={current.title}
        subtitle={`${current.className} · ${current.subject}`}
        actions={
          <>
            <Link className="secondary-button" href="/tugas"><Icon name="arrow" />Kembali ke tugas</Link>
            <button className="secondary-button" type="button" onClick={() => setEditOpen(true)}>
              <Icon name="settings" />Edit tugas
            </button>
            <button className="primary-button" type="button" onClick={() => setAnnounceOpen(true)}>
              <Icon name="megaphone" />Beri pengumuman
            </button>
          </>
        }
      />
      <section className="detail-summary">
        <div className="detail-summary-main">
          <StatusPill tone="current">Aktif · {current.due}</StatusPill>
          <h2>{current.title}</h2>
          <p>Diposting {current.postedAt} oleh {current.teacher}</p>
        </div>
        <div className="detail-summary-stats">
          <div><strong>{liveSubmissions.length}</strong><span>terkumpul</span></div>
          <div><strong>{current.weight}</strong><span>bobot nilai</span></div>
          <div><strong>{liveSubmissions.filter((s) => s.grade != null).length}</strong><span>sudah dinilai</span></div>
        </div>
      </section>
      <div className="detail-layout">
        <section className="panel detail-main">
          <div className="panel-header">
            <div><p className="section-kicker">Instruksi tugas</p><h2>Materi dan arahan</h2></div>
            {raw?.attachmentUrl ? (
              <a className="text-button" href={raw.attachmentUrl} download={raw.attachmentName ?? undefined}>
                Unduh lampiran <Icon name="download" />
              </a>
            ) : (
              <button className="text-button" type="button" onClick={() => showToast("Tugas ini tidak memiliki lampiran.")}>
                Unduh lampiran <Icon name="download" />
              </button>
            )}
          </div>
          <div className="detail-copy">
            <p>{current.instructions}</p>
            {raw?.attachmentUrl ? (
              <div className="resource-box">
                <div className="resource-icon"><Icon name="file" /></div>
                <div><strong>{current.attachment}</strong><span>{current.attachmentSize}</span></div>
                <a className="row-arrow" href={raw.attachmentUrl} download={raw.attachmentName ?? undefined} aria-label="Unduh lampiran">
                  <Icon name="download" />
                </a>
              </div>
            ) : null}
          </div>
        </section>
        <section className="panel submissions-panel">
          <div className="panel-header">
            <div><p className="section-kicker">Daftar pengumpulan</p><h2>Jawaban siswa</h2></div>
            <button className="select-control" type="button">Semua status <Icon name="chevron" /></button>
          </div>
          <div className="submission-list">
            {liveSubmissions.map((item) => (
              <article key={item.id} className="submission-row">
                <Avatar initials={initialsOf(item.studentName)} tone="blue" />
                <div><strong>{item.studentName}</strong><span>{item.fileName ?? "Tanpa file"} · {formatTimeAgo(item.submittedAt)}</span></div>
                {item.fileUrl ? (
                  <a className="row-arrow" href={item.fileUrl} download={item.fileName ?? undefined} aria-label={`Unduh jawaban ${item.studentName}`}>
                    <Icon name="download" />
                  </a>
                ) : null}
                {item.grade != null ? (
                  <span className="grade-badge">{item.grade}</span>
                ) : (
                  <StatusPill tone="upcoming">Belum dinilai</StatusPill>
                )}
                <button className="row-arrow" type="button" aria-label={`Nilai jawaban ${item.studentName}`} onClick={() => { setGradingId(gradingId === item.id ? null : item.id); setGradeValue(item.grade != null ? String(item.grade) : ""); setFeedback(item.feedback ?? ""); }}>
                  <Icon name="settings" />
                </button>
                {gradingId === item.id ? (
                  <div className="grade-form">
                    <label className="form-field"><span>Nilai (0-100)</span><input type="number" min="0" max="100" value={gradeValue} onChange={(event) => setGradeValue(event.target.value)} /></label>
                    <label className="form-field"><span>Umpan balik <small>(opsional)</small></span><textarea rows={2} value={feedback} onChange={(event) => setFeedback(event.target.value)}></textarea></label>
                    <div className="grade-form-actions">
                      <button className="outline-small" type="button" onClick={() => setGradingId(null)}>Batal</button>
                      <button className="primary-button small-button" type="button" onClick={() => void handleGrade(item.id)}>Simpan nilai</button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>

      {editOpen && raw ? (
        <TaskEditModal assignment={raw} onClose={() => setEditOpen(false)} onSaved={load} />
      ) : null}
      {announceOpen ? (
        <AnnouncementComposerModal taskTitle={current.title} onClose={() => setAnnounceOpen(false)} />
      ) : null}
    </>
  );
}
