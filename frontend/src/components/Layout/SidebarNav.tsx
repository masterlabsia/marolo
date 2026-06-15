import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Trophy, ClipboardCheck, Wallet,
  Users, BarChart3, Landmark, FileText,
  Zap, Eye, EyeOff, LogOut, Shield, UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMonetaryPrivacy } from "@/hooks/useMonetaryPrivacy";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/jogadores", icon: Users, label: "Jogadores" },
  { path: "/jogos", icon: Trophy, label: "Jogos" },
  { path: "/presenca", icon: ClipboardCheck, label: "Presenca" },
  { path: "/pagamentos", icon: Wallet, label: "Pagamentos" },
  { path: "/caixa", icon: Landmark, label: "Caixa" },
  { path: "/estatisticas", icon: BarChart3, label: "Stats" },
  { path: "/relatorios", icon: FileText, label: "Relatorios" },
];

const SidebarNav = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data } = useProfile();
  const { hidden, toggle } = useMonetaryPrivacy();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      toast.error((error as Error).message || "Erro ao sair");
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 fixed top-0 left-0 h-screen border-r border-border/60 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/55 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[4.25rem] border-b border-border/60 shrink-0">
        <div className="grid place-items-center w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 text-primary shrink-0">
          <Zap size={18} strokeWidth={1.8} />
        </div>
        <div className="truncate">
          <p className="text-base font-display font-bold text-foreground tracking-tight truncate leading-none">
            {data?.perfil?.nome_time || "Marolo"}
          </p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em] mt-1">
            {data?.role || "visitante"}
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 px-2 py-4 flex-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive =
            path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
              }`}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user info + actions */}
      <div className="px-3 py-4 border-t border-border/60 space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-muted/35 border border-border/70 text-xs text-muted-foreground">
          {data?.role === "admin" ? <Shield size={12} /> : <UserRound size={12} />}
          <span className="truncate">{user?.email ?? data?.role ?? "-"}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={toggle}
            className="flex-1 flex items-center justify-center p-2 rounded-xl border border-transparent hover:border-border/80 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title={hidden ? "Mostrar valores" : "Ocultar valores"}
          >
            {hidden ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center p-2 rounded-xl border border-transparent hover:border-border/80 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title="Sair"
          >
            <LogOut size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SidebarNav;
