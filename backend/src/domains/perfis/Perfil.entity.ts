import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Jogador } from "../jogadores/Jogador.entity";
import { Jogo } from "../jogos/Jogo.entity";
import { Pagamento } from "../pagamentos/Pagamento.entity";
import { CaixaMovimentacao } from "../caixa/CaixaMovimentacao.entity";

@Entity("perfis")
export class Perfil {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "usuario_id", type: "uuid" })
  usuarioId: string;

  @Column({ name: "nome_time" })
  nomeTime: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true, type: "text" })
  descricao: string | null;

  @Column({ name: "logo_url", nullable: true, type: "text" })
  logoUrl: string | null;

  @Column({ name: "configuracao_tema", type: "jsonb", nullable: true })
  configuracaoTema: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => Jogador, (j) => j.perfil)
  jogadores: Jogador[];

  @OneToMany(() => Jogo, (j) => j.perfil)
  jogos: Jogo[];

  @OneToMany(() => Pagamento, (p) => p.perfil)
  pagamentos: Pagamento[];

  @OneToMany(() => CaixaMovimentacao, (c) => c.perfil)
  caixaMovimentacoes: CaixaMovimentacao[];
}
