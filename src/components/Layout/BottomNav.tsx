import { useLocation, Link } from "react-router-dom";
import { LayoutDashboard, Trophy, ClipboardCheck, Wallet, Users } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Inicio" },
  { path: "/jogadores", icon: Users, label: "Jogadores" },
  { path: "/jogos", icon: Trophy, label: "Jogos" },
  { path: "/presenca", icon: ClipboardCheck, label: "Presenca" },
  { path: "/pagamentos", icon: Wallet, label: "Pagamentos" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-1 w-6 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring" as const, duration: 0.4, bounce: 0.2 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
