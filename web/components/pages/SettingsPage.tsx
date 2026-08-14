"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icon, PageIntro } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { getSchoolProfile, updateSchool } from "@/lib/actions/school";

const settingsTabs = ["Profil sekolah", "Preferensi notifikasi", "Keamanan", "Integrasi"] as const;

export function SettingsPage() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<(typeof settingsTabs)[number]>("Profil sekolah");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSchoolProfile().then((data) => {
      if (data?.school) {
        setName(data.school.name ?? "");
        setAddress(data.school.address ?? "");
        setEmail(data.school.email ?? "");
        setPhone(data.school.phone ?? "");
        setLogo(data.school.logo ?? null);
      }
      setLoaded(true);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSchool({ name, address, phone, description: undefined, logo: logo ?? undefined });
      showToast("Perubahan berhasil disimpan.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran logo maksimal 2 MB.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Upload gagal.");
      }
      const { url } = await res.json();
      setLogo(url);
      showToast("Logo diunggah. Jangan lupa simpan perubahan.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Upload logo gagal. Coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageIntro
        kicker="Administrasi"
        title="Pengaturan Sekolah"
        subtitle="Perbarui identitas sekolah dan atur preferensi ruang kerja."
        actions={
          <button className="primary-button" type="button" onClick={handleSave} disabled={saving}>
            <Icon name="file" />{saving ? "Menyimpan…" : "Simpan perubahan"}
          </button>
        }
      />
      <div className="settings-layout">
        <aside className="panel settings-menu">
          {settingsTabs.map((tab) => (
            <button key={tab} type="button" className={`settings-link${activeTab === tab ? " active" : ""}`} onClick={() => setActiveTab(tab)}>
              <Icon name={tab === "Profil sekolah" ? "school" : tab === "Keamanan" ? "settings" : tab === "Integrasi" ? "grid" : "bell"} />
              {tab}
            </button>
          ))}
        </aside>
        <section className="panel settings-form">
          <div className="settings-form-header">
            <div><p className="section-kicker">Profil sekolah</p><h2>Informasi umum</h2></div>
            <span className="saved-label"><span className="status-dot"></span>Data tersimpan di database</span>
          </div>
          <div className="school-profile-preview">
            {logo ? (
              <Image className="school-logo school-logo-img" src={logo} alt="Logo sekolah" width={33} height={33} unoptimized />
            ) : (
              <div className="school-logo large-logo">{(name || "S").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
            )}
            <div><strong>Logo sekolah</strong><span>PNG atau JPG, maksimum 2 MB.</span></div>
            <button className="outline-small" type="button" disabled={uploading} onClick={() => logoRef.current?.click()}>
              {uploading ? "Mengunggah…" : logo ? "Ganti logo" : "Unggah logo"}
            </button>
            <input ref={logoRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden-input" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleLogoUpload(file); event.target.value = ""; }} />
          </div>
          <div className="form-grid">
            <label className="form-field"><span>Nama sekolah</span><input value={name} onChange={(event) => setName(event.target.value)} disabled={!loaded} /></label>
            <label className="form-field"><span>Email sekolah</span><input value={email} onChange={(event) => setEmail(event.target.value)} disabled={!loaded} /></label>
            <label className="form-field full-field"><span>Alamat sekolah</span><input value={address} onChange={(event) => setAddress(event.target.value)} disabled={!loaded} /></label>
            <label className="form-field"><span>Nomor telepon</span><input value={phone} onChange={(event) => setPhone(event.target.value)} disabled={!loaded} /></label>
          </div>
          <div className="settings-divider"></div>
          <div className="settings-form-footer">
            <p>Perubahan disimpan langsung ke database sekolah.</p>
            <button className="primary-button" type="button" onClick={handleSave} disabled={saving}>
              <Icon name="file" />{saving ? "Menyimpan…" : "Simpan perubahan"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
