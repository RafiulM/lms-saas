"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, Avatar, type IconName } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { authClient } from "@/lib/auth-client";
import type { ShellData } from "@/lib/actions/shell";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  tone?: "warm" | "pink";
}

const teacherNavGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Ruang belajar",
    items: [
      { href: "/", label: "Beranda", icon: "home" },
      { href: "/jadwal", label: "Jadwal Pelajaran", icon: "calendar" },
      { href: "/tugas", label: "Tugas & Pengumpulan", icon: "file", tone: "warm" },
      { href: "/nilai", label: "Input Nilai", icon: "chart" },
    ],
  },
  {
    label: "Kelola sekolah",
    items: [
      { href: "/pengguna", label: "Pengguna & Kelas", icon: "users" },
      { href: "/pengumuman", label: "Pengumuman", icon: "megaphone", tone: "pink" },
      { href: "/langganan", label: "Kelola Langganan", icon: "file" },
      { href: "/pricing", label: "Pricing", icon: "file" },
      { href: "/pengaturan", label: "Pengaturan Sekolah", icon: "settings" },
    ],
  },
];

const studentNavGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Ruang belajar",
    items: [
      { href: "/", label: "Beranda", icon: "home" },
      { href: "/jadwal", label: "Jadwal Pelajaran", icon: "calendar" },
      { href: "/tugas", label: "Tugas Saya", icon: "file", tone: "warm" },
      { href: "/nilai", label: "Nilai Saya", icon: "chart" },
    ],
  },
  {
    label: "Informasi",
    items: [{ href: "/pengumuman", label: "Pengumuman", icon: "megaphone", tone: "pink" }],
  },
];

export const pageLabels: Record<string, string> = {
  "/": "Beranda",
  "/jadwal": "Jadwal Pelajaran",
  "/tugas": "Tugas & Pengumpulan",
  "/nilai": "Input Nilai",
  "/pengguna": "Pengguna & Kelas",
  "/pengumuman": "Pengumuman",
  "/langganan": "Kelola Langganan",
  "/pricing": "Pricing",
  "/pengaturan": "Pengaturan Sekolah",
  "/profil": "Profil Saya",
  "/masuk": "Masuk / Daftar",
  "/tugas/[id]": "Detail Tugas",
  "/kelas/[id]": "Detail Kelas",
  "/murid/[id]": "Detail Murid",
  "/pengumuman/[id]": "Detail Pengumuman",
};

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/tugas") return pathname === "/tugas" || pathname.startsWith("/tugas/");
  if (href === "/pengumuman") return pathname === "/pengumuman" || pathname.startsWith("/pengumuman/");
  if (href === "/pengguna") return pathname.startsWith("/kelas/") || pathname.startsWith("/murid/") || pathname === "/pengguna";
  return pathname === href;
}

/** Inisial sekolah: huruf pertama nama + digit pertama (SMA Negeri 5 Bandung → S5). */
function schoolInitials(name: string): string {
  const first = (name.trim()[0] ?? "S").toUpperCase();
  const digit = name.match(/\d/)?.[0] ?? "";
  return `${first}${digit}`.slice(0, 2);
}

function Sidebar({
  open,
  onClose,
  data,
  effectiveRole,
}: {
  open: boolean;
  onClose: () => void;
  data: ShellData;
  effectiveRole: Role;
}) {
  const { showToast } = useApp();
  const pathname = usePathname();
  const groups = effectiveRole === "student" ? studentNavGroups : teacherNavGroups;
  const schoolName = data.school?.name ?? "Sekolah";
  const schoolLogo = data.school?.logo ? null : schoolInitials(schoolName);

  const badgeCount = (href: string): number | undefined => {
    if (href === "/") return data.counts.beranda || undefined;
    if (href === "/tugas") return data.counts.tugas || undefined;
    if (href === "/pengumuman") return data.counts.pengumuman || undefined;
    return undefined;
  };

  return (
    <>
      <aside className={`sidebar${open ? " open" : ""}`} id="sidebar">
        <div className="sidebar-top">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true"><span className="brand-cube">+</span></div>
            <div>
              <p className="brand-name">kelas<span>hub</span></p>
              <p className="brand-caption">LEARNING WORKSPACE</p>
            </div>
          </div>
          <button className="mobile-close" type="button" aria-label="Tutup menu" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        <div className="school-switcher">
          <div className="school-logo">{schoolLogo ?? "S5"}</div>
          <div className="school-copy"><strong>{schoolName}</strong><span>Sekolah aktif</span></div>
          <button className="switcher-button" type="button" aria-label="Ganti sekolah">
            <Icon name="chevron" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navigasi utama">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="nav-label">{group.label}</p>
              {group.items.map((item) => {
                const count = badgeCount(item.href);
                return (
                  <Link key={item.href} href={item.href} className={`nav-item${isActive(item.href, pathname) ? " active" : ""}`}>
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                    {count != null ? (
                      <span className={`nav-count ${item.tone ?? ""}`.trim()}>
                        {String(count).padStart(2, "0")}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><span>?</span></div>
            <p>Butuh bantuan?</p>
            <span>Tim KelasHub siap membantu.</span>
            <button className="help-link" type="button" onClick={() => showToast("Pusat bantuan akan segera tersedia.")}>
              Lihat pusat bantuan <Icon name="arrow" />
            </button>
          </div>
          <p className="sidebar-version">KelasHub <span>v1.0</span></p>
        </div>
      </aside>
      <div className={`sidebar-overlay${open ? " visible" : ""}`} onClick={onClose}></div>
    </>
  );
}

function Topbar({
  onOpenSidebar,
  data,
  effectiveRole,
}: {
  onOpenSidebar: () => void;
  data: ShellData;
  effectiveRole: Role;
}) {
  const { showToast } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);

  const isStudent = effectiveRole === "student";
  const name = data.user?.name ?? (isStudent ? "Raka Pratama" : "Nabila Rahma");
  const initials = (name.split(" ").map((part) => part[0]).join("").slice(0, 2) || "GU").toUpperCase();
  const roleLabel = data.user
    ? { admin: "Admin", teacher: "Guru", student: "Murid" }[data.user.role] ?? "Murid"
    : isStudent
      ? "Murid"
      : "Guru";
  const email = data.user?.email ?? (isStudent ? "raka.pratama@sman5bdg.sch.id" : "nabila@sman5bdg.sch.id");
  const schoolName = data.school?.name ?? "SMA Negeri 5 Bandung";

  useEffect(() => {
    if (!profileOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [profileOpen]);

  const breadcrumbLabel = pageLabels[pathname] ?? (pathname.startsWith("/tugas/") ? "Detail Tugas" : "Beranda");

  return (
    <header className="topbar">
      <button className="mobile-menu" type="button" aria-label="Buka menu" onClick={onOpenSidebar}>
        <Icon name="menu" />
      </button>
      <div className="breadcrumb" aria-label="Lokasi halaman">
        <span>{schoolName}</span>
        <Icon name="arrow" />
        <strong>{breadcrumbLabel}</strong>
      </div>
      <div className="topbar-actions">
        <button className="icon-button notification-button" type="button" aria-label="Notifikasi" onClick={() => showToast("Belum ada notifikasi baru.")}>
          <Icon name="bell" />
          <span className="notification-dot"></span>
        </button>
        <div className="profile-wrap" ref={profileRef}>
          <button className="profile-button" type="button" aria-expanded={profileOpen} aria-controls="profile-menu" onClick={() => setProfileOpen((open) => !open)}>
            <Avatar initials={initials} tone="profile" />
            <span className="profile-copy"><strong>{name}</strong><span>{roleLabel}</span></span>
            <Icon name="chevron" className="profile-chevron icon" />
          </button>
          {profileOpen ? (
            <div className="profile-menu" id="profile-menu">
              <div className="profile-menu-header">
                <Avatar initials={initials} tone="profile" />
                <div><strong>{name}</strong><span>{email}</span></div>
              </div>
              <Link href="/profil" onClick={() => setProfileOpen(false)}><Icon name="user" />Profil saya</Link>
              <Link href="/pengaturan" onClick={() => setProfileOpen(false)}><Icon name="settings" />Pengaturan akun</Link>
              <div className="profile-menu-divider"></div>
              <button
                className="logout-button"
                type="button"
                onClick={async () => {
                  setProfileOpen(false);
                  if (data.user) {
                    await authClient.signOut();
                    showToast("Berhasil keluar. Sampai jumpa!");
                  }
                  window.location.assign("/masuk");
                }}
              ><Icon name="logout" />Keluar</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function AppShell({ data, children }: { data: ShellData; children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role: effectiveRole } = useApp();

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} data={data} effectiveRole={effectiveRole} />
      <div className="page-wrap">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} data={data} effectiveRole={effectiveRole} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
