import { motion } from "framer-motion";
import { Player } from "@/types";

interface PlayerCardProps {
  player: Player;
}

const statusColors = {
  titular: "bg-success/20 text-success",
  reserva: "bg-warning/20 text-warning",
  lesionado: "bg-destructive/20 text-destructive",
};

const PlayerCard = ({ player }: PlayerCardProps) => {
  return (
    <motion.div
      className="glass-card relative overflow-hidden flex flex-col items-center justify-center text-center col-span-1 md:col-span-2 row-span-2 min-h-[340px]"
      whileHover={{ scale: 1.015, translateY: -4 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
    >
      {/* Status badge */}
      <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${statusColors[player.status]}`}>
        {player.status}
      </span>

      {/* Avatar */}
      <div className="w-20 h-20 rounded-full bg-muted ring-2 ring-border flex items-center justify-center mb-4">
        <span className="text-2xl font-display font-bold text-primary">
          {player.number}
        </span>
      </div>

      <h3 className="text-xl font-display font-bold text-foreground">{player.name}</h3>
      <p className="text-sm text-muted-foreground mt-1">{player.position}</p>

      {/* Stats */}
      <div className="flex gap-6 mt-4">
        <div className="text-center">
          <p className="stat-number text-lg">{player.goals}</p>
          <p className="text-xs text-muted-foreground">Gols</p>
        </div>
        <div className="text-center">
          <p className="stat-number text-lg">{player.assists}</p>
          <p className="text-xs text-muted-foreground">Assists</p>
        </div>
        <div className="text-center">
          <p className="stat-number text-lg">{player.presenceRate}%</p>
          <p className="text-xs text-muted-foreground">Presença</p>
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {player.skills.map((skill) => (
          <span
            key={skill}
            className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
          >
            {skill}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default PlayerCard;
