import { listJogadores } from "../../domains/jogadores/shared/services";
import { getStatsJogadores } from "../../domains/stats/shared/services";

export const resolvers = {
  Query: {
    jogadores: (_: unknown, { perfilId }: { perfilId: number }) =>
      listJogadores(perfilId),

    statsJogadores: (_: unknown, { perfilId }: { perfilId: number }) =>
      getStatsJogadores(perfilId),
  },
};
