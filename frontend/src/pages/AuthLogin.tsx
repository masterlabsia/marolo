import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabaseEnvError } from "@/lib/supabase";

// Mapa de usernames para emails no Supabase cloud (produção)
const USERNAME_EMAIL_MAP: Record<string, string> = {
  marolo: "marolo@marolo.app",
  admin_marolo: "admin_marolo@marolo.app",
};

function resolveEmail(input: string): string {
  if (input.includes("@")) return input; // já é email
  const mapped = USERNAME_EMAIL_MAP[input.toLowerCase()];
  if (!mapped) throw new Error("Usuario invalido.");
  return mapped;
}

const AuthLoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const email = resolveEmail(login.trim());
      await signIn(email, password);
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Falha na autenticacao");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid place-items-center p-4">
      <div className="w-full max-w-md glass-card">
        <h1 className="text-2xl font-display font-bold">Entrar</h1>
        <p className="text-sm text-muted-foreground mt-1">Usuario ou email.</p>
        {supabaseEnvError && (
          <p className="mt-3 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            Ambiente sem variaveis VITE do Supabase. Configure no deploy para liberar login.
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-muted-foreground">Usuario</label>
            <input
              type="text"
              required
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="mt-1 w-full rounded-xl bg-muted/40 border border-border px-3 py-2.5"
              placeholder="marolo ou seu@email.com"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl bg-muted/40 border border-border px-3 py-2.5"
            />
          </div>
          <button
            disabled={loading}
            className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 font-medium disabled:opacity-50"
            type="submit"
          >
            {loading ? "Processando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthLoginPage;
