"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Icon } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { authClient } from "@/lib/auth-client";
import { registerSchool } from "@/lib/actions/school";

export function AuthPage() {
  const router = useRouter();
  const { showToast } = useApp();
  const [mode, setMode] = useState<"Masuk" | "Daftar sekolah">("Masuk");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminName, setAdminName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "Masuk") {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message ?? "Email atau kata sandi salah.");
        showToast("Berhasil masuk. Selamat datang kembali!");
        router.push("/");
        router.refresh();
      } else {
        await registerSchool({ name: schoolName, email, password, adminName });
        showToast("Sekolah berhasil didaftarkan! Kamu sudah masuk sebagai admin.");
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-brand">
        <div className="brand-mark"><span className="brand-cube">+</span></div>
        <div>
          <p className="brand-name">kelas<span>hub</span></p>
          <p className="brand-caption">LEARNING WORKSPACE</p>
        </div>
      </div>
      <div className="auth-layout">
        <section className="auth-intro">
          <p className="focus-kicker"><span></span>Ruang belajar yang lebih rapi</p>
          <h1>Semua sekolah<br />berawal dari<br /><span>satu tempat.</span></h1>
          <p>Kelola jadwal, tugas, nilai, dan komunikasi sekolah tanpa berpindah-pindah spreadsheet.</p>
          <div className="auth-proof">
            <Avatar initials="AP" tone="blue" />
            <Avatar initials="SN" tone="yellow" />
            <Avatar initials="FA" tone="green" />
            <p><strong>308 pengguna</strong><small>belajar bersama di sekolah ini</small></p>
          </div>
        </section>
        <section className="panel auth-card">
          <div className="auth-tabs">
            <button type="button" disabled={!hydrated} className={mode === "Masuk" ? "active" : ""} onClick={() => setMode("Masuk")}>Masuk</button>
            <button type="button" disabled={!hydrated} className={mode === "Daftar sekolah" ? "active" : ""} onClick={() => setMode("Daftar sekolah")}>Daftar sekolah</button>
          </div>
          <p className="section-kicker">{mode === "Masuk" ? "Selamat datang kembali" : "Mulai bersama KelasHub"}</p>
          <h2>{mode === "Masuk" ? "Masuk ke KelasHub" : "Daftarkan sekolahmu"}</h2>
          <p className="auth-description">
            {mode === "Masuk" ? "Gunakan email sekolah untuk melanjutkan." : "Isi data sekolah untuk membuat akun admin pertama."}
          </p>
          <form onSubmit={handleSubmit}>
            <fieldset className="auth-fieldset" disabled={!hydrated}>
            {mode === "Daftar sekolah" ? (
              <>
                <label className="form-field">
                  <span>Nama sekolah</span>
                  <input type="text" placeholder="Contoh: SMA Negeri 5 Bandung" value={schoolName} onChange={(event) => setSchoolName(event.target.value)} required />
                </label>
                <label className="form-field">
                  <span>Nama admin</span>
                  <input type="text" placeholder="Nama kepala sekolah atau admin" value={adminName} onChange={(event) => setAdminName(event.target.value)} required />
                </label>
              </>
            ) : null}
            <label className="form-field">
              <span>Email sekolah</span>
              <input type="email" placeholder="nama@sekolah.sch.id" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="form-field">
              <span>Kata sandi</span>
              <input type="password" placeholder="Masukkan kata sandi" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            {mode === "Masuk" ? (
              <div className="auth-options">
                <label><input type="checkbox" /> Ingat saya</label>
                <button type="button" onClick={() => showToast("Reset kata sandi akan segera tersedia.")}>Lupa kata sandi?</button>
              </div>
            ) : null}
            <button className="primary-button auth-submit" type="submit" disabled={loading || !hydrated}>
              {loading ? "Memproses…" : mode === "Masuk" ? "Masuk" : "Daftar sekolah"} <Icon name="arrow" />
            </button>
            </fieldset>
          </form>
          <p className="auth-footer">
            {mode === "Masuk" ? "Belum punya akun sekolah? " : "Sudah punya akun? "}
            <button type="button" onClick={() => setMode(mode === "Masuk" ? "Daftar sekolah" : "Masuk")}>
              {mode === "Masuk" ? "Daftar sekarang" : "Masuk di sini"}
            </button>
          </p>
          <p className="auth-footer">
            <Link href="/">Kembali ke dasbor</Link>
          </p>
        </section>
      </div>
    </section>
  );
}
