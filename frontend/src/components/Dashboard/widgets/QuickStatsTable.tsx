import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Player } from "@/types";

interface QuickStatsTableProps {
  players: Player[];
}

const QuickStatsTable = ({ players }: QuickStatsTableProps) => {
  const sorted = [...players].sort((a, b) => b.goals - a.goals).slice(0, 5);

  return (
    <motion.div
      className="glass-card col-span-1 md:col-span-2 min-h-[160px]"
      whileHover={{ scale: 1.015, translateY: -4 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Flame size={20} strokeWidth={1.5} className="text-primary" />
        <h3 className="text-lg font-display font-bold text-foreground">Artilheiros</h3>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map((player, i) => (
          <div
            key={player.id}
            className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono w-4">{i + 1}.</span>
              <span className="text-sm font-medium text-foreground">{player.name}</span>
            </div>
            <span className="stat-number text-sm">{player.goals} ⚽</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickStatsTable;
