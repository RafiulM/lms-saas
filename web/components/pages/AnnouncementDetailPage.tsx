"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Avatar, Icon, PageIntro, PageLoading } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { getAnnouncement, listAnnouncements, updateAnnouncement } from "@/lib/actions/announcements";
import { formatDateFull, formatTimeAgo, initialsOf } from "@/lib/adapters";
import type { Announcement } from "@/lib/types";

const newsTone: Record<string, string> = { megaphone: "coral", calendar: "purple", file: "teal" };

function AnnouncementEditModal({
  announcement,
  onClose,
  onSaved,
}: {
  announcement: Announcement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useApp();
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState(announcement.body);
  const [tag, setTag] = useState(announcement.tag);
  const [calloutTitle, setCalloutTitle] = useState(announcement.callout?.title ?? "");
  const [calloutDetail, setCalloutDetail] = useState(announcement.callout?.detail ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateAnnouncement(announcement.id, {
        title,
        body,
        tag,
        calloutTitle: calloutTitle || undefined,
        calloutDetail: calloutDetail || undefined,
      });
      showToast("Pengumuman berhasil diperbarui.");
      onClose();
      onSaved();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan pengumuman.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="announcement-modal-title">
        <div className="modal-header">
          <div>
            <p className="section-kicker">Edit pengumuman</p>
            <h2 id="announcement-modal-title">Perbarui pengumuman</h2>
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
            <textarea rows={5} value={body} onChange={(event) => setBody(event.target.value)} required></textarea>
          </label>
          <label className="form-field">
            <span>Kategori</span>
            <select value={tag} onChange={(event) => setTag(event.target.value)}>
              <option>Info sekolah</option>
              <option>Akademik</option>
              <option>KelasHub</option>
            </select>
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Detail jadwal <small>(opsional)</small></span>
              <input type="text" value={calloutTitle} onChange={(event) => setCalloutTitle(event.target.value)} placeholder="Contoh: Jumat, 14 Agustus 2026" />
            </label>
            <label className="form-field">
              <span>Waktu & tempat <small>(opsional)</small></span>
              <input type="text" value={calloutDetail} onChange={(event) => setCalloutDetail(event.target.value)} placeholder="Contoh: 15:30 WIB · Aula utama" />
            </label>
          </div>
          <div className="modal-footer">
            <button className="secondary-button" type="button" onClick={onClose}>Batal</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Menyimpan…" : "Simpan perubahan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AnnouncementDetailPage() {
  const { role, showToast } = useApp();
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<Announcement | null>(null);
  const [related, setRelated] = useState<Announcement[]>([]);
  const [settled, setSettled] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const refetch = () => {
    getAnnouncement(params.id).then((data) => {
      if (!data) {
        setNotFound(true);
        return;
      }
      setNotFound(false);
      setItem({
        id: data.id,
        tag: data.tag,
        tagTone: data.tagTone === "purple" ? "purple" : data.tagTone === "teal" ? "teal" : "default",
        title: data.title,
        body: data.body,
        author: data.author,
        authorInitials: initialsOf(data.author),
        time: formatDateFull(data.createdAt),
        icon: (data.icon === "calendar" || data.icon === "file" ? data.icon : "megaphone") as Announcement["icon"],
        callout: data.calloutTitle ? { title: data.calloutTitle, detail: data.calloutDetail ?? "" } : undefined,
      });
    }).finally(() => setSettled(true));
  };

  useEffect(() => {
    refetch();
    listAnnouncements().then((data) => {
      if (!data) return;
      setRelated(data.announcements.filter((a) => a.id !== params.id).slice(0, 2).map((a) => ({
        id: a.id,
        tag: a.tag,
        tagTone: a.tagTone === "purple" ? "purple" : a.tagTone === "teal" ? "teal" : "default",
        title: a.title,
        body: a.body,
        author: a.author,
        authorInitials: initialsOf(a.author),
        time: formatTimeAgo(a.createdAt),
        icon: (a.icon === "calendar" || a.icon === "file" ? a.icon : "megaphone") as Announcement["icon"],
      })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (!settled && !item && !notFound) return <PageLoading />;

  const current = item;

  if (notFound || !current) {
    return (
      <>
        <PageIntro
          kicker="Pengumuman"
          title="Pengumuman tidak ditemukan"
          subtitle="Pengumuman ini mungkin telah dihapus atau tidak tersedia untuk akunmu."
          actions={
            <Link className="secondary-button" href="/pengumuman"><Icon name="arrow" />Kembali ke pengumuman</Link>
          }
        />
        <section className="panel">
          <p className="empty-state">Pengumuman tidak ditemukan. Cek daftar pengumuman untuk berita terbaru.</p>
        </section>
      </>
    );
  }

  return (
    <>
      <PageIntro
        kicker="Pengumuman"
        title={current.title}
        subtitle={`${current.tag} · Dipublikasikan ${current.time}`}
        actions={
          <>
            <Link className="secondary-button" href="/pengumuman"><Icon name="arrow" />Kembali ke pengumuman</Link>
            {role === "teacher" ? (
              <button className="primary-button" type="button" onClick={() => setEditOpen(true)}>
                <Icon name="settings" />Edit pengumuman
              </button>
            ) : null}
          </>
        }
      />
      <div className="announcement-detail-layout">
        <article className="panel announcement-detail-main">
          <span className={`announcement-tag ${current.tagTone === "purple" ? "purple-tag" : current.tagTone === "teal" ? "teal-tag" : ""}`}>{current.tag}</span>
          <h2>{current.title}</h2>
          <div className="announcement-meta">
            <Avatar initials={current.authorInitials} tone="rust" />
            <span>{current.author}</span>
            <span className="meta-separator"></span>
            <span>{current.time}</span>
          </div>
          <div className="announcement-detail-art">
            <span className="art-sun"></span><span className="art-cloud cloud-one"></span><span className="art-hill hill-back"></span><span className="art-hill hill-front"></span><span className="art-building"><i></i><i></i><i></i><i></i></span>
          </div>
          <div className="detail-copy">
            {current.body.split(". ").filter(Boolean).map((sentence, index) => (
              <p key={index}>{sentence}.</p>
            ))}
            {current.callout ? (
              <div className="announcement-callout">
                <span><Icon name="calendar" /></span>
                <div><strong>{current.callout.title}</strong><small>{current.callout.detail}</small></div>
              </div>
            ) : null}
          </div>
        </article>
        <aside className="panel related-panel">
          <p className="section-kicker">Pengumuman lain</p>
          <h2>Perlu kamu tahu</h2>
          <div className="related-list">
            {related.map((entry) => (
              <Link key={entry.id} href={`/pengumuman/${entry.id}`}>
                <span className={`news-icon news-${newsTone[entry.icon]}`}><Icon name={entry.icon} /></span>
                <span><strong>{entry.title}</strong><small>{entry.time}</small></span>
                <Icon name="arrow" />
              </Link>
            ))}
            {!related.length ? (
              <p className="empty-state">Belum ada pengumuman lain.</p>
            ) : null}
          </div>
        </aside>
      </div>

      {editOpen && item ? (
        <AnnouncementEditModal announcement={item} onClose={() => setEditOpen(false)} onSaved={refetch} />
      ) : null}
    </>
  );
}
