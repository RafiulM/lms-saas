"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Icon, PageIntro } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { authClient, useCurrentUser } from "@/lib/auth-client";
import { getSchoolProfile } from "@/lib/actions/school";

function ProfileEditModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useApp();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSavingName(true);
    try {
      const res = await authClient.updateUser({ name });
      if (res.error) throw new Error(res.error.message ?? "Gagal memperbarui nama.");
      showToast("Nama profil berhasil diperbarui.");
      onClose();
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal memperbarui nama.");
    } finally {
      setSavingName(false);
    }
  };

  const handlePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      const res = await authClient.changePassword({ currentPassword, newPassword });
      if (res.error) throw new Error(res.error.message ?? "Gagal mengganti kata sandi.");
      showToast("Kata sandi berhasil diganti.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal mengganti kata sandi.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
        <div className="modal-header">
          <div>
            <p className="section-kicker">Akun saya</p>
            <h2 id="profile-modal-title">Edit profil</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Tutup dialog" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={handleName}>
          <label className="form-field">
            <span>Nama lengkap</span>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <div className="modal-footer">
            <span className="modal-footer-hint">Nama tampil di seluruh dasbor.</span>
            <button className="primary-button" type="submit" disabled={savingName || !user}>
              {savingName ? "Menyimpan…" : "Simpan nama"}
            </button>
          </div>
        </form>
        <div className="settings-divider"></div>
        <p className="section-kicker">Keamanan</p>
        <h2 className="profile-edit-subtitle">Ganti kata sandi</h2>
        <form onSubmit={handlePassword}>
          <label className="form-field">
            <span>Kata sandi saat ini</span>
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </label>
          <label className="form-field">
            <span>Kata sandi baru</span>
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6} required />
          </label>
          <div className="modal-footer">
            <button className="primary-button" type="submit" disabled={savingPassword || !user}>
              {savingPassword ? "Mengganti…" : "Ganti kata sandi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { role, showToast } = useApp();
  const { user: loggedInUser } = useCurrentUser();
  const [schoolName, setSchoolName] = useState("SMA Negeri 5 Bandung");
  const [emailNotif, setEmailNotif] = useState(true);
  const [dueReminder, setDueReminder] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    getSchoolProfile().then((data) => {
      if (data?.school?.name) setSchoolName(data.school.name);
    });
  }, []);

  const isStudent = role === "student";
  const name = loggedInUser?.name ?? (isStudent ? "Raka Pratama" : "Nabila Rahma");
  const initials = (name.split(" ").map((part) => part[0]).join("").slice(0, 2) || "GU").toUpperCase();
  const email = loggedInUser?.email ?? (isStudent ? "raka.pratama@sman5bdg.sch.id" : "nabila@sman5bdg.sch.id");
  const roleLabel = loggedInUser?.role ? { admin: "Admin", teacher: "Guru", student: "Murid" }[loggedInUser.role] ?? "Pengguna" : isStudent ? "Murid" : "Guru";

  return (
    <>
      <PageIntro
        kicker="Akun saya"
        title={name}
        subtitle={`${roleLabel} · ${schoolName}`}
        actions={
          <button className="primary-button" type="button" onClick={() => setEditOpen(true)}>
            <Icon name="settings" />Edit profil
          </button>
        }
      />
      <div className="profile-page-grid">
        <section className="panel profile-card-large">
          <Avatar initials={initials} tone={isStudent ? "blue" : "profile"} className="profile-large-avatar" />
          <h2>{name}</h2>
          <span className="role-tag">{roleLabel}</span>
          <p>{email}</p>
          <div className="profile-details">
            <div><span>Sekolah</span><strong>{schoolName}</strong></div>
            <div><span>Peran</span><strong>{roleLabel}</strong></div>
            <div><span>Status akun</span><strong>{loggedInUser ? "Masuk & terautentikasi" : "Mode demo"}</strong></div>
          </div>
        </section>
        <section className="panel profile-settings-card">
          <div className="panel-header">
            <div><p className="section-kicker">Preferensi akun</p><h2>Pengaturan pribadi</h2></div>
          </div>
          <label className="toggle-row">
            <span><strong>Email notifikasi</strong><small>Terima ringkasan aktivitas harian.</small></span>
            <input type="checkbox" checked={emailNotif} onChange={() => setEmailNotif((value) => !value)} />
            <i></i>
          </label>
          <label className="toggle-row">
            <span><strong>Pengingat tenggat</strong><small>Ingatkan saya sebelum tugas jatuh tempo.</small></span>
            <input type="checkbox" checked={dueReminder} onChange={() => setDueReminder((value) => !value)} />
            <i></i>
          </label>
          <label className="toggle-row">
            <span><strong>Mode kontras tinggi</strong><small>Gunakan warna yang lebih kontras.</small></span>
            <input type="checkbox" checked={highContrast} onChange={() => setHighContrast((value) => !value)} />
            <i></i>
          </label>
        </section>
      </div>

      {editOpen ? <ProfileEditModal onClose={() => setEditOpen(false)} /> : null}
    </>
  );
}
