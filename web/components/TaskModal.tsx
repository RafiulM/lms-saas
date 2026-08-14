"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { createAssignment } from "@/lib/actions/assignments";
import { listClasses } from "@/lib/actions/classes";
import { listSubjects } from "@/lib/actions/subjects";

type ClassOption = { id: string; name: string };
type SubjectOption = { id: string; name: string };

export function TaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { showToast } = useApp();
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [due, setDue] = useState("");
  const [weight, setWeight] = useState("10");
  const [instructions, setInstructions] = useState("");
  const [steps, setSteps] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("modal-open");
    window.setTimeout(() => titleRef.current?.focus(), 50);
    if (!loaded) {
      Promise.all([listClasses(), listSubjects()])
        .then(([classData, subjectData]) => {
          if (classData?.classes.length) setClasses(classData.classes.map((c) => ({ id: c.id, name: c.name })));
          if (subjectData?.subjects.length) setSubjects(subjectData.subjects.map((s) => ({ id: s.id, name: s.name })));
        })
        .catch(() => undefined)
        .finally(() => setLoaded(true));
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [open, onClose, loaded]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createAssignment({
        classId,
        subjectId,
        title,
        description: instructions,
        instructions,
        steps: steps.split("\n").map((step) => step.trim()).filter(Boolean),
        dueAt: due,
        weight: Number(weight) || 10,
      });
      onClose();
      setTitle("");
      setClassId("");
      setSubjectId("");
      setDue("");
      setWeight("10");
      setInstructions("");
      setSteps("");
      showToast(`Tugas "${title}" berhasil dikirim ke kelas.`);
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan tugas.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div>
            <p className="section-kicker">Tugas baru</p>
            <h2 id="modal-title">Buat tugas</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Tutup dialog" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Judul tugas</span>
            <input type="text" name="title" placeholder="Contoh: Latihan Persamaan Kuadrat" value={title} onChange={(event) => setTitle(event.target.value)} ref={titleRef} required />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Kelas</span>
              <select name="class" value={classId} onChange={(event) => setClassId(event.target.value)} required>
                <option value="">Pilih kelas</option>
                {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Mata pelajaran</span>
              <select name="subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} required>
                <option value="">Pilih mapel</option>
                {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>Tenggat waktu</span>
              <input type="datetime-local" name="due" value={due} onChange={(event) => setDue(event.target.value)} required />
            </label>
            <label className="form-field">
              <span>Bobot nilai</span>
              <input type="number" name="weight" min="1" max="100" value={weight} onChange={(event) => setWeight(event.target.value)} />
            </label>
          </div>
          <label className="form-field">
            <span>Instruksi <small>(opsional)</small></span>
            <textarea name="description" rows={3} placeholder="Tulis instruksi singkat untuk siswa..." value={instructions} onChange={(event) => setInstructions(event.target.value)}></textarea>
          </label>
          <label className="form-field">
            <span>Langkah pengerjaan <small>(opsional, satu per baris)</small></span>
            <textarea name="steps" rows={3} placeholder={"Kerjakan soal nomor 1-5\nUnggah jawaban dalam format PDF"} value={steps} onChange={(event) => setSteps(event.target.value)}></textarea>
          </label>
          <div className="modal-footer">
            <button className="secondary-button" type="button" onClick={onClose}>Batal</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Menyimpan…" : "Simpan tugas"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
