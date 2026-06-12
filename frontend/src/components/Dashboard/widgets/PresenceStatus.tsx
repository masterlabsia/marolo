import { motion } from "framer-motion";
import { Activity } from "lucide-react";

interface PresenceStatusProps {
  percentage: number;
}

const PresenceStatus = ({ percentage }: PresenceStatusProps) => {
  const color = percentage >= 80 ? "text-success" : percentage >= 50 ? "text-warning" : "text-destructive";
  const bgColor = percentage >= 80 ? "bg-success" : percentage >= 50 ? "bg-warning" : "bg-destructive";

  return (
    <motion.div
      className="glass-card kpi-glow relative overflow-hidden flex flex-col justify-between min-h-[160px]"
      whileHover={{ scale: 1.015, translateY: -4 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
    >
      <div className="flex items-center gap-2">
        <Activity size={20} strokeWidth={1.5} className="text-muted-foreground" />
      </div>

      <div>
        <p className={`text-3xl font-display font-bold tabular-nums tracking-tighter ${color}`}>
          {percentage}%
        </p>
        <p className="label-text mt-1">Presença (30d)</p>
        <div className="w-full h-1.5 rounded-full bg-muted mt-3">
          <div
            className={`h-full rounded-full ${bgColor} transition-all duration-700`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default PresenceStatus;
