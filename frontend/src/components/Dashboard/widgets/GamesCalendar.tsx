import { motion } from "framer-motion";
import { Calendar, MapPin, Clock } from "lucide-react";
import { Game } from "@/types";

interface GamesCalendarProps {
  games: Game[];
}

const GamesCalendar = ({ games }: GamesCalendarProps) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <motion.div
      className="glass-card col-span-1 md:col-span-2 row-span-2 min-h-[340px] flex flex-col"
      whileHover={{ scale: 1.015, translateY: -4 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-5">
        <Calendar size={20} strokeWidth={1.5} className="text-primary" />
        <h3 className="text-lg font-display font-bold text-foreground">Próximos Jogos</h3>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {games.map((game) => (
          <div
            key={game.id}
            className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center min-w-[48px]">
              <span className="text-xs text-muted-foreground uppercase">
                {formatDate(game.date).split(" ")[1]}
              </span>
              <span className="text-xl font-display font-bold text-primary">
                {formatDate(game.date).split(" ")[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-foreground truncate">
                vs {game.opponent}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={12} strokeWidth={1.5} /> {game.time}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={12} strokeWidth={1.5} /> {game.location}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default GamesCalendar;
