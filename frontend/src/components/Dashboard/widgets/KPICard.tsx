import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  sublabel?: string;
  variant?: "default" | "success" | "destructive" | "warning";
}

const variantStyles = {
  default: "text-primary",
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-warning",
};

const KPICard = ({ icon: Icon, value, label, sublabel, variant = "default" }: KPICardProps) => {
  return (
    <motion.div
      className="glass-card kpi-glow relative overflow-hidden flex flex-col justify-between min-h-[160px]"
      whileHover={{ scale: 1.015, translateY: -4 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <Icon className="text-muted-foreground" size={20} strokeWidth={1.5} />
      </div>
      <div>
        <p className={`text-3xl font-display font-bold tabular-nums tracking-tighter ${variantStyles[variant]}`}>
          {value}
        </p>
        <p className="label-text mt-1">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
    </motion.div>
  );
};

export default KPICard;
