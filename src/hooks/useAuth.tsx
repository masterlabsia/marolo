import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export type FixedRole = "admin" | "jogador";

export interface FixedUser {
  id: string;
  username: string;
  role: FixedRole;
}

const FIXED_CREDENTIALS: { username: string; password: string; role: FixedRole }[] = [
  { username: "jogador", password: "marolo2026", role: "jogador" },
  { username: "admin", password: "2026marolo", role: "admin" },
];

const STORAGE_KEY = "marolo_fixed_auth";

function loadStored(): FixedUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as FixedUser;
    if (data?.username && (data.role === "admin" || data.role === "jogador")) return data;
  } catch {
    /* ignore */
  }
  return null;
}

function saveStored(user: FixedUser | null) {
  if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(STORAGE_KEY);
}

interface AuthContextValue {
  user: FixedUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FixedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(loadStored());
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn: async (username: string, password: string) => {
        const normalized = username.trim().toLowerCase();
        const found = FIXED_CREDENTIALS.find(
          (c) => c.username === normalized && c.password === password
        );
        if (!found) {
          toast.error("Usuário ou senha inválidos.");
          throw new Error("Usuário ou senha inválidos.");
        }
        const fixedUser: FixedUser = {
          id: found.username,
          username: found.username,
          role: found.role,
        };
        setUser(fixedUser);
        saveStored(fixedUser);
      },
      signOut: async () => {
        setUser(null);
        saveStored(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
