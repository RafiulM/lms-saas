"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { Role } from "@/lib/types";
import { TaskModal } from "@/components/TaskModal";
import { useCurrentUser, type CurrentUser } from "@/lib/auth-client";

interface AppContextValue {
  role: Role;
  showToast: (message: string) => void;
  openTaskModal: () => void;
  closeTaskModal: () => void;
  user: CurrentUser | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const role: Role = user ? (user.role === "student" ? "student" : "teacher") : "teacher";

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastVisible(false), 3200);
  }, []);

  const openTaskModal = useCallback(() => setTaskModalOpen(true), []);
  const closeTaskModal = useCallback(() => setTaskModalOpen(false), []);

  return (
    <AppContext.Provider value={{ role, showToast, openTaskModal, closeTaskModal, user }}>
      {children}
      <TaskModal open={taskModalOpen} onClose={closeTaskModal} />
      <div
        className={`toast${toastVisible ? " visible" : ""}`}
        id="toast"
        role="status"
        aria-live="polite"
      >
        {toastMessage}
      </div>
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
