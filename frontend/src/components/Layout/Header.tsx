import { Eye, EyeOff, LogOut, Shield, UserRound, Zap } from "lucide-react";
import { toast } from "sonner";
import DesktopNav from "./DesktopNav";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMonetaryPrivacy } from "@/hooks/useMonetaryPrivacy";

const Header = () => {
  const { user, signOut } = useAuth();
  const { data } = useProfile();
  const { hidden, toggle } = useMonetaryPrivacy();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error: any) {
      toast.error(error.message || "Erro ao sair");
    }
  };

  return (
    <header className="md:hidden sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/55">
      <div className="flex items-center justify-between px-4 md:px-6 h-16 md:h-[4.25rem] max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid place-items-center w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 text-primary shrink-0">
              <Zap size={18} strokeWidth={1.8} />
            </div>
            <div className="truncate">
              <p className="text-base font-display font-bold text-foreground tracking-tight truncate leading-none">
                {data?.perfil?.nome_time || "Marolo"}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em] mt-1">{data?.role || "visitante"}</p>
            </div>
          </div>
          <DesktopNav />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 rounded-xl border border-transparent hover:border-border/80 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title={hidden ? "Mostrar valores" : "Ocultar valores"}
          >
            {hidden ? <Eye size={18} strokeWidth={1.5} /> : <EyeOff size={18} strokeWidth={1.5} />}
          </button>
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/35 border border-border/70 text-xs text-muted-foreground">
            {data?.role === "admin" ? <Shield size={12} /> : <UserRound size={12} />} {user?.email ?? data?.role ?? "-"}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl border border-transparent hover:border-border/80 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title="Sair"
          >
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
