const sidebar = document.querySelector("#sidebar");
const sidebarNav = document.querySelector("#sidebar-nav");
const sidebarOverlay = document.querySelector("#sidebar-overlay");
const profileToggle = document.querySelector("#profile-toggle");
const profileMenu = document.querySelector("#profile-menu");
const profileRoleToggle = document.querySelector("#profile-role-toggle");
const homePage = document.querySelector("#beranda");
const dynamicPage = document.querySelector("#dynamic-page");
const breadcrumbPage = document.querySelector("#breadcrumb-page");
const roleSwitcher = document.querySelector("#role-switcher");
const roleLabel = document.querySelector("#role-label");
const modal = document.querySelector("#task-modal");
const taskForm = document.querySelector("#task-form");
const toast = document.querySelector("#toast");

const state = { role: "teacher", view: "home" };
let toastTimer;

const icon = (name, className = "icon") => `<svg class="${className}"><use href="#icon-${name}"></use></svg>`;

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3200);
}

function toggleSidebar(open) {
  sidebar.classList.toggle("open", open);
  sidebarOverlay.classList.toggle("visible", open);
  document.body.classList.toggle("menu-open", open);
}

function toggleProfile(forceOpen) {
  const shouldOpen = forceOpen ?? profileMenu.hasAttribute("hidden");
  profileMenu.toggleAttribute("hidden", !shouldOpen);
  profileToggle.setAttribute("aria-expanded", String(shouldOpen));
}

function toggleModal(open) {
  modal.toggleAttribute("hidden", !open);
  document.body.classList.toggle("modal-open", open);
  if (open) window.setTimeout(() => modal.querySelector("input")?.focus(), 50);
}

function navItem(view, label, iconName, count = "", tone = "") {
  const badge = count ? `<span class="nav-count ${tone}">${count}</span>` : "";
  return `<a class="nav-item" href="#${view}" data-view="${view}" data-page="${label}">${icon(iconName)}<span>${label}</span>${badge}</a>`;
}

function teacherNavigation() {
  return `<p class="nav-label">Ruang belajar</p>
    ${navItem("home", "Beranda", "home", "04")}
    ${navItem("schedule", "Jadwal Pelajaran", "calendar")}
    ${navItem("tasks", "Tugas &amp; Pengumpulan", "file", "08", "warm")}
    ${navItem("grades", "Input Nilai", "chart")}
    <p class="nav-label nav-label-spaced">Kelola sekolah</p>
    ${navItem("users", "Pengguna &amp; Kelas", "users")}
    ${navItem("announcements", "Pengumuman", "megaphone", "02", "pink")}
    ${navItem("subscription", "Kelola Langganan", "file")}
    ${navItem("pricing", "Pricing", "file")}
    ${navItem("settings", "Pengaturan Sekolah", "settings")}`;
}

function studentNavigation() {
  return `<p class="nav-label">Ruang belajar</p>
    ${navItem("home", "Beranda", "home", "03")}
    ${navItem("schedule", "Jadwal Pelajaran", "calendar")}
    ${navItem("tasks", "Tugas Saya", "file", "03", "warm")}
    ${navItem("grades", "Nilai Saya", "chart")}
    <p class="nav-label nav-label-spaced">Informasi</p>
    ${navItem("announcements", "Pengumuman", "megaphone", "02", "pink")}`;
}

function updateProfile() {
  const isStudent = state.role === "student";
  const name = isStudent ? "Raka Pratama" : "Nabila Rahma";
  const initials = isStudent ? "RP" : "NR";
  const role = isStudent ? "Murid" : "Guru";
  const email = isStudent ? "raka.pratama@sman5bdg.sch.id" : "nabila@sman5bdg.sch.id";
  roleLabel.textContent = role;
  profileRoleToggle.querySelector("span").textContent = isStudent ? "Mode Guru" : "Mode Murid";
  document.querySelectorAll(".avatar-profile").forEach((avatar) => { avatar.textContent = initials; });
  document.querySelectorAll(".profile-copy strong, .profile-menu-header strong").forEach((element) => { element.textContent = name; });
  document.querySelector(".profile-copy span").textContent = role;
  document.querySelector(".profile-menu-header > div > span").textContent = email;
}

function markActiveNav() {
  const parentViews = { "task-detail": "tasks", "class-detail": "users", "student-detail": "users", "announcement-detail": "announcements", profile: "home", auth: "home" };
  const activeView = parentViews[state.view] || state.view;
  sidebarNav.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === activeView);
  });
}

function pageIntro(kicker, title, subtitle, actions = "") {
  return `<section class="page-intro app-page-intro"><div><p class="eyebrow"><span class="eyebrow-dot"></span>${kicker}</p><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div><div class="page-actions">${actions}</div></section>`;
}

function actionButton(label, iconName, className = "primary-button", attributes = "") {
  return `<button class="${className}" type="button" ${attributes}>${icon(iconName)}${label}</button>`;
}

function statCard(label, value, detail, tone = "teal", trend = "") {
  return `<article class="metric-card metric-${tone}"><div class="metric-topline"><span class="metric-icon">${icon(tone === "purple" ? "chart" : tone === "coral" ? "users" : "file")}</span>${trend ? `<span class="metric-trend positive">${trend}</span>` : ""}</div><p class="metric-label">${label}</p><p class="metric-number">${value}</p><div class="metric-footer"><span class="mini-dot dot-${tone === "purple" ? "purple" : tone === "coral" ? "coral" : tone === "blue" ? "blue" : "orange"}"></span>${detail}</div><div class="metric-progress ${tone}-progress"><span style="width: ${tone === "purple" ? "86" : tone === "coral" ? "78" : tone === "blue" ? "56" : "68"}%"></span></div></article>`;
}

function renderTeacherSchedule() {
  return `${pageIntro("Akademik", "Jadwal Pelajaran", "Susun jadwal mingguan dan bagikan agenda ke setiap kelas.", actionButton("Buat jadwal", "plus", "primary-button", `data-toast="Form jadwal baru akan segera tersedia."`))}
    <div class="page-toolbar"><div class="toolbar-group"><button class="select-control" type="button">Semua kelas ${icon("chevron")}</button><button class="select-control" type="button">Semua guru ${icon("chevron")}</button></div><div class="toolbar-group"><button class="outline-icon-button" type="button" data-toast="Minggu sebelumnya akan segera tersedia.">${icon("arrow")}</button><strong class="toolbar-date">11 - 16 Agustus 2026</strong><button class="outline-icon-button" type="button" data-toast="Minggu berikutnya akan segera tersedia.">${icon("arrow")}</button></div></div>
    <section class="panel schedule-board"><div class="panel-header"><div><p class="section-kicker">Kalender mingguan</p><h2>Jadwal mengajar</h2></div><span class="soft-status"><span class="status-dot"></span>Terakhir disimpan 10 menit lalu</span></div>
      <div class="weekly-grid"><div class="weekly-head"><span>Jam</span><strong>Senin <small>11</small></strong><strong>Selasa <small>12</small></strong><strong class="today-col">Rabu <small>13</small></strong><strong>Kamis <small>14</small></strong><strong>Jumat <small>15</small></strong></div>
        <div class="weekly-row"><span class="time-slot">07:00</span><div class="week-cell"><div class="class-block teal-block"><strong>Matematika</strong><small>XII IPA 1</small><em>07:30 - 09:00</em></div></div><div class="week-cell"><div class="class-block purple-block"><strong>Aljabar</strong><small>XI IPA 2</small><em>07:30 - 09:00</em></div></div><div class="week-cell today-col"><div class="class-block teal-block"><strong>Matematika</strong><small>XII IPA 1</small><em>08:00 - 09:30</em></div></div><div class="week-cell"><div class="class-block coral-block"><strong>Statistika</strong><small>XII IPA 3</small><em>07:30 - 09:00</em></div></div><div class="week-cell"><span class="empty-slot">+ Tambah</span></div></div>
        <div class="weekly-row"><span class="time-slot">10:00</span><div class="week-cell"><div class="class-block orange-block"><strong>Matematika</strong><small>XI IPA 1</small><em>10:00 - 11:30</em></div></div><div class="week-cell"><span class="empty-slot">+ Tambah</span></div><div class="week-cell today-col"><div class="class-block purple-block"><strong>Matematika</strong><small>XI IPA 2</small><em>10:00 - 11:30</em></div></div><div class="week-cell"><div class="class-block teal-block"><strong>Matematika</strong><small>XII IPA 1</small><em>10:00 - 11:30</em></div></div><div class="week-cell"><div class="class-block blue-block"><strong>Remedial</strong><small>XI IPA 2</small><em>10:00 - 11:00</em></div></div></div>
        <div class="weekly-row"><span class="time-slot">13:00</span><div class="week-cell"><span class="empty-slot">+ Tambah</span></div><div class="week-cell"><div class="class-block coral-block"><strong>Statistika</strong><small>XII IPA 3</small><em>13:00 - 14:30</em></div></div><div class="week-cell today-col"><div class="class-block coral-block"><strong>Statistika</strong><small>XII IPA 3</small><em>13:00 - 14:30</em></div></div><div class="week-cell"><span class="empty-slot">+ Tambah</span></div><div class="week-cell"><div class="class-block orange-block"><strong>Wali Kelas</strong><small>XII IPA 1</small><em>13:00 - 14:00</em></div></div></div>
        <div class="weekly-row"><span class="time-slot">15:00</span><div class="week-cell"><span class="empty-slot">+ Tambah</span></div><div class="week-cell"><span class="empty-slot">+ Tambah</span></div><div class="week-cell today-col"><div class="class-block orange-block"><strong>Wali Kelas</strong><small>XII IPA 1</small><em>14:45 - 15:30</em></div></div><div class="week-cell"><span class="empty-slot">+ Tambah</span></div><div class="week-cell"><span class="empty-slot">+ Tambah</span></div></div>
      </div>
    </section>`;
}

function renderTeacherTasks() {
  const rows = [
    ["Persamaan Kuadrat", "XII IPA 1", "26/32", "Hari ini, 17:00", "Perlu dinilai", "teal"],
    ["Statistika Deskriptif", "XI IPA 2", "18/30", "Besok, 12:00", "Aktif", "purple"],
    ["Refleksi Proyek Akhir", "XII IPA 3", "21/28", "Besok, 15:30", "Aktif", "coral"],
    ["Latihan Limit Fungsi", "XII IPA 1", "32/32", "Selesai", "Selesai", "blue"],
  ];
  return `${pageIntro("Ruang belajar", "Tugas & Pengumpulan", "Pantau tugas, periksa jawaban, dan kirim umpan balik ke kelasmu.", actionButton("Buat tugas", "plus", "primary-button", `data-open-task-modal="true"`))}
    <section class="metric-grid compact-metrics">${statCard("Tugas aktif", "8 tugas", "3 perlu perhatian", "teal", "+2 minggu ini")} ${statCard("Menunggu dinilai", "9 jawaban", "Dari 3 kelas", "purple", "Hari ini")} ${statCard("Tingkat selesai", "94%", "Naik 6% bulan ini", "coral", "+6.2%")}</section>
    <section class="panel table-panel"><div class="table-toolbar"><div class="filter-tabs"><button class="filter-tab active" type="button" data-tab="Semua tugas">Semua tugas <span>8</span></button><button class="filter-tab" type="button" data-tab="Perlu dinilai">Perlu dinilai <span>3</span></button><button class="filter-tab" type="button" data-tab="Selesai">Selesai <span>4</span></button></div><button class="select-control" type="button">Terbaru ${icon("chevron")}</button></div><div class="table-scroll"><table class="app-table"><thead><tr><th>Tugas</th><th>Kelas</th><th>Pengumpulan</th><th>Tenggat</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(([title, className, submissions, due, status, tone]) => `<tr><td><div class="table-primary"><span class="table-icon ${tone}-soft">${icon(tone === "purple" ? "chart" : "file")}</span><div><strong>${title}</strong><small>Matematika</small></div></div></td><td>${className}</td><td><strong>${submissions}</strong> <small class="muted-text">terkumpul</small><div class="table-progress"><span class="${tone}-fill" style="width:${submissions === "32/32" ? "100" : submissions === "26/32" ? "81" : submissions === "18/30" ? "60" : "75"}%"></span></div></td><td>${due}</td><td><span class="status-pill ${status === "Perlu dinilai" ? "current-pill" : status === "Selesai" ? "done-pill" : "upcoming-pill"}">${status}</span></td><td><button class="row-arrow" type="button" data-route="task-detail" aria-label="Buka ${title}">${icon("arrow")}</button></td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderTeacherGrades() {
  const students = [["Alya Putri", "94", "92", "93", "A"], ["Bagas Pratama", "86", "88", "87", "B+"], ["Citra Lestari", "91", "95", "93", "A"], ["Dimas Saputra", "78", "84", "81", "B"], ["Fajar Ahmad", "88", "90", "89", "B+"]];
  return `${pageIntro("Akademik", "Input Nilai", "Catat nilai tugas dan ulangan, lalu lihat rekap kelas secara menyeluruh.", `${actionButton("Unduh nilai", "download", "secondary-button", `data-toast="File nilai akan diunduh saat database sudah terhubung."`)}${actionButton("Catat nilai", "plus", "primary-button", `data-toast="Form nilai baru akan segera tersedia."`)}`)}
    <div class="page-toolbar"><div class="toolbar-group"><button class="select-control" type="button">XII IPA 1 ${icon("chevron")}</button><button class="select-control" type="button">Matematika ${icon("chevron")}</button></div><span class="toolbar-hint">Semester Ganjil 2026/2027</span></div>
    <section class="metric-grid compact-metrics"><article class="metric-card metric-teal"><p class="metric-label">Rata-rata kelas</p><p class="metric-number">86.4 <span>/ 100</span></p><div class="metric-footer"><span class="mini-dot dot-orange"></span>Naik dari bulan lalu</div></article><article class="metric-card metric-purple"><p class="metric-label">Nilai tertinggi</p><p class="metric-number">98 <span>poin</span></p><div class="metric-footer"><span class="mini-dot dot-purple"></span>Alya Putri</div></article><article class="metric-card metric-coral"><p class="metric-label">Belum lengkap</p><p class="metric-number">4 <span>siswa</span></p><div class="metric-footer"><span class="mini-dot dot-coral"></span>Perlu ditindaklanjuti</div></article></section>
    <section class="panel table-panel"><div class="table-toolbar"><div><p class="section-kicker">Rekap nilai</p><h2>Nilai siswa XII IPA 1</h2></div><div class="filter-tabs"><button class="filter-tab active" type="button" data-tab="Semua nilai">Semua nilai</button><button class="filter-tab" type="button" data-tab="Tugas">Tugas</button><button class="filter-tab" type="button" data-tab="Ulangan">Ulangan</button></div></div><div class="table-scroll"><table class="app-table grade-table"><thead><tr><th>Nama siswa</th><th>Persamaan Kuadrat</th><th>Statistika</th><th>Rata-rata</th><th>Predikat</th><th></th></tr></thead><tbody>${students.map(([name, first, second, average, grade]) => `<tr><td><div class="table-primary"><span class="avatar avatar-small avatar-blue">${name.split(" ").map((part) => part[0]).join("")}</span><strong>${name}</strong></div></td><td>${first}</td><td>${second}</td><td><strong>${average}</strong></td><td><span class="grade-badge">${grade}</span></td><td><button class="row-arrow" type="button" data-toast="Editor nilai ${name} akan segera tersedia." aria-label="Edit nilai ${name}">${icon("arrow")}</button></td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderTeacherUsers() {
  const users = [["Alya Putri", "Murid", "XII IPA 1", "Aktif", "AP"], ["Bagas Pratama", "Murid", "XII IPA 1", "Aktif", "BP"], ["Citra Lestari", "Murid", "XII IPA 2", "Aktif", "CL"], ["Dewi Kartika", "Guru", "Matematika", "Aktif", "DK"], ["Fajar Nugroho", "Guru", "Fisika", "Menunggu", "FN"]];
  return `${pageIntro("Kelola sekolah", "Pengguna & Kelas", "Kelola akun, pembagian kelas, dan jumlah pengguna aktif sekolah.", `${actionButton("Lihat kelas XII IPA 1", "users", "secondary-button", `data-route="class-detail"`)}${actionButton("Impor dari Excel", "download", "secondary-button", `data-toast="Fitur impor Excel akan segera tersedia."`)}${actionButton("Tambah pengguna", "plus", "primary-button", `data-toast="Form pengguna baru akan segera tersedia."`)}`)}
    <section class="metric-grid compact-metrics"><article class="metric-card metric-teal"><p class="metric-label">Total murid</p><p class="metric-number">284 <span>siswa</span></p><div class="metric-footer"><span class="mini-dot dot-orange"></span>6 kelas aktif</div></article><article class="metric-card metric-purple"><p class="metric-label">Total guru</p><p class="metric-number">24 <span>guru</span></p><div class="metric-footer"><span class="mini-dot dot-purple"></span>18 guru aktif mengajar</div></article><article class="metric-card metric-coral"><p class="metric-label">Kelas terdaftar</p><p class="metric-number">12 <span>kelas</span></p><div class="metric-footer"><span class="mini-dot dot-coral"></span>Semester Ganjil</div></article></section>
    <section class="panel table-panel"><div class="table-toolbar"><div class="filter-tabs"><button class="filter-tab active" type="button" data-tab="Semua pengguna">Semua pengguna <span>308</span></button><button class="filter-tab" type="button" data-tab="Murid">Murid <span>284</span></button><button class="filter-tab" type="button" data-tab="Guru">Guru <span>24</span></button><button class="filter-tab" type="button" data-tab="Kelas">Kelas <span>12</span></button></div><button class="select-control" type="button">Terbaru ${icon("chevron")}</button></div><div class="table-scroll"><table class="app-table"><thead><tr><th>Nama</th><th>Peran</th><th>Kelas / Mata pelajaran</th><th>Status</th><th></th></tr></thead><tbody>${users.map(([name, role, group, status, initials]) => `<tr><td><div class="table-primary"><span class="avatar avatar-small ${role === "Guru" ? "avatar-rust" : "avatar-blue"}">${initials}</span><strong>${name}</strong></div></td><td>${role}</td><td>${group}</td><td><span class="status-pill ${status === "Aktif" ? "done-pill" : "upcoming-pill"}">${status}</span></td><td>${role === "Murid" ? `<button class="row-arrow" type="button" data-route="student-detail" aria-label="Buka ${name}">${icon("arrow")}</button>` : `<button class="row-arrow" type="button" data-toast="Profil ${name} akan segera tersedia." aria-label="Buka ${name}">${icon("arrow")}</button>`}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderTeacherAnnouncements() {
  return `${pageIntro("Komunikasi", "Pengumuman", "Bagikan informasi penting agar semua warga sekolah tetap terhubung.", actionButton("Buat pengumuman", "plus", "primary-button", `data-toast="Editor pengumuman akan segera tersedia."`))}
    <div class="announcement-layout"><section class="panel announcement-feed"><div class="panel-header"><div><p class="section-kicker">Terbaru</p><h2>Pengumuman sekolah</h2></div><button class="select-control" type="button">Semua kategori ${icon("chevron")}</button></div><article class="announcement-card large" data-route="announcement-detail"><div class="announcement-card-art"><span class="art-sun"></span><span class="art-cloud cloud-one"></span><span class="art-hill hill-front"></span><span class="art-building"><i></i><i></i><i></i><i></i></span></div><div class="announcement-card-body"><span class="announcement-tag">Info sekolah</span><h3>Rapat guru bulanan</h3><p>Rapat koordinasi akan dilaksanakan Jumat, 14 Agustus pukul 15:30 di aula utama. Mohon seluruh guru hadir tepat waktu.</p><div class="announcement-meta"><span class="avatar avatar-small avatar-rust">AR</span><span>Andi Ramadhan</span><span class="meta-separator"></span><span>2 jam lalu</span></div></div></article><article class="simple-announcement"><span class="simple-announcement-icon">${icon("calendar")}</span><div><span class="announcement-tag">Kalender</span><h3>Pembaruan kalender akademik</h3><p>Perubahan jadwal penilaian tengah semester sudah diperbarui.</p><small>Admin sekolah <i></i> kemarin</small></div><button class="row-arrow" type="button" data-route="announcement-detail">${icon("arrow")}</button></article><article class="simple-announcement"><span class="simple-announcement-icon purple-soft">${icon("megaphone")}</span><div><span class="announcement-tag purple-tag">Pelatihan</span><h3>Pelatihan platform KelasHub</h3><p>Sesi pelatihan untuk guru baru tersedia pada Senin depan.</p><small>Tim KelasHub <i></i> 2 hari lalu</small></div><button class="row-arrow" type="button" data-route="announcement-detail">${icon("arrow")}</button></article></section><aside class="panel compose-card"><div class="compose-accent"></div><p class="section-kicker">Akses cepat</p><h2>Bagikan kabar<br />ke sekolah.</h2><p>Tulis pengumuman singkat untuk guru, murid, atau seluruh sekolah.</p>${actionButton("Tulis pengumuman", "plus", "light-button", `data-toast="Editor pengumuman akan segera tersedia."`)}<div class="compose-note"><span class="pulse-dot"></span>Terakhir dikirim 2 jam lalu</div></aside></div>`;
}

function renderTeacherSubscription() {
  return `${pageIntro("Administrasi", "Kelola Langganan", "Pilih paket sesuai jumlah murid dan pantau status pembayaran sekolah.", `${actionButton("Lihat semua paket", "arrow", "secondary-button", `data-route="pricing"`)}${actionButton("Riwayat pembayaran", "file", "secondary-button", `data-toast="Riwayat pembayaran akan segera tersedia."`)}`)}
    <section class="subscription-banner"><div><p class="section-kicker">Paket saat ini</p><h2>Growth <span>aktif</span></h2><p>Berakhir pada 31 Desember 2026. Semua fitur utama dapat digunakan.</p></div><div class="subscription-price"><small>Rp</small><strong>1.250.000</strong><span>/ bulan</span></div></section>
    <div class="subscription-layout"><section class="panel usage-panel"><div class="panel-header"><div><p class="section-kicker">Penggunaan bulan ini</p><h2>Kuota sekolah</h2></div><span class="status-pill current-pill">Pembayaran aktif</span></div><div class="usage-stat"><div><strong>284</strong><span>murid aktif</span></div><div><strong>24</strong><span>guru aktif</span></div><div><strong>12</strong><span>kelas</span></div></div><div class="usage-bar"><div class="usage-bar-label"><span>Kapasitas murid</span><strong>284 / 500</strong></div><div class="thin-progress"><span style="width:57%"></span></div></div><div class="usage-bar"><div class="usage-bar-label"><span>Kapasitas penyimpanan</span><strong>6.4 GB / 20 GB</strong></div><div class="thin-progress blue-thin"><span style="width:32%"></span></div></div><div class="payment-note"><span class="mayar-logo">M</span><p>Pembayaran aman diproses melalui <strong>Mayar.id</strong>.</p></div></section><section class="panel plan-panel"><p class="section-kicker">Naik atau turunkan paket</p><h2>Paket untuk kebutuhanmu</h2><div class="plan-list"><article class="plan-card"><div><strong>Starter</strong><span>Hingga 100 murid</span></div><b>Rp 450rb<span>/bln</span></b><button class="outline-small" type="button" data-toast="Paket Starter akan tersedia setelah integrasi pembayaran.">Pilih</button></article><article class="plan-card selected"><div><strong>Growth</strong><span>Hingga 500 murid</span></div><b>Rp 1,25jt<span>/bln</span></b><button class="outline-small" type="button">Aktif</button></article><article class="plan-card"><div><strong>Scale</strong><span>Murid tidak terbatas</span></div><b>Custom</b><button class="outline-small" type="button" data-toast="Tim kami akan menghubungi sekolah untuk paket Scale.">Hubungi</button></article></div></section></div>`;
}

function renderTeacherSettings() {
  return `${pageIntro("Administrasi", "Pengaturan Sekolah", "Perbarui identitas sekolah dan atur preferensi ruang kerja.", actionButton("Simpan perubahan", "file", "primary-button", `data-toast="Perubahan berhasil disimpan sebagai draft."`))}
    <div class="settings-layout"><aside class="panel settings-menu"><button class="settings-link active" type="button" data-tab="Profil sekolah">${icon("school")}Profil sekolah</button><button class="settings-link" type="button" data-tab="Preferensi notifikasi">${icon("bell")}Preferensi notifikasi</button><button class="settings-link" type="button" data-tab="Keamanan">${icon("settings")}Keamanan</button><button class="settings-link" type="button" data-tab="Integrasi">${icon("grid")}Integrasi</button></aside><section class="panel settings-form"><div class="settings-form-header"><div><p class="section-kicker">Profil sekolah</p><h2>Informasi umum</h2></div><span class="saved-label"><span class="status-dot"></span>Autosave aktif</span></div><div class="school-profile-preview"><div class="school-logo large-logo">S5</div><div><strong>Logo sekolah</strong><span>PNG atau JPG, maksimum 2 MB.</span></div><button class="outline-small" type="button" data-toast="Pemilih logo akan segera tersedia.">Ganti logo</button></div><div class="form-grid"><label class="form-field"><span>Nama sekolah</span><input value="SMA Negeri 5 Bandung" /></label><label class="form-field"><span>Kode sekolah</span><input value="SMAN5BDG" /></label><label class="form-field full-field"><span>Alamat sekolah</span><input value="Jl. Belitung No. 8, Bandung, Jawa Barat" /></label><label class="form-field"><span>Email admin</span><input value="admin@sman5bdg.sch.id" /></label><label class="form-field"><span>Nomor telepon</span><input value="022 420 1234" /></label></div><div class="settings-divider"></div><div class="settings-form-footer"><p>Perubahan terakhir oleh <strong>Andi Ramadhan</strong> 2 jam lalu.</p>${actionButton("Simpan perubahan", "file", "primary-button", `data-toast="Perubahan berhasil disimpan sebagai draft."`)}</div></section></div>`;
}

function renderStudentHome() {
  return `${pageIntro("Kamis, 13 Agustus 2026", "Selamat pagi, <span>Raka.</span>", "Siap belajar? Ini yang perlu kamu selesaikan hari ini.", actionButton("Lihat jadwal", "calendar", "secondary-button", `data-route="schedule" data-label="Jadwal Pelajaran"`))}
    <section class="student-hero"><div><p class="focus-kicker"><span></span>Perjalanan belajarmu</p><h2>Tetap satu langkah<br />di depan.</h2><p>Kamu sudah menyelesaikan 82% tugas minggu ini. Sedikit lagi menuju targetmu.</p><div class="student-hero-progress"><div><span>Minggu ke-3</span><strong>82%</strong></div><div class="student-progress-track"><span style="width:82%"></span></div></div></div><div class="student-hero-art"><div class="student-medal">82<small>%</small></div><span class="art-star star-one">+</span><span class="art-star star-two">+</span><div class="student-book">${icon("file")}</div></div></section>
    <section class="metric-grid student-metrics"><article class="metric-card metric-teal"><div class="metric-topline"><span class="metric-icon">${icon("file")}</span><span class="metric-trend positive">3 <span>mendesak</span></span></div><p class="metric-label">Tugas belum selesai</p><p class="metric-number">5 <span>tugas</span></p><div class="metric-footer"><span class="mini-dot dot-orange"></span>1 jatuh tempo hari ini</div></article><article class="metric-card metric-purple"><div class="metric-topline"><span class="metric-icon">${icon("chart")}</span><span class="metric-trend positive">+2.4% <span>bulan ini</span></span></div><p class="metric-label">Rata-rata nilaimu</p><p class="metric-number">88.6 <span>/ 100</span></p><div class="metric-footer"><span class="mini-dot dot-purple"></span>Di atas rata-rata kelas</div></article><article class="metric-card metric-coral"><div class="metric-topline"><span class="metric-icon">${icon("calendar")}</span><span class="metric-trend neutral">Hari ini</span></div><p class="metric-label">Jadwal belajar</p><p class="metric-number">4 <span>pelajaran</span></p><div class="metric-footer"><span class="mini-dot dot-coral"></span>08:00 - 15:30 WIB</div></article></section>
    <div class="student-content-grid"><section class="panel student-schedule"><div class="panel-header"><div><p class="section-kicker">Jadwal hari ini</p><h2>Agenda belajarmu</h2></div><button class="text-button" type="button" data-route="schedule" data-label="Jadwal Pelajaran">Lihat semua ${icon("arrow")}</button></div><div class="student-agenda"><article class="student-agenda-row current"><div class="student-time"><strong>08:00</strong><span>09:30</span></div><div><div class="schedule-title-row"><strong>Matematika</strong><span class="status-pill current-pill">Sedang berlangsung</span></div><h3>XI IPA 2</h3><p>${icon("school")}Ruang 201 <span class="detail-separator"></span>Bu Nabila</p></div></article><article class="student-agenda-row"><div class="student-time"><strong>10:00</strong><span>11:30</span></div><div><div class="schedule-title-row"><strong>Fisika</strong></div><h3>XI IPA 2</h3><p>${icon("school")}Lab Fisika <span class="detail-separator"></span>Pak Dedi</p></div></article><article class="student-agenda-row"><div class="student-time"><strong>13:00</strong><span>14:30</span></div><div><div class="schedule-title-row"><strong>Bahasa Indonesia</strong></div><h3>XI IPA 2</h3><p>${icon("school")}Ruang 105 <span class="detail-separator"></span>Bu Sari</p></div></article></div></section><section class="panel student-task-panel"><div class="panel-header"><div><p class="section-kicker">Perlu dikerjakan</p><h2>Tugas terdekat</h2></div><button class="round-arrow" type="button" data-route="tasks" data-label="Tugas Saya" aria-label="Lihat tugas">${icon("arrow")}</button></div><div class="student-task-list"><article class="student-task-item"><span class="assignment-icon assignment-teal">${icon("file")}</span><div><strong>Persamaan Kuadrat</strong><span>Matematika <i></i> Hari ini, 17:00</span></div><span class="task-priority">Penting</span></article><article class="student-task-item"><span class="assignment-icon assignment-purple">${icon("chart")}</span><div><strong>Rangkuman Gerak Parabola</strong><span>Fisika <i></i> Besok, 12:00</span></div><span class="task-priority tomorrow-priority">Besok</span></article><article class="student-task-item"><span class="assignment-icon assignment-coral">${icon("school")}</span><div><strong>Refleksi Proyek Akhir</strong><span>Wali kelas <i></i> Jumat, 15:30</span></div><span class="task-priority tomorrow-priority">Jumat</span></article></div></section></div>
    <section class="panel student-announcement-strip"><div class="announcement-strip-icon">${icon("megaphone")}</div><div><p class="section-kicker">Pengumuman sekolah</p><strong>Rapat orang tua murid akan dilaksanakan Sabtu, 16 Agustus.</strong><span>2 jam lalu oleh Admin sekolah</span></div><button class="text-button" type="button" data-route="announcements" data-label="Pengumuman">Baca ${icon("arrow")}</button></section>`;
}

function renderStudentSchedule() {
  return `${pageIntro("Akademik", "Jadwal Pelajaran", "Lihat semua agenda kelas dan persiapkan pelajaranmu.", actionButton("Hari ini", "calendar", "secondary-button", `data-toast="Kamu sedang melihat jadwal hari ini."`))}
    <div class="page-toolbar"><div class="toolbar-group"><button class="select-control" type="button">XI IPA 2 ${icon("chevron")}</button><button class="outline-icon-button" type="button" data-toast="Minggu sebelumnya akan segera tersedia.">${icon("arrow")}</button><strong class="toolbar-date">11 - 16 Agustus 2026</strong><button class="outline-icon-button" type="button" data-toast="Minggu berikutnya akan segera tersedia.">${icon("arrow")}</button></div><span class="soft-status"><span class="status-dot"></span>Jadwal terbaru</span></div>
    <section class="panel schedule-board student-schedule-board"><div class="panel-header"><div><p class="section-kicker">Kelas XI IPA 2</p><h2>Jadwal mingguan</h2></div><span class="room-note">Wali kelas: Bu Nabila Rahma</span></div><div class="weekly-grid"><div class="weekly-head"><span>Jam</span><strong>Senin <small>11</small></strong><strong>Selasa <small>12</small></strong><strong class="today-col">Rabu <small>13</small></strong><strong>Kamis <small>14</small></strong><strong>Jumat <small>15</small></strong></div><div class="weekly-row"><span class="time-slot">07:00</span><div class="week-cell"><div class="class-block blue-block"><strong>Bahasa Inggris</strong><small>Bu Rina</small><em>07:30 - 09:00</em></div></div><div class="week-cell"><div class="class-block orange-block"><strong>Kimia</strong><small>Pak Arif</small><em>07:30 - 09:00</em></div></div><div class="week-cell today-col"><div class="class-block teal-block"><strong>Matematika</strong><small>Bu Nabila</small><em>08:00 - 09:30</em></div></div><div class="week-cell"><div class="class-block purple-block"><strong>Sejarah</strong><small>Bu Maya</small><em>07:30 - 09:00</em></div></div><div class="week-cell"><div class="class-block coral-block"><strong>Agama</strong><small>Pak Yudi</small><em>07:30 - 09:00</em></div></div></div><div class="weekly-row"><span class="time-slot">10:00</span><div class="week-cell"><div class="class-block teal-block"><strong>Fisika</strong><small>Pak Dedi</small><em>10:00 - 11:30</em></div></div><div class="week-cell"><div class="class-block blue-block"><strong>Biologi</strong><small>Bu Tia</small><em>10:00 - 11:30</em></div></div><div class="week-cell today-col"><div class="class-block blue-block"><strong>Fisika</strong><small>Pak Dedi</small><em>10:00 - 11:30</em></div></div><div class="week-cell"><div class="class-block orange-block"><strong>Kimia</strong><small>Pak Arif</small><em>10:00 - 11:30</em></div></div><div class="week-cell"><div class="class-block teal-block"><strong>Matematika</strong><small>Bu Nabila</small><em>10:00 - 11:30</em></div></div></div><div class="weekly-row"><span class="time-slot">13:00</span><div class="week-cell"><div class="class-block purple-block"><strong>Seni Budaya</strong><small>Bu Wulan</small><em>13:00 - 14:30</em></div></div><div class="week-cell"><div class="class-block coral-block"><strong>Bahasa Indonesia</strong><small>Bu Sari</small><em>13:00 - 14:30</em></div></div><div class="week-cell today-col"><div class="class-block coral-block"><strong>Bahasa Indonesia</strong><small>Bu Sari</small><em>13:00 - 14:30</em></div></div><div class="week-cell"><div class="class-block purple-block"><strong>PPKN</strong><small>Pak Hendra</small><em>13:00 - 14:30</em></div></div><div class="week-cell"><div class="class-block orange-block"><strong>Proyek kelas</strong><small>Bu Nabila</small><em>13:00 - 14:30</em></div></div></div></div></section>`;
}

function renderStudentTasks() {
  const tasks = [["Persamaan Kuadrat", "Matematika", "Hari ini, 17:00", "Belum dikerjakan", "teal", "Belum mulai"], ["Rangkuman Gerak Parabola", "Fisika", "Besok, 12:00", "Sedang dikerjakan", "purple", "Lanjutkan"], ["Refleksi Proyek Akhir", "Wali kelas", "Jumat, 15:30", "Belum dikerjakan", "coral", "Mulai tugas"], ["Teks Eksplanasi", "Bahasa Indonesia", "Selesai 10 Agustus", "Sudah dikumpulkan", "blue", "Lihat nilai"]];
  return `${pageIntro("Ruang belajar", "Tugas Saya", "Jangan lewatkan tenggat. Kamu punya beberapa tugas yang perlu diselesaikan.", actionButton("Filter tugas", "file", "secondary-button", `data-toast="Filter tugas aktif akan segera tersedia."`))}
    <section class="metric-grid compact-metrics student-task-stats"><article class="metric-card metric-coral"><p class="metric-label">Belum dikerjakan</p><p class="metric-number">3 <span>tugas</span></p><div class="metric-footer"><span class="mini-dot dot-coral"></span>1 jatuh tempo hari ini</div></article><article class="metric-card metric-purple"><p class="metric-label">Sedang dikerjakan</p><p class="metric-number">2 <span>tugas</span></p><div class="metric-footer"><span class="mini-dot dot-purple"></span>Teruskan progresmu</div></article><article class="metric-card metric-teal"><p class="metric-label">Sudah selesai</p><p class="metric-number">18 <span>tugas</span></p><div class="metric-footer"><span class="mini-dot dot-orange"></span>82% minggu ini</div></article></section>
    <section class="student-task-cards">${tasks.map(([title, subject, due, status, tone, action]) => `<article class="panel student-assignment-card"><div class="assignment-card-top"><span class="assignment-icon assignment-${tone}">${icon(tone === "purple" ? "chart" : tone === "coral" ? "school" : "file")}</span><span class="status-pill ${status === "Sudah dikumpulkan" ? "done-pill" : status === "Sedang dikerjakan" ? "upcoming-pill" : "current-pill"}">${status}</span></div><h2>${title}</h2><p class="assignment-subject">${subject}</p><div class="assignment-due"><span>Tenggat</span><strong>${due}</strong></div><div class="assignment-card-footer"><span>${status === "Sudah dikumpulkan" ? "Nilai: 91" : "Belum ada pengumpulan"}</span><button class="primary-button small-button" type="button" data-route="task-detail">${action}${icon("arrow")}</button></div></article>`).join("")}</section>`;
}

function renderStudentGrades() {
  const grades = [["Matematika", "Bu Nabila", "93", "A", "teal"], ["Fisika", "Pak Dedi", "87", "B+", "blue"], ["Bahasa Indonesia", "Bu Sari", "91", "A-", "coral"], ["Kimia", "Pak Arif", "84", "B+", "purple"], ["Sejarah", "Bu Maya", "89", "B+", "orange"]];
  return `${pageIntro("Perkembangan", "Nilai Saya", "Pantau progres belajar dan lihat umpan balik dari guru.", actionButton("Unduh rapor", "download", "secondary-button", `data-toast="Rapor akan tersedia setelah semester selesai."`))}
    <section class="grade-overview"><div class="grade-ring"><strong>88.6</strong><span>rata-rata</span></div><div class="grade-overview-copy"><p class="section-kicker">Semester Ganjil 2026/2027</p><h2>Performa belajarmu stabil.</h2><p>Nilaimu berada di atas rata-rata kelas. Pertahankan konsistensi pada tugas dan ulangan berikutnya.</p><div class="grade-legend"><span><i class="legend-teal"></i>Nilai tugas</span><span><i class="legend-purple"></i>Nilai ulangan</span></div></div><div class="grade-mini-stat"><strong>+2.4%</strong><span>dibanding bulan lalu</span></div></section>
    <section class="panel table-panel"><div class="panel-header"><div><p class="section-kicker">Rekap mata pelajaran</p><h2>Nilai terbaru</h2></div><span class="soft-status"><span class="status-dot"></span>Diperbarui hari ini</span></div><div class="table-scroll"><table class="app-table student-grade-table"><thead><tr><th>Mata pelajaran</th><th>Guru</th><th>Nilai</th><th>Predikat</th><th>Tren</th><th></th></tr></thead><tbody>${grades.map(([subject, teacher, grade, letter, tone]) => `<tr><td><div class="table-primary"><span class="table-icon ${tone}-soft">${icon("chart")}</span><strong>${subject}</strong></div></td><td>${teacher}</td><td><strong class="large-grade">${grade}</strong></td><td><span class="grade-badge">${letter}</span></td><td><span class="trend-up">Naik</span></td><td><button class="row-arrow" type="button" data-toast="Detail nilai ${subject} akan segera tersedia." aria-label="Buka nilai ${subject}">${icon("arrow")}</button></td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderStudentAnnouncements() {
  return `${pageIntro("Informasi sekolah", "Pengumuman", "Ikuti kabar terbaru dari sekolah dan jangan lewatkan informasi penting.", `${actionButton("Tandai semua dibaca", "file", "secondary-button", `data-toast="Semua pengumuman ditandai sudah dibaca."`)}${actionButton("Buka pengumuman utama", "arrow", "secondary-button", `data-route="announcement-detail"`)}`)}
    <div class="student-news-grid"><section class="panel news-list"><div class="panel-header"><div><p class="section-kicker">Terbaru</p><h2>Untuk kamu</h2></div><span class="unread-count">2 belum dibaca</span></div><article class="news-item unread"><span class="news-icon news-coral">${icon("megaphone")}</span><div><span class="announcement-tag">Sekolah</span><h3>Rapat orang tua murid</h3><p>Rapat orang tua murid akan dilaksanakan Sabtu, 16 Agustus pukul 09:00 di aula utama.</p><small>Admin sekolah <i></i>2 jam lalu</small></div><span class="unread-dot"></span></article><article class="news-item unread"><span class="news-icon news-purple">${icon("calendar")}</span><div><span class="announcement-tag purple-tag">Akademik</span><h3>Pembaruan kalender akademik</h3><p>Jadwal penilaian tengah semester sudah diperbarui. Silakan cek kalender kelas.</p><small>Admin sekolah <i></i>kemarin</small></div><span class="unread-dot"></span></article><article class="news-item"><span class="news-icon news-teal">${icon("file")}</span><div><span class="announcement-tag teal-tag">KelasHub</span><h3>Pelatihan fitur baru</h3><p>Pelajari cara mengumpulkan tugas melalui panduan singkat KelasHub.</p><small>Tim KelasHub <i></i>2 hari lalu</small></div></article></section><aside class="panel news-calendar"><p class="section-kicker">Kalender sekolah</p><h2>Agustus 2026</h2><div class="mini-calendar"><div class="mini-calendar-days"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span></div><div class="mini-calendar-grid">${["", "", "", "", "", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"].map((day) => `<span class="${day === "13" ? "today-day" : day === "16" ? "event-day" : ""}">${day}</span>`).join("")}</div></div><div class="calendar-events"><div><span class="event-dot coral-event"></span><p><strong>16 Agustus</strong><span>Rapat orang tua</span></p></div><div><span class="event-dot purple-event"></span><p><strong>21 Agustus</strong><span>Penilaian tengah semester</span></p></div></div></aside></div>`;
}

function renderPricing() {
  const plans = [
    ["Starter", "Untuk sekolah kecil yang mulai beralih dari Excel.", "100", "450rb", "Mulai dengan Starter", ""],
    ["Growth", "Semua yang dibutuhkan sekolah yang sedang berkembang.", "500", "1,25jt", "Paket saat ini", "featured-plan"],
    ["Scale", "Kapasitas fleksibel untuk sekolah dengan banyak kelas.", "Tak terbatas", "Custom", "Hubungi tim kami", ""],
  ];
  return `${pageIntro("Paket KelasHub", "Pricing yang tumbuh bersama sekolah.", "Pilih paket berdasarkan jumlah murid. Naikkan kapasitas kapan saja tanpa memindahkan data.", actionButton("Lihat langganan aktif", "file", "secondary-button", `data-route="subscription"`))}
    <div class="billing-toggle"><button class="active" type="button" data-tab="Bayar bulanan">Bayar bulanan</button><button type="button" data-tab="Bayar tahunan">Bayar tahunan <span>Hemat 20%</span></button></div>
    <section class="pricing-grid">${plans.map(([name, description, capacity, price, action, tone]) => `<article class="price-card ${tone}">${name === "Growth" ? `<span class="popular-label">Paling dipilih</span>` : ""}<p class="section-kicker">Paket ${name}</p><h2>${name}</h2><p class="price-description">${description}</p><div class="price-value">${price === "Custom" ? "Custom" : `<small>Rp</small>${price}`}<span>${price === "Custom" ? "Sesuai kebutuhan sekolah" : "/ bulan"}</span></div><div class="price-capacity"><span class="price-check">${icon("check")}</span><strong>Hingga ${capacity} murid</strong><small>Guru dan admin tidak dibatasi</small></div><ul class="price-features"><li>${icon("check")}Beranda aktivitas terpusat</li><li>${icon("check")}Jadwal dan tugas digital</li><li>${icon("check")}Input serta rekap nilai</li><li>${icon("check")}Impor data dari Excel</li><li>${icon("check")}Dukungan KelasHub</li></ul>${actionButton(action, name === "Growth" ? "check" : "arrow", name === "Growth" ? "secondary-button" : "primary-button", name === "Growth" ? `data-toast="Paket Growth sedang aktif."` : `data-toast="${name} akan diproses melalui Mayar.id."`)}</article>`).join("")}</section>
    <section class="panel pricing-note"><div class="pricing-note-icon">${icon("grid")}</div><div><p class="section-kicker">Tanpa biaya tersembunyi</p><h2>Semua data sekolah tetap milik sekolah.</h2><p>Billing dihitung berdasarkan murid aktif. Kamu bisa mengubah paket atau membatalkan kapan saja melalui dashboard.</p></div><button class="text-button" type="button" data-toast="Tim KelasHub siap membantu memilih paket.">Tanya tim kami ${icon("arrow")}</button></section>`;
}

function renderTaskDetail() {
  const isStudent = state.role === "student";
  if (isStudent) {
    return `${pageIntro("Tugas Saya", "Persamaan Kuadrat", "Matematika · XII IPA 1", `${actionButton("Kembali ke tugas", "arrow", "secondary-button", `data-route="tasks"`)}${actionButton("Kumpulkan jawaban", "file", "primary-button", `data-toast="Upload jawaban akan segera tersedia."`)}`)}
      <div class="detail-layout"><article class="panel detail-main"><div class="detail-heading"><div class="assignment-icon assignment-teal">${icon("file")}</div><div><span class="status-pill current-pill">Belum dikerjakan</span><h2>Latihan Persamaan Kuadrat</h2><p>Diposting oleh Bu Nabila Rahma · 12 Agustus 2026</p></div></div><div class="detail-divider"></div><div class="detail-copy"><p class="section-kicker">Instruksi tugas</p><p>Kerjakan latihan berikut untuk menguji pemahamanmu tentang akar-akar persamaan kuadrat. Tulis langkah pengerjaan dengan jelas pada lembar jawaban.</p><ol><li>Kerjakan soal nomor 1 sampai 5.</li><li>Gunakan metode pemfaktoran atau rumus ABC.</li><li>Unggah jawaban dalam format PDF.</li></ol></div><div class="resource-box"><div class="resource-icon">${icon("file")}</div><div><strong>Latihan Persamaan Kuadrat.pdf</strong><span>Materi pendukung · 1.2 MB</span></div><button class="row-arrow" type="button" data-toast="File materi akan diunduh saat storage aktif.">${icon("download")}</button></div></article><aside class="detail-side"><section class="panel deadline-card"><p class="section-kicker">Tenggat waktu</p><strong>Hari ini, 17:00</strong><span class="countdown-label">Kurang dari 8 jam</span><div class="countdown-bar"><span style="width:72%"></span></div><div class="detail-meta-list"><div><span>Kelas</span><strong>XII IPA 1</strong></div><div><span>Bobot nilai</span><strong>20 poin</strong></div><div><span>Format</span><strong>PDF, maks. 10 MB</strong></div></div></section><section class="panel upload-card"><div class="upload-icon">${icon("download")}</div><h2>Siap mengumpulkan?</h2><p>Pastikan nama dan kelas tercantum di dokumen jawabanmu.</p>${actionButton("Upload jawaban", "file", "primary-button", `data-toast="Upload jawaban akan segera tersedia."`)}</section></aside></div>`;
  }
  const submissions = [["Raka Pratama", "8 menit lalu", "Belum dinilai", "RP"], ["Sarah Nabila", "24 menit lalu", "Belum dinilai", "SN"], ["Fajar Ahmad", "1 jam lalu", "Sudah dinilai", "FA"], ["Alya Putri", "2 jam lalu", "Sudah dinilai", "AP"]];
  return `${pageIntro("Tugas & Pengumpulan", "Persamaan Kuadrat", "XII IPA 1 · Matematika", `${actionButton("Kembali ke tugas", "arrow", "secondary-button", `data-route="tasks"`)}${actionButton("Edit tugas", "settings", "secondary-button", `data-toast="Editor tugas akan segera tersedia."`)}${actionButton("Beri pengumuman", "megaphone", "primary-button", `data-toast="Editor pengumuman akan segera tersedia."`)}`)}
    <section class="detail-summary"><div class="detail-summary-main"><span class="status-pill current-pill">Aktif · Perlu dinilai</span><h2>Latihan Persamaan Kuadrat</h2><p>Diposting 12 Agustus 2026 oleh Nabila Rahma</p></div><div class="detail-summary-stats"><div><strong>26/32</strong><span>terkumpul</span></div><div><strong>20</strong><span>bobot nilai</span></div><div><strong>17:00</strong><span>hari ini</span></div></div></section>
    <div class="detail-layout"><section class="panel detail-main"><div class="panel-header"><div><p class="section-kicker">Instruksi tugas</p><h2>Materi dan arahan</h2></div><button class="text-button" type="button" data-toast="Lampiran akan diunduh saat storage aktif.">Unduh lampiran ${icon("download")}</button></div><div class="detail-copy"><p>Kerjakan latihan berikut untuk menguji pemahaman siswa tentang akar-akar persamaan kuadrat. Minta siswa menulis langkah pengerjaan dengan jelas.</p><div class="resource-box"><div class="resource-icon">${icon("file")}</div><div><strong>Latihan Persamaan Kuadrat.pdf</strong><span>Materi pendukung · 1.2 MB</span></div><button class="row-arrow" type="button" data-toast="File materi akan diunduh saat storage aktif.">${icon("download")}</button></div></div></section><section class="panel submissions-panel"><div class="panel-header"><div><p class="section-kicker">Daftar pengumpulan</p><h2>Jawaban siswa</h2></div><button class="select-control" type="button">Semua status ${icon("chevron")}</button></div><div class="submission-list">${submissions.map(([name, time, status, initials]) => `<article class="submission-row"><span class="avatar avatar-small avatar-blue">${initials}</span><div><strong>${name}</strong><span>${time}</span></div><span class="status-pill ${status === "Belum dinilai" ? "upcoming-pill" : "done-pill"}">${status}</span><button class="row-arrow" type="button" data-toast="Lembar jawaban ${name} akan segera tersedia." aria-label="Buka jawaban ${name}">${icon("arrow")}</button></article>`).join("")}</div></section></div>`;
}

function renderClassDetail() {
  return `${pageIntro("Pengguna & Kelas", "XII IPA 1", "Detail kelas, daftar murid, dan perkembangan belajar dalam satu tampilan.", `${actionButton("Kembali ke pengguna", "arrow", "secondary-button", `data-route="users"`)}${actionButton("Edit kelas", "settings", "primary-button", `data-toast="Editor kelas akan segera tersedia."`)}`)}
    <section class="class-detail-hero"><div class="class-symbol">XII</div><div><span class="class-level">Kelas unggulan</span><h2>XII IPA 1</h2><p>Wali kelas: Nabila Rahma · Ruang 203</p></div><div class="class-hero-stats"><div><strong>32</strong><span>murid</span></div><div><strong>86.4</strong><span>rata-rata</span></div><div><strong>94%</strong><span>kehadiran</span></div></div></section>
    <div class="class-detail-grid"><section class="panel roster-panel"><div class="table-toolbar"><div><p class="section-kicker">Daftar murid</p><h2>32 murid terdaftar</h2></div><div class="filter-tabs"><button class="filter-tab active" type="button" data-tab="Semua murid">Semua</button><button class="filter-tab" type="button" data-tab="Perlu perhatian">Perlu perhatian</button></div></div><div class="table-scroll"><table class="app-table"><thead><tr><th>Nama murid</th><th>Kehadiran</th><th>Rata-rata</th><th>Tugas</th><th></th></tr></thead><tbody>${[["Raka Pratama", "98%", "88.6", "5/6", "RP"], ["Sarah Nabila", "96%", "91.2", "6/6", "SN"], ["Fajar Ahmad", "90%", "79.4", "4/6", "FA"], ["Alya Putri", "100%", "93.0", "6/6", "AP"]].map(([name, attendance, average, tasks, initials]) => `<tr><td><div class="table-primary"><span class="avatar avatar-small avatar-blue">${initials}</span><strong>${name}</strong></div></td><td><span class="attendance-good">${attendance}</span></td><td><strong>${average}</strong></td><td>${tasks}</td><td><button class="row-arrow" type="button" data-route="student-detail" aria-label="Buka ${name}">${icon("arrow")}</button></td></tr>`).join("")}</tbody></table></div><button class="text-button roster-more" type="button" data-toast="Daftar murid lengkap akan tersedia setelah database aktif.">Lihat 28 murid lainnya ${icon("arrow")}</button></section><aside class="class-side-stack"><section class="panel class-subjects"><p class="section-kicker">Mata pelajaran</p><h2>Jadwal kelas</h2><div class="subject-list"><div><span class="subject-dot teal-subject"></span><strong>Matematika</strong><small>Bu Nabila · 4 jam/minggu</small></div><div><span class="subject-dot purple-subject"></span><strong>Fisika</strong><small>Pak Dedi · 3 jam/minggu</small></div><div><span class="subject-dot coral-subject"></span><strong>Bahasa Indonesia</strong><small>Bu Sari · 3 jam/minggu</small></div></div><button class="text-button" type="button" data-route="schedule">Lihat jadwal kelas ${icon("arrow")}</button></section><section class="panel class-progress"><p class="section-kicker">Performa kelas</p><h2>Target semester</h2><div class="class-progress-row"><span>Pengumpulan tugas</span><strong>94%</strong><div class="thin-progress"><span style="width:94%"></span></div></div><div class="class-progress-row"><span>Kehadiran</span><strong>96%</strong><div class="thin-progress blue-thin"><span style="width:96%"></span></div></div></section></aside></div>`;
}

function renderStudentDetail() {
  return `${pageIntro("Profil murid", "Alya Putri", "XII IPA 1 · Murid aktif", `${actionButton("Kembali ke kelas", "arrow", "secondary-button", `data-route="class-detail"`)}${actionButton("Kirim pesan", "megaphone", "primary-button", `data-toast="Fitur pesan akan segera tersedia."`)}`)}
    <section class="student-profile-card"><div class="profile-large-avatar avatar-blue">AP</div><div class="student-profile-main"><div class="profile-tags"><span class="status-pill done-pill">Aktif</span><span class="role-tag">Murid</span></div><h2>Alya Putri</h2><p>alyaputri@sman5bdg.sch.id · Bergabung sejak Juli 2024</p></div><div class="student-profile-actions"><button class="outline-small" type="button" data-toast="Editor profil murid akan segera tersedia.">${icon("settings")} Edit profil</button></div></section>
    <div class="student-detail-grid"><section class="panel"><div class="panel-header"><div><p class="section-kicker">Ringkasan belajar</p><h2>Perkembangan Alya</h2></div><span class="soft-status"><span class="status-dot"></span>Diperbarui hari ini</span></div><div class="student-kpi-grid"><div><strong>93.0</strong><span>rata-rata nilai</span><em>+4.2%</em></div><div><strong>100%</strong><span>kehadiran</span><em>Stabil</em></div><div><strong>6/6</strong><span>tugas selesai</span><em>Terbaik</em></div></div><div class="student-detail-chart"><div class="chart-labels"><span>Mat</span><span>Fis</span><span>Bio</span><span>Ind</span><span>Kim</span><span>Sej</span></div><div class="chart-bars"><i style="height:92%"></i><i style="height:86%"></i><i style="height:90%"></i><i style="height:96%"></i><i style="height:88%"></i><i style="height:91%"></i></div></div></section><section class="panel feedback-panel"><p class="section-kicker">Catatan wali kelas</p><h2>Perlu dipertahankan</h2><p>Alya konsisten mengumpulkan tugas tepat waktu dan aktif bertanya selama diskusi kelas.</p><div class="feedback-author"><span class="avatar avatar-small avatar-rust">NR</span><span>Bu Nabila Rahma<small>Wali kelas · 2 hari lalu</small></span></div></section></div>
    <section class="panel table-panel"><div class="panel-header"><div><p class="section-kicker">Nilai terbaru</p><h2>Rekap nilai Alya</h2></div><button class="text-button" type="button" data-route="grades">Lihat rekap kelas ${icon("arrow")}</button></div><div class="table-scroll"><table class="app-table"><thead><tr><th>Mata pelajaran</th><th>Tugas terakhir</th><th>Ulangan</th><th>Rata-rata</th><th>Predikat</th></tr></thead><tbody><tr><td>Matematika</td><td>94</td><td>92</td><td><strong>93</strong></td><td><span class="grade-badge">A</span></td></tr><tr><td>Fisika</td><td>86</td><td>90</td><td><strong>88</strong></td><td><span class="grade-badge">B+</span></td></tr><tr><td>Bahasa Indonesia</td><td>95</td><td>94</td><td><strong>94.5</strong></td><td><span class="grade-badge">A</span></td></tr></tbody></table></div></section>`;
}

function renderAnnouncementDetail() {
  return `${pageIntro("Pengumuman", "Rapat guru bulanan", "Info sekolah · Dipublikasikan 13 Agustus 2026", `${actionButton("Kembali ke pengumuman", "arrow", "secondary-button", `data-route="announcements"`)}${state.role === "teacher" ? actionButton("Edit pengumuman", "settings", "primary-button", `data-toast="Editor pengumuman akan segera tersedia."`) : ""}`)}
    <div class="announcement-detail-layout"><article class="panel announcement-detail-main"><span class="announcement-tag">Info sekolah</span><h2>Rapat guru bulanan</h2><div class="announcement-meta"><span class="avatar avatar-small avatar-rust">AR</span><span>Andi Ramadhan</span><span class="meta-separator"></span><span>13 Agustus 2026 · 2 jam lalu</span></div><div class="announcement-detail-art"><span class="art-sun"></span><span class="art-cloud cloud-one"></span><span class="art-hill hill-back"></span><span class="art-hill hill-front"></span><span class="art-building"><i></i><i></i><i></i><i></i></span></div><div class="detail-copy"><p>Rapat koordinasi guru akan dilaksanakan untuk membahas persiapan penilaian tengah semester dan evaluasi kegiatan belajar mengajar bulan ini.</p><p>Mohon seluruh guru hadir tepat waktu. Agenda rapat meliputi pembaruan kalender akademik, pembagian tugas pengawas, dan sesi berbagi praktik baik.</p><div class="announcement-callout"><span>${icon("calendar")}</span><div><strong>Jumat, 14 Agustus 2026</strong><small>15:30 WIB · Aula utama SMA Negeri 5 Bandung</small></div></div></div></article><aside class="panel related-panel"><p class="section-kicker">Pengumuman lain</p><h2>Perlu kamu tahu</h2><div class="related-list"><button type="button" data-route="announcement-detail"><span class="news-icon news-purple">${icon("calendar")}</span><span><strong>Pembaruan kalender akademik</strong><small>Kemarin</small></span>${icon("arrow")}</button><button type="button" data-route="announcement-detail"><span class="news-icon news-teal">${icon("file")}</span><span><strong>Pelatihan fitur baru</strong><small>2 hari lalu</small></span>${icon("arrow")}</button></div></aside></div>`;
}

function renderProfile() {
  const isStudent = state.role === "student";
  const name = isStudent ? "Raka Pratama" : "Nabila Rahma";
  const initials = isStudent ? "RP" : "NR";
  return `${pageIntro("Akun saya", name, isStudent ? "Murid · XI IPA 2" : "Guru Matematika · SMA Negeri 5 Bandung", actionButton("Edit profil", "settings", "primary-button", `data-toast="Editor profil akan segera tersedia."`))}
    <div class="profile-page-grid"><section class="panel profile-card-large"><div class="profile-large-avatar ${isStudent ? "avatar-blue" : "avatar-profile"}">${initials}</div><h2>${name}</h2><span class="role-tag">${isStudent ? "Murid" : "Guru"}</span><p>${isStudent ? "raka.pratama@sman5bdg.sch.id" : "nabila@sman5bdg.sch.id"}</p><div class="profile-details"><div><span>Sekolah</span><strong>SMA Negeri 5 Bandung</strong></div><div><span>${isStudent ? "Kelas" : "Mata pelajaran"}</span><strong>${isStudent ? "XI IPA 2" : "Matematika"}</strong></div><div><span>Bergabung sejak</span><strong>${isStudent ? "Juli 2025" : "Juni 2024"}</strong></div></div></section><section class="panel profile-settings-card"><div class="panel-header"><div><p class="section-kicker">Preferensi akun</p><h2>Pengaturan pribadi</h2></div></div><label class="toggle-row"><span><strong>Email notifikasi</strong><small>Terima ringkasan aktivitas harian.</small></span><input type="checkbox" checked /><i></i></label><label class="toggle-row"><span><strong>Pengingat tenggat</strong><small>Ingatkan saya sebelum tugas jatuh tempo.</small></span><input type="checkbox" checked /><i></i></label><label class="toggle-row"><span><strong>Mode kontras tinggi</strong><small>Gunakan warna yang lebih kontras.</small></span><input type="checkbox" /><i></i></label></section></div>`;
}

function renderAuth() {
  return `<section class="auth-page"><div class="auth-brand"><div class="brand-mark"><span class="brand-cube">+</span></div><p class="brand-name">kelas<span>hub</span></p></div><div class="auth-layout"><section class="auth-intro"><p class="focus-kicker"><span></span>Ruang belajar yang lebih rapi</p><h1>Semua sekolah<br />berawal dari<br /><span>satu tempat.</span></h1><p>Kelola jadwal, tugas, nilai, dan komunikasi sekolah tanpa berpindah-pindah spreadsheet.</p><div class="auth-proof"><span class="avatar avatar-small avatar-blue">AP</span><span class="avatar avatar-small avatar-yellow">SN</span><span class="avatar avatar-small avatar-green">FA</span><p><strong>308 pengguna</strong><small>belajar bersama di sekolah ini</small></p></div></section><section class="panel auth-card"><div class="auth-tabs"><button class="active" type="button" data-tab="Masuk">Masuk</button><button type="button" data-tab="Daftar sekolah">Daftar sekolah</button></div><p class="section-kicker">Selamat datang kembali</p><h2>Masuk ke KelasHub</h2><p class="auth-description">Gunakan email sekolah untuk melanjutkan.</p><label class="form-field"><span>Email sekolah</span><input type="email" placeholder="nama@sekolah.sch.id" /></label><label class="form-field"><span>Kata sandi</span><input type="password" placeholder="Masukkan kata sandi" /></label><div class="auth-options"><label><input type="checkbox" /> Ingat saya</label><button type="button" data-toast="Reset kata sandi akan segera tersedia.">Lupa kata sandi?</button></div><button class="primary-button auth-submit" type="button" data-toast="Login akan terhubung saat autentikasi aktif.">Masuk ${icon("arrow")}</button><p class="auth-footer">Belum punya akun sekolah? <button type="button" data-tab="Daftar sekolah">Daftar sekarang</button></p></section></div></section>`;
}

function renderPage() {
  const isTeacherHome = state.role === "teacher" && state.view === "home";
  homePage.hidden = !isTeacherHome;
  dynamicPage.hidden = isTeacherHome;
  dynamicPage.innerHTML = isTeacherHome ? "" : state.role === "teacher" ? renderTeacherPage(state.view) : renderStudentPage(state.view);
  breadcrumbPage.textContent = state.view === "home" ? "Beranda" : getPageLabel(state.view);
  document.title = `${getPageLabel(state.view)} | KelasHub`;
  markActiveNav();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getPageLabel(view) {
  const labels = { home: "Beranda", schedule: "Jadwal Pelajaran", tasks: state.role === "student" ? "Tugas Saya" : "Tugas & Pengumpulan", grades: state.role === "student" ? "Nilai Saya" : "Input Nilai", users: "Pengguna & Kelas", announcements: "Pengumuman", subscription: "Kelola Langganan", pricing: "Pricing", settings: "Pengaturan Sekolah", "task-detail": "Detail Tugas", "class-detail": "Detail Kelas", "student-detail": "Detail Murid", "announcement-detail": "Detail Pengumuman", profile: "Profil Saya", auth: "Masuk / Daftar" };
  return labels[view] || "Beranda";
}

function renderTeacherPage(view) {
  return { schedule: renderTeacherSchedule, tasks: renderTeacherTasks, grades: renderTeacherGrades, users: renderTeacherUsers, announcements: renderTeacherAnnouncements, subscription: renderTeacherSubscription, pricing: renderPricing, settings: renderTeacherSettings, "task-detail": renderTaskDetail, "class-detail": renderClassDetail, "student-detail": renderStudentDetail, "announcement-detail": renderAnnouncementDetail, profile: renderProfile, auth: renderAuth }[view]?.() || "";
}

function renderStudentPage(view) {
  return { home: renderStudentHome, schedule: renderStudentSchedule, tasks: renderStudentTasks, grades: renderStudentGrades, announcements: renderStudentAnnouncements, "task-detail": renderTaskDetail, "announcement-detail": renderAnnouncementDetail, profile: renderProfile, auth: renderAuth }[view]?.() || renderStudentHome();
}

function setRole(role, announce = true) {
  state.role = role;
  state.view = "home";
  sidebarNav.innerHTML = role === "student" ? studentNavigation() : teacherNavigation();
  updateProfile();
  renderPage();
  if (announce) showToast(role === "student" ? "Mode Murid aktif. Selamat belajar, Raka." : "Mode Guru aktif. Selamat datang kembali, Nabila.");
}

function navigate(view) {
  state.view = view;
  renderPage();
  toggleProfile(false);
  toggleSidebar(false);
}

document.querySelector("#open-sidebar").addEventListener("click", () => toggleSidebar(true));
document.querySelector("#close-sidebar").addEventListener("click", () => toggleSidebar(false));
sidebarOverlay.addEventListener("click", () => toggleSidebar(false));
roleSwitcher.addEventListener("click", () => setRole(state.role === "teacher" ? "student" : "teacher"));
profileRoleToggle.addEventListener("click", () => {
  toggleProfile(false);
  setRole(state.role === "teacher" ? "student" : "teacher");
});

profileToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleProfile();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".profile-wrap")) toggleProfile(false);

  const nav = event.target.closest(".nav-item");
  if (nav && sidebarNav.contains(nav)) {
    event.preventDefault();
    navigate(nav.dataset.view);
    return;
  }

  const route = event.target.closest("[data-route]");
  if (route) {
    event.preventDefault();
    navigate(route.dataset.route);
    return;
  }

  const tab = event.target.closest("[data-tab]");
  if (tab) {
    tab.parentElement?.querySelectorAll("[data-tab]").forEach((element) => element.classList.remove("active"));
    tab.classList.add("active");
    showToast(`${tab.dataset.tab} dipilih.`);
    return;
  }

  const scrollTarget = event.target.closest("[data-scroll-target]");
  if (scrollTarget) document.querySelector(`#${scrollTarget.dataset.scrollTarget}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const openTask = event.target.closest("#open-task-modal, [data-open-task-modal]");
  if (openTask) toggleModal(true);

  const toastTarget = event.target.closest("[data-toast]");
  if (toastTarget) showToast(toastTarget.dataset.toast);
});

document.querySelector("#close-task-modal").addEventListener("click", () => toggleModal(false));
document.querySelector("#cancel-task-modal").addEventListener("click", () => toggleModal(false));
modal.addEventListener("click", (event) => { if (event.target === modal) toggleModal(false); });

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = new FormData(taskForm).get("title");
  toggleModal(false);
  taskForm.reset();
  showToast(`Tugas "${title}" berhasil disimpan sebagai draft.`);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  toggleProfile(false);
  toggleSidebar(false);
  if (!modal.hasAttribute("hidden")) toggleModal(false);
});

setRole("teacher", false);
