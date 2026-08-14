"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { useEffect, useState } from "react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? undefined,
  plugins: [adminClient()],
});

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  schoolId?: string | null;
};

/**
 * Ambil sesi hanya di sisi klien (aman untuk SSR/prerender statis).
 * Gunakan ini di komponen klien; di server gunakan `auth.api.getSession`.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    let active = true;
    authClient
      .getSession()
      .then((res) => {
        if (!active) return;
        setUser((res.data?.user as CurrentUser | undefined) ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setPending(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { user, pending };
}
