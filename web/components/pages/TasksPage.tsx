"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, MetricCard, PageIntro, PageLoading, StatusPill } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { listAssignments, listStudentAssignments } from "@/lib/actions/assignments";
import { adaptTask } from "@/lib/adapters";
import type { Task, TaskStatus } from "@/lib/types";

function submissionWidth(submissions: string): number {
  const [submitted, total] = submissions.split("/").map(Number);
  if (!total) return 0;
  return Math.round((submitted / total) * 100);
}

function taskPill(status: TaskStatus): "current" | "upcoming" | "done" {
  if (status === "Perlu dinilai" || status === "Belum dikerjakan") return "current";
  if (status === "Selesai" || status === "Sudah dikumpulkan") return "done";
  return "upcoming";
}

const fillTone: Record<Task["tone"], string> = { teal: "teal-fill", purple: "purple-fill", coral: "coral-fill", blue: "blue-fill", orange: "orange-fill" };
const cardIcon: Record<Task["tone"], "file" | "chart" | "school"> = { teal: "file", purple: "chart", coral: "school", blue: "file", orange: "file" };

function TeacherTasks({ live }: { live: Task[] }) {
  const { openTaskModal } = useApp();
  const [tab, setTab] = useState("Semua tugas");
  const tabs = ["Semua tugas", "Perlu dinilai", "Selesai"];
  const tasks = live;
  const counts: Record<string, number> = {
    "Semua tugas": tasks.length,
    "Perlu dinilai": tasks.filter((task) => task.status === "Perlu dinilai").length,
    Selesai: tasks.filter((task) => task.status === "Selesai").length,
  };
  const filtered = tasks.filter((task) => tab === "Semua tugas" || task.status === (tab === "Selesai" ? "Selesai" : "Perlu dinilai"));
  const pending = tasks.filter((task) => task.status === "Perlu dinilai").length;

  return (
    <>
      <PageIntro
        kicker="Ruang belajar"
        title="Tugas & Pengumpulan"
        subtitle="Pantau tugas, periksa jawaban, dan kirim umpan balik ke kelasmu."
        actions={
          <button className="primary-button" type="button" onClick={openTaskModal}>
            <Icon name="plus" />Buat tugas
          </button>
        }
      />
      <section className="metric-grid compact-metrics">
        <MetricCard tone="teal" label="Tugas aktif" value={<>{tasks.length} <span>tugas</span></>} detail={`${pending} perlu perhatian`} trend="Terbaru" />
        <MetricCard tone="purple" label="Menunggu dinilai" value={<>{pending} <span>tugas</span></>} detail="Dari semua kelas" trend="Hari ini" />
        <MetricCard tone="coral" label="Tingkat selesai" value={<>{tasks.length ? `${Math.round((tasks.filter((t) => t.status === "Selesai").length / tasks.length) * 100)}%` : "—"}</>} detail="Dari tugas aktif" trend="Terbaru" />
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
            <thead><tr><th>Tugas</th><th>Kelas</th><th>Pengumpulan</th><th>Tenggat</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((task) => (
                <tr key={task.id}>
                  <td>
                    <div className="table-primary">
                      <span className={`table-icon ${task.tone}-soft`}><Icon name={cardIcon[task.tone]} /></span>
                      <div><strong>{task.title}</strong><small>{task.subject}</small></div>
                    </div>
                  </td>
                  <td>{task.className}</td>
                  <td>
                    <strong>{task.submissions || "0/0"}</strong> <small className="muted-text">terkumpul</small>
                    <div className="table-progress"><span className={fillTone[task.tone]} style={{ width: `${submissionWidth(task.submissions)}%` }}></span></div>
                  </td>
                  <td>{task.due}</td>
                  <td><StatusPill tone={taskPill(task.status)}>{task.status}</StatusPill></td>
                  <td><Link className="row-arrow" href={`/tugas/${task.id}`} aria-label={`Buka ${task.title}`}><Icon name="arrow" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!tasks.length ? (
          <p className="empty-state">Belum ada tugas. Buat tugas pertama untuk kelasmu.</p>
        ) : null}
      </section>
    </>
  );
}

function StudentTasks({ live }: { live: Task[] }) {
  const tasks = live;
  const todo = tasks.filter((task) => task.status === "Belum dikerjakan").length;
  const doing = tasks.filter((task) => task.status === "Sedang dikerjakan").length;
  const done = tasks.filter((task) => task.status === "Sudah dikumpulkan" || task.status === "Selesai").length;

  return (
    <>
      <PageIntro
        kicker="Ruang belajar"
        title="Tugas Saya"
        subtitle="Jangan lewatkan tenggat. Kamu punya beberapa tugas yang perlu diselesaikan."
        actions={
          <button className="secondary-button" type="button"><Icon name="file" />Filter tugas</button>
        }
      />
      <section className="metric-grid compact-metrics student-task-stats">
        <MetricCard tone="coral" label="Belum dikerjakan" value={<>{todo} <span>tugas</span></>} detail="Perlu segera dikerjakan" />
        <MetricCard tone="purple" label="Sedang dikerjakan" value={<>{doing} <span>tugas</span></>} detail="Teruskan progresmu" />
        <MetricCard tone="teal" label="Sudah selesai" value={<>{done} <span>tugas</span></>} detail="Dari tugas aktif" />
      </section>
      <section className="student-task-cards">
        {tasks.map((task) => (
          <Link key={task.id} href={`/tugas/${task.id}`} className="panel student-assignment-card">
            <div className="assignment-card-top">
              <span className={`assignment-icon assignment-${task.tone}`}><Icon name={cardIcon[task.tone]} /></span>
              <StatusPill tone={taskPill(task.status)}>{task.status}</StatusPill>
            </div>
            <h2>{task.title}</h2>
            <p className="assignment-subject">{task.subject} · {task.className}</p>
            <div className="assignment-due"><span>Tenggat</span><strong>{task.due}</strong></div>
            <div className="assignment-card-footer">
              <span>{task.status === "Sudah dikumpulkan" || task.status === "Selesai" ? "Sudah dikumpulkan" : "Belum ada pengumpulan"}</span>
              <span className="primary-button small-button">{task.action}<Icon name="arrow" /></span>
            </div>
          </Link>
        ))}
        {!tasks.length ? (
          <p className="empty-state">Belum ada tugas untuk kelasmu.</p>
        ) : null}
      </section>
    </>
  );
}

export function TasksPage() {
  const { role } = useApp();
  const [teacherLive, setTeacherLive] = useState<Task[] | null>(null);
  const [studentLive, setStudentLive] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const finish = () => {
      if (active) setLoading(false);
    };
    if (role === "teacher") {
      listAssignments()
        .then((data) => {
          if (!data || !active) return;
          setTeacherLive(
            data.assignments.map((a) =>
              adaptTask(a, {
                status: a.overdue ? (a.submittedCount >= a.totalStudents ? "Selesai" : "Perlu dinilai") : "Aktif",
                action: a.overdue ? "Lihat nilai" : "Buka tugas",
              }),
            ),
          );
        })
        .catch(() => undefined)
        .finally(finish);
    } else {
      listStudentAssignments()
        .then((data) => {
          if (!data || !active) return;
          setStudentLive(
            data.assignments.map((a) =>
              adaptTask(a, {
                status: a.graded ? "Sudah dikumpulkan" : a.submitted ? "Sedang dikerjakan" : "Belum dikerjakan",
                action: a.graded ? "Lihat nilai" : a.submitted ? "Lanjutkan" : "Mulai tugas",
              }),
            ),
          );
        })
        .catch(() => undefined)
        .finally(finish);
    }
    return () => {
      active = false;
    };
  }, [role]);

  if (loading) return <PageLoading />;
  return role === "student" ? <StudentTasks live={studentLive ?? []} /> : <TeacherTasks live={teacherLive ?? []} />;
}
