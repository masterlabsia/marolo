import { motion } from "framer-motion";
import { UserPlus, CalendarPlus, Wallet } from "lucide-react";

const actions = [
  { icon: UserPlus, label: "Jogador", color: "hover:border-primary/50" },
  { icon: CalendarPlus, label: "Jogo", color: "hover:border-primary/50" },
  { icon: Wallet, label: "Caixa", color: "hover:border-primary/50" },
];

const QuickActions = () => {
  return (
    <motion.div
      className="glass-card col-span-1 md:col-span-2 min-h-[100px]"
      whileHover={{ scale: 1.015, translateY: -4 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
    >
      <div className="grid grid-cols-3 gap-3 h-full">
        {actions.map(({ icon: Icon, label, color }) => (
          <button
            key={label}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border/40 bg-muted/20 transition-all duration-300 ${color} hover:bg-primary/10 cursor-pointer`}
          >
            <Icon size={22} strokeWidth={1.5} className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground">+ {label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickActions;
