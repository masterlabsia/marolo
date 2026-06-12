import { DataSource } from "typeorm";
import { Perfil } from "../domains/perfis/Perfil.entity";
import { Jogador } from "../domains/jogadores/Jogador.entity";
import { Jogo } from "../domains/jogos/Jogo.entity";
import { Presenca } from "../domains/presencas/Presenca.entity";
import { Pagamento } from "../domains/pagamentos/Pagamento.entity";
import { CaixaMovimentacao } from "../domains/caixa/CaixaMovimentacao.entity";
import { Membro } from "../domains/membros/Membro.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [Perfil, Jogador, Jogo, Presenca, Pagamento, CaixaMovimentacao, Membro],
});
