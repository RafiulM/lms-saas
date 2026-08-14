"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Icon, PageIntro } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { announcements as mockAnnouncements } from "@/lib/data";
import { createAnnouncement, deleteAnnouncement, listAnnouncements } from "@/lib/actions/announcements";
import { formatTimeAgo, initialsOf } from "@/lib/adapters";
import type { Announcement } from "@/lib/types";

type LiveItem = {
  id: string;
  tag: string;
  tagTone: string;
  icon: string;
  title: string;
  body: string;
  calloutTitle: string | null;
  calloutDetail: string | null;
  createdAt: Date;
  author: string;
};

function toAnnouncement(item: LiveItem): Announcement {
  return {
    id: item.id,
    tag: item.tag,
    tagTone: item.tagTone === "purple" ? "purple" : item.tagTone === "teal" ? "teal" : "default",
    title: item.title,
    body: item.body,
    author: item.author,
    authorInitials: initialsOf(item.author),
    time: formatTimeAgo(item.createdAt),
    icon: (item.icon === "calendar" || item.icon === "file" ? item.icon : "megaphone") as Announcement["icon"],
    callout: item.calloutTitle ? { title: item.calloutTitle, detail: item.calloutDetail ?? "" } : undefined,
  };
}

function Composer({ onDone }: { onDone: () => void }) {
  const { showToast } = useApp();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("Info sekolah");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await createAnnouncement({ title, body, tag });
      showToast("Pengumuman berhasil diterbitkan.");
      setTitle(""); setBody(""); setTag("Info sekolah");
      onDone();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menerbitkan pengumuman.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="panel compose-card">
      <div className="compose-accent"></div>
      <p className="section-kicker">Akses cepat</p>
      <h2>Bagikan kabar<br />ke sekolah.</h2>
      <label className="form-field">
        <span>Judul</span>
        <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Rapat guru bulanan" />
      </label>
      <label className="form-field">
        <span>Isi pengumuman</span>
        <textarea rows={4} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tulis pengumuman singkat untuk guru, murid, atau seluruh sekolah..."></textarea>
      </label>
      <label className="form-field">
        <span>Kategori</span>
        <select value={tag} onChange={(event) => setTag(event.target.value)}>
          <option>Info sekolah</option>
          <option>Akademik</option>
          <option>KelasHub</option>
        </select>
      </label>
      <button className="light-button" type="button" disabled={saving || !title.trim() || !body.trim()} onClick={() => void handleSave()}>
        <Icon name="plus" />{saving ? "Menerbitkan…" : "Terbitkan pengumuman"}
      </button>
      <div className="compose-note"><span className="pulse-dot"></span>Langsung tampil di Beranda semua pengguna</div>
    </aside>
  );
}

function TeacherAnnouncements({ live }: { live: LiveItem[] | null }) {
  const { showToast } = useApp();
  const router = useRouter();
  const items = live ? live.map(toAnnouncement) : mockAnnouncements;
  const featured = items[0];

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      showToast("Pengumuman dihapus.");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menghapus pengumuman.");
    }
  };

  return (
    <>
      <PageIntro
        kicker="Komunikasi"
        title="Pengumuman"
        subtitle="Bagikan informasi penting agar semua warga sekolah tetap terhubung."
      />
      <div className="announcement-layout">
        <section className="panel announcement-feed">
          <div className="panel-header">
            <div><p className="section-kicker">Terbaru</p><h2>Pengumuman sekolah</h2></div>
            <button className="select-control" type="button">Semua kategori <Icon name="chevron" /></button>
          </div>
          {featured ? (
            <Link href={`/pengumuman/${featured.id}`} className="announcement-card large">
              <div className="announcement-card-art">
                <span className="art-sun"></span><span className="art-cloud cloud-one"></span><span className="art-hill hill-front"></span><span className="art-building"><i></i><i></i><i></i><i></i></span>
              </div>
              <div className="announcement-card-body">
                <span className="announcement-tag">{featured.tag}</span>
                <h3>{featured.title}</h3>
                <p>{featured.body.length > 140 ? `${featured.body.slice(0, 140)}…` : featured.body}</p>
                <div className="announcement-meta"><Avatar initials={featured.authorInitials} tone="rust" /><span>{featured.author}</span><span className="meta-separator"></span><span>{featured.time}</span></div>
              </div>
            </Link>
          ) : null}
          {items.slice(1).map((item) => (
            <article key={item.id} className="simple-announcement">
              <span className={`simple-announcement-icon${item.tagTone === "purple" ? " purple-soft" : ""}`}><Icon name={item.icon} /></span>
              <div>
                <span className={`announcement-tag ${item.tagTone === "purple" ? "purple-tag" : item.tagTone === "teal" ? "teal-tag" : ""}`}>{item.tag}</span>
                <h3>{item.title}</h3>
                <p>{item.body.length > 110 ? `${item.body.slice(0, 110)}…` : item.body}</p>
                <small>{item.author} <i></i>{item.time}</small>
              </div>
              <div className="row-actions">
                <Link className="row-arrow" href={`/pengumuman/${item.id}`} aria-label={`Buka ${item.title}`}><Icon name="arrow" /></Link>
                <button className="row-arrow" type="button" aria-label={`Hapus ${item.title}`} onClick={() => void handleDelete(item.id)}><Icon name="close" /></button>
              </div>
            </article>
          ))}
        </section>
        <Composer onDone={() => router.refresh()} />
      </div>
    </>
  );
}

function StudentAnnouncements({ live }: { live: LiveItem[] | null }) {
  const { showToast } = useApp();
  const items = live ? live.map(toAnnouncement) : mockAnnouncements;

  return (
    <>
      <PageIntro
        kicker="Informasi sekolah"
        title="Pengumuman"
        subtitle="Ikuti kabar terbaru dari sekolah dan jangan lewatkan informasi penting."
        actions={
          <button className="secondary-button" type="button" onClick={() => showToast("Semua pengumuman ditandai sudah dibaca.")}>
            <Icon name="file" />Tandai semua dibaca
          </button>
        }
      />
      <div className="student-news-grid">
        <section className="panel news-list">
          <div className="panel-header">
            <div><p className="section-kicker">Terbaru</p><h2>Untuk kamu</h2></div>
            <span className="unread-count">{items.length} pengumuman</span>
          </div>
          {items.map((item) => (
            <Link key={item.id} href={`/pengumuman/${item.id}`} className="news-item">
              <span className={`news-icon news-${item.icon === "megaphone" ? "coral" : item.icon === "calendar" ? "purple" : "teal"}`}><Icon name={item.icon} /></span>
              <div>
                <span className={`announcement-tag ${item.tagTone === "purple" ? "purple-tag" : item.tagTone === "teal" ? "teal-tag" : ""}`}>{item.tag}</span>
                <h3>{item.title}</h3>
                <p>{item.body.length > 110 ? `${item.body.slice(0, 110)}…` : item.body}</p>
                <small>{item.author} <i></i>{item.time}</small>
              </div>
            </Link>
          ))}
        </section>
        <aside className="panel news-calendar">
          <p className="section-kicker">Kalender sekolah</p>
          <h2>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</h2>
          <div className="calendar-events">
            <div><span className="event-dot coral-event"></span><p><strong>Hari ini</strong><span>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</span></p></div>
            <div><span className="event-dot purple-event"></span><p><strong>{items.length} pengumuman</strong><span>terbit di sekolah</span></p></div>
          </div>
        </aside>
      </div>
    </>
  );
}

export function AnnouncementsPage() {
  const { role } = useApp();
  const [live, setLive] = useState<LiveItem[] | null>(null);

  useEffect(() => {
    listAnnouncements().then((data) => {
      if (data) setLive(data.announcements);
    });
  }, []);

  return role === "student" ? <StudentAnnouncements live={live} /> : <TeacherAnnouncements live={live} />;
}
