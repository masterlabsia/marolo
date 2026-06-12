import { AppDataSource } from "../../../shared/database";
import { Presenca } from "../../presencas/Presenca.entity";

export async function getStatsJogadores(perfilId: number) {
  const rows = await AppDataSource.getRepository(Presenca)
    .createQueryBuilder("p")
    .innerJoin("p.jogo", "jogo", "jogo.perfil_id = :perfilId", { perfilId })
    .innerJoin("p.jogador", "jogador")
    .select("p.jogador_id", "jogadorId")
    .addSelect("jogador.nome", "nome")
    .addSelect("SUM(p.gols)", "gols")
    .addSelect("SUM(p.assistencias)", "assistencias")
    .addSelect("COUNT(p.id)", "jogos")
    .groupBy("p.jogador_id")
    .addGroupBy("jogador.nome")
    .orderBy("gols", "DESC")
    .getRawMany<{ jogadorId: number; nome: string; gols: string; assistencias: string; jogos: string }>();

  return rows.map((r) => ({
    jogadorId: Number(r.jogadorId),
    nome: r.nome,
    gols: Number(r.gols),
    assistencias: Number(r.assistencias),
    jogos: Number(r.jogos),
  }));
}

export async function getTopScorers(perfilId: number, limit = 10) {
  const stats = await getStatsJogadores(perfilId);
  return stats.sort((a, b) => b.gols - a.gols).slice(0, limit);
}
