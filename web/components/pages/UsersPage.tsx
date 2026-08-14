"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Icon, MetricCard, PageIntro, StatusPill } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { teacherUsers as mockUsers } from "@/lib/data";
import { createUsers, deleteUser, listUsers } from "@/lib/actions/users";
import { parseUserLines } from "@/lib/user-import";
import { listClasses } from "@/lib/actions/classes";
import { initialsOf } from "@/lib/adapters";

type Row = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  className: string;
};

function UsersPageBody({ live }: { live: Row[] | null }) {
  const { showToast } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState("Semua pengguna");
  const [modal, setModal] = useState<"single" | "bulk" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [newRole, setNewRole] = useState<"teacher" | "student">("student");
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);
  const [className, setClassName] = useState("");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const bulkRef = useRef<HTMLTextAreaElement>(null);
  const tabs = ["Semua pengguna", "Murid", "Guru", "Kelas"];

  useEffect(() => {
    listClasses().then((data) => {
      if (data) setClasses(data.classes.map((c) => ({ id: c.id, name: c.name })));
    });
  }, []);

  const users = live ?? mockUsers.map((u) => ({
    id: u.slug ?? u.name,
    name: u.name,
    email: "",
    role: u.role === "Guru" ? ("teacher" as const) : ("student" as const),
    className: u.group,
  }));

  const counts: Record<string, number> = {
    "Semua pengguna": users.length,
    Murid: users.filter((u) => u.role === "student").length,
    Guru: users.filter((u) => u.role === "teacher").length,
    Kelas: classes.length,
  };

  const filtered = users.filter((user) => {
    if (tab === "Murid") return user.role === "student";
    if (tab === "Guru") return user.role === "teacher";
    return true;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "single") {
        await createUsers([{ name, email, password, role: newRole, className: newRole === "student" ? className : undefined }]);
        showToast(`Akun ${newRole === "teacher" ? "guru" : "murid"} ${name} berhasil dibuat.`);
      } else {
        const parsed = parseUserLines(bulkText);
        if (!parsed.length) throw new Error("Tidak ada baris yang valid. Gunakan format: Nama, email, sandi");
        const res = await createUsers(parsed);
        const ok = res.results.filter((r) => r.ok).length;
        showToast(`${ok} dari ${res.results.length} akun berhasil dibuat.`);
      }
      setModal(null);
      setName(""); setEmail(""); setPassword("password123"); setBulkText(""); setClassName("");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal membuat akun.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: Row) => {
    if (!live) {
      showToast("Hapus akun tersedia setelah masuk.");
      return;
    }
    try {
      await deleteUser(user.id);
      showToast(`Akun ${user.name} dihapus.`);
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menghapus akun.");
    }
  };

  return (
    <>
      <PageIntro
        kicker="Kelola sekolah"
        title="Pengguna & Kelas"
        subtitle="Kelola akun, pembagian kelas, dan jumlah pengguna aktif sekolah."
        actions={
          <>
            <Link className="secondary-button" href={`/kelas/${classes[0]?.id ?? "xii-ipa-1"}`}><Icon name="users" />Lihat {classes[0]?.name ?? "kelas"}</Link>
            <button className="secondary-button" type="button" onClick={() => { setModal("bulk"); setBulkText(""); window.setTimeout(() => bulkRef.current?.focus(), 50); }}>
              <Icon name="download" />Impor dari Excel
            </button>
            <button className="primary-button" type="button" onClick={() => setModal("single")}>
              <Icon name="plus" />Tambah pengguna
            </button>
          </>
        }
      />
      <section className="metric-grid compact-metrics">
        <MetricCard tone="teal" label="Total murid" value={<>{counts.Murid} <span>siswa</span></>} detail={`${classes.length} kelas terdaftar`} />
        <MetricCard tone="purple" label="Total guru" value={<>{counts.Guru} <span>guru</span></>} detail="Aktif di sekolah" />
        <MetricCard tone="coral" label="Kelas terdaftar" value={<>{classes.length} <span>kelas</span></>} detail="Semester Ganjil" />
      </section>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div className="filter-tabs">
            {tabs.map((name) => (
              <button key={name} type="button" className={`filter-tab${tab === name ? " active" : ""}`} onClick={() => setTab(name)}>
                {name} <span>{counts[name]}</span>
              </button>
            ))}
          </div>
          <button className="select-control" type="button">Terbaru <Icon name="chevron" /></button>
        </div>
        <div className="table-scroll">
          <table className="app-table">
            <thead><tr><th>Nama</th><th>Peran</th><th>Kelas / Mata pelajaran</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="table-primary">
                      <Avatar initials={initialsOf(user.name)} tone={user.role === "teacher" || user.role === "admin" ? "rust" : "blue"} />
                      <div><strong>{user.name}</strong>{user.email ? <small className="muted-text">{user.email}</small> : null}</div>
                    </div>
                  </td>
                  <td>{user.role === "admin" ? "Admin" : user.role === "teacher" ? "Guru" : "Murid"}</td>
                  <td>{user.className || "—"}</td>
                  <td><StatusPill tone="done">Aktif</StatusPill></td>
                  <td>
                    <div className="row-actions">
                      {user.role === "student" ? (
                        <Link className="row-arrow" href={`/murid/${user.id}`} aria-label={`Buka ${user.name}`}><Icon name="arrow" /></Link>
                      ) : null}
                      <button className="row-arrow" type="button" aria-label={`Hapus ${user.name}`} onClick={() => void handleDelete(user)}><Icon name="close" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal ? (
        <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
            <div className="modal-header">
              <div>
                <p className="section-kicker">{modal === "single" ? "Akun baru" : "Impor massal"}</p>
                <h2 id="user-modal-title">{modal === "single" ? "Tambah pengguna" : "Impor dari Excel"}</h2>
              </div>
              <button className="modal-close" type="button" aria-label="Tutup dialog" onClick={() => setModal(null)}>
                <Icon name="close" />
              </button>
            </div>
            {modal === "single" ? (
              <form className="modal-form" onSubmit={(event) => { event.preventDefault(); void handleSave(); }}>
                <label className="form-field">
                  <span>Nama lengkap</span>
                  <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
                </label>
                <label className="form-field">
                  <span>Email</span>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </label>
                <label className="form-field">
                  <span>Kata sandi</span>
                  <input type="text" value={password} onChange={(event) => setPassword(event.target.value)} required />
                </label>
                <div className="form-row">
                  <label className="form-field">
                    <span>Peran</span>
                    <select value={newRole} onChange={(event) => setNewRole(event.target.value as "teacher" | "student")}>
                      <option value="student">Murid</option>
                      <option value="teacher">Guru</option>
                    </select>
                  </label>
                  {newRole === "student" ? (
                    <label className="form-field">
                      <span>Kelas</span>
                      <select value={className} onChange={(event) => setClassName(event.target.value)}>
                        <option value="">Belum ada kelas</option>
                        {classes.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                      </select>
                    </label>
                  ) : null}
                </div>
                <div className="modal-footer">
                  <button className="secondary-button" type="button" onClick={() => setModal(null)}>Batal</button>
                  <button className="primary-button" type="submit" disabled={saving}>{saving ? "Menyimpan…" : "Buat akun"}</button>
                </div>
              </form>
            ) : (
              <form className="modal-form" onSubmit={(event) => { event.preventDefault(); void handleSave(); }}>
                <p className="modal-hint">Tempel data dari Excel. Satu baris per pengguna, kolom dipisah tab/koma/titik-koma: <strong>Nama, email, sandi, peran</strong> (peran opsional: guru/murid).</p>
                <label className="form-field">
                  <span>Data pengguna</span>
                  <textarea rows={8} ref={bulkRef} placeholder={"Alya Putri\talya@sekolah.sch.id\tpassword123\tmurid\nDewi Kartika\tdewi@sekolah.sch.id\tpassword123\tguru"} value={bulkText} onChange={(event) => setBulkText(event.target.value)} required></textarea>
                </label>
                <div className="modal-footer">
                  <button className="secondary-button" type="button" onClick={() => setModal(null)}>Batal</button>
                  <button className="primary-button" type="submit" disabled={saving}>{saving ? "Membuat…" : `Impor ${parseUserLines(bulkText).length} akun`}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function UsersPage() {
  const [live, setLive] = useState<Row[] | null>(null);

  useEffect(() => {
    listUsers().then((data) => {
      if (!data) return;
      setLive(data.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as Row["role"],
        className: u.className,
      })));
    });
  }, []);

  return <UsersPageBody live={live} />;
}
