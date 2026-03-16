import { useLocation, Link } from "react-router-dom";
import { LayoutDashboard, Trophy, ClipboardCheck, Wallet, Users, BarChart3, Landmark } from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/jogadores", icon: Users, label: "Jogadores" },
  { path: "/jogos", icon: Trophy, label: "Jogos" },
  { path: "/presenca", icon: ClipboardCheck, label: "Presenca" },
  { path: "/pagamentos", icon: Wallet, label: "Pagamentos" },
  { path: "/caixa", icon: Landmark, label: "Caixa" },
  { path: "/estatisticas", icon: BarChart3, label: "Stats" },
];

const DesktopNav = () => {
  const location = useLocation();

  return (
    <nav className="hidden md:flex items-center gap-1">
      {navItems.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Icon size={15} strokeWidth={1.5} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default DesktopNav;
