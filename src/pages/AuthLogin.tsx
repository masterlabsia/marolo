import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const AuthLoginPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await signUp(email, password);
        toast.success("Conta criada. Verifique seu e-mail para confirmar cadastro.");
      } else {
        await signIn(email, password);
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Falha na autenticacao");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid place-items-center p-4">
      <div className="w-full max-w-md glass-card">
        <h1 className="text-2xl font-display font-bold">{isRegister ? "Criar conta" : "Entrar"}</h1>
        <p className="text-sm text-muted-foreground mt-1">Acesso ao Marolo App para presidente e jogadores.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl bg-muted/40 border border-border px-3 py-2.5"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Senha</label>
            <input
              type="password"
              required
              minLength={6}
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
            {loading ? "Aguarde..." : isRegister ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <button
          className="mt-4 text-sm text-primary"
          onClick={() => setIsRegister((v) => !v)}
          type="button"
        >
          {isRegister ? "Ja tenho conta" : "Primeiro acesso? Criar conta"}
        </button>
      </div>
    </div>
  );
};

export default AuthLoginPage;
