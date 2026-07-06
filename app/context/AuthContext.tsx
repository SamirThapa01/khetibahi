// ─────────────────────────────────────────────
//  KhetiBahi – Auth Context
//
//  Holds "who is logged in?" in React state so any
//  component (Navbar, pages) can read it instantly
//  without re-fetching. On first load we ask the
//  server "who am I?" via /api/auth/me — the server
//  reads the httpOnly cookie (which JS can't see
//  directly) and tells us.
// ─────────────────────────────────────────────

"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useInformation } from "@/app/components/Information";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean; // true only during the initial "/api/auth/me" check
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; profileImage?: string }) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { show } = useInformation();

  // ── Restore session on first load ──────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        show("error", data.error ?? "Login failed.");
        return { ok: false, error: data.error ?? "Login failed." };
      }
      setUser(data.user);
      show("success", "Logged in");
      return { ok: true };
    } catch {
      show("error", "Network error. Please try again.");
      return { ok: false, error: "Network error. Please try again." };
    }
  }, [show]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        show("error", data.error ?? "Signup failed.");
        return { ok: false, error: data.error ?? "Signup failed." };
      }
      setUser(data.user);
      show("success", "Account created");
      return { ok: true };
    } catch {
      show("error", "Network error. Please try again.");
      return { ok: false, error: "Network error. Please try again." };
    }
  }, [show]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    show("success", "Signed out");
  }, [show]);

  const updateProfile = useCallback(
    async (data: { name?: string; profileImage?: string }) => {
      try {
        const res = await fetch("/api/user", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const body = await res.json();
        if (!res.ok) {
          show("error", body.error ?? "Could not update profile.");
          return { ok: false, error: body.error ?? "Could not update profile." };
        }
        setUser(body.user);
        show("success", "Updated successfully");
        return { ok: true };
      } catch {
        show("error", "Network error. Please try again.");
        return { ok: false, error: "Network error. Please try again." };
      }
    },
    [show]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Read auth state + actions from anywhere inside <AuthProvider> */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}