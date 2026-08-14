import { useSyncExternalStore } from "react";
import type { Role } from "@/lib/types";

const listeners = new Set<() => void>();
let cachedRole: Role | null = null;

export function readStoredRole(): Role {
  if (typeof window === "undefined") return "teacher";
  const saved = window.localStorage.getItem("kelashub-role");
  return saved === "student" ? "student" : "teacher";
}

function getSnapshot(): Role {
  if (cachedRole === null) cachedRole = readStoredRole();
  return cachedRole;
}

export function getServerSnapshot(): Role {
  return "teacher";
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setRole(role: Role) {
  cachedRole = role;
  if (typeof window !== "undefined") window.localStorage.setItem("kelashub-role", role);
  listeners.forEach((listener) => listener());
}

export function getSnapshotRole(): Role {
  return getSnapshot();
}

/**
 * Role override dari localStorage (tombol Mode Guru/Murid), atau null bila
 * pengguna belum pernah memilih secara eksplisit. Hydration-safe: pada
 * render server & render awal klien selalu null, baru terbaca setelah mount.
 */
export function useStoredRole(): Role | null {
  return useSyncExternalStore(subscribe, () => {
    if (typeof window === "undefined") return null;
    const saved = window.localStorage.getItem("kelashub-role");
    return saved === "student" || saved === "teacher" ? saved : null;
  }, () => null);
}
