"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, Icon, PageIntro, PageLoading, StatusPill } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { authClient } from "@/lib/auth-client";
import { getStudentDetail } from "@/lib/actions/grades";
import { formatDateShort, initialsOf, letterGrade } from "@/lib/adapters";

function StudentEditModal({
  studentId,
  name,
  email,
  onClose,
}: {
  studentId: string;
  name: string;
  email: string;
  onClose: () => void;
}) {
  const { showToast } = useApp();
  const router = useRouter();
  const [newName, setNewName] = useState(name);
  const [newEmail, setNewEmail] = useState(email);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await authClient.admin.updateUser({
        userId: studentId,
        data: { name: newName, email: newEmail },
      });
      if (res.error) throw new Error(res.error.message ?? "Gagal memperbarui profil murid.");
      showToast("Profil murid berhasil diperbarui.");
      onClose();
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal memperbarui profil murid.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="student-modal-title">
        <div className="modal-header">
          <div>
            <p className="section-kicker">Profil murid</p>
            <h2 id="student-modal-title">Edit profil murid</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Tutup dialog" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Nama lengkap</span>
            <input type="text" value={newName} onChange={(event) => setNewName(event.target.value)} required />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required />
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

export function StudentDetailPage() {
  const { user: currentUser, showToast } = useApp();
  const params = useParams<{ id: string }>();
  const [live, setLive] = useState<Awaited<ReturnType<typeof getStudentDetail>>>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getStudentDetail(params.id)
      .then((data) => {
        if (!active) return;
        if (data) {
          setLive(data);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) return <PageLoading />;

  if (notFound || !live) {
    return (
      <>
        <PageIntro
          kicker="Profil murid"
          title="Murid tidak ditemukan"
          subtitle="Profil murid ini mungkin telah dihapus atau tidak tersedia untuk akunmu."
          actions={
            <Link className="secondary-button" href="/pengguna"><Icon name="arrow" />Kembali ke pengguna</Link>
          }
        />
        <section className="panel">
          <p className="empty-state">Murid tidak ditemukan. Periksa kembali daftar murid di halaman Pengguna.</p>
        </section>
      </>
    );
  }

  const student = live;

  const firstName = student.name.split(" ")[0];
  const subjectRows = student.subjects.map((s) => {
    const values = [s.task, s.exam].filter((v): v is number => v != null);
    const avg = values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : null;
    return { ...s, average: avg };
  });

  return (
    <>
      <PageIntro
        kicker="Profil murid"
        title={student.name}
        subtitle={`${student.className} · Murid aktif`}
        actions={
          <>
            <Link className="secondary-button" href="/pengguna"><Icon name="arrow" />Kembali ke pengguna</Link>
            <button className="primary-button" type="button" onClick={() => showToast("Fitur pesan akan segera tersedia.")}>
              <Icon name="megaphone" />Kirim pesan
            </button>
          </>
        }
      />
      <section className="student-profile-card">
        <div className="profile-large-avatar avatar-blue">{initialsOf(student.name)}</div>
        <div className="student-profile-main">
          <div className="profile-tags">
            <StatusPill tone="done">Aktif</StatusPill>
            <span className="role-tag">Murid</span>
          </div>
          <h2>{student.name}</h2>
          <p>{student.email} · Bergabung sejak {formatDateShort(student.joinedAt)}</p>
        </div>
        <div className="student-profile-actions">
          {currentUser?.role === "admin" ? (
            <button className="outline-small" type="button" onClick={() => setEditOpen(true)}>
              <Icon name="settings" /> Edit profil
            </button>
          ) : null}
        </div>
      </section>
      <div className="student-detail-grid">
        <section className="panel">
          <div className="panel-header">
            <div><p className="section-kicker">Ringkasan belajar</p><h2>Perkembangan {firstName}</h2></div>
            <span className="soft-status"><span className="status-dot"></span>Data dari database</span>
          </div>
          <div className="student-kpi-grid">
            <div><strong>{student.average ?? "—"}</strong><span>rata-rata nilai</span><em>Terbaru</em></div>
            <div><strong>{student.subjects.length}</strong><span>mata pelajaran</span><em>Aktif</em></div>
            <div><strong>{subjectRows.filter((s) => s.average != null).length}</strong><span>nilai tercatat</span><em>Lengkap</em></div>
          </div>
        </section>
        <section className="panel feedback-panel">
          <p className="section-kicker">Catatan wali kelas</p>
          <h2>Perlu dipertahankan</h2>
          <p>{firstName} konsisten mengumpulkan tugas tepat waktu.</p>
          <div className="feedback-author">
            <Avatar initials="NR" tone="rust" />
            <span>Wali kelas<small>Catatan otomatis dari database</small></span>
          </div>
        </section>
      </div>
      <section className="panel table-panel">
        <div className="panel-header">
          <div><p className="section-kicker">Nilai terbaru</p><h2>Rekap nilai {firstName}</h2></div>
          <Link className="text-button" href="/nilai">Lihat rekap kelas <Icon name="arrow" /></Link>
        </div>
        <div className="table-scroll">
          <table className="app-table">
            <thead><tr><th>Mata pelajaran</th><th>Tugas terakhir</th><th>Ulangan</th><th>Rata-rata</th><th>Predikat</th></tr></thead>
            <tbody>
              {subjectRows.map((grade) => (
                <tr key={grade.subject}>
                  <td>{grade.subject}</td>
                  <td>{grade.task ?? "—"}</td>
                  <td>{grade.exam ?? "—"}</td>
                  <td><strong>{grade.average ?? "—"}</strong></td>
                  <td><span className="grade-badge">{grade.average != null ? letterGrade(grade.average) : "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!subjectRows.length ? (
          <p className="empty-state">Belum ada nilai tercatat untuk murid ini.</p>
        ) : null}
      </section>

      {editOpen && live ? (
        <StudentEditModal
          studentId={live.id}
          name={live.name}
          email={live.email}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </>
  );
}
