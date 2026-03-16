import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabaseEnvError } from "@/lib/supabase";

const USERNAME_EMAIL_MAP: Record<string, string> = {
  admin_marolo: "admin_marolo@marolo.app",
  marolo: "marolo@marolo.app",
};

const AuthLoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("1234567890");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalized = username.trim().toLowerCase();
      const email = USERNAME_EMAIL_MAP[normalized];
      if (!email) {
        throw new Error("Usuario invalido. Use admin_marolo ou marolo.");
      }
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
        <p className="text-sm text-muted-foreground mt-1">Login consultivo por usuario.</p>
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl bg-muted/40 border border-border px-3 py-2.5"
              placeholder=""
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
          <p className="text-xs text-muted-foreground">
            Usuarios padrao: <strong>marolo</strong>. Senha padrao: <strong>marolo</strong>.
          </p>
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
