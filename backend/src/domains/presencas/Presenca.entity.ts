import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Jogador } from "../jogadores/Jogador.entity";
import { Jogo } from "../jogos/Jogo.entity";

@Entity("presencas")
export class Presenca {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "jogo_id", type: "bigint" })
  jogoId: number;

  @Column({ name: "jogador_id", type: "bigint" })
  jogadorId: number;

  @Column({ default: true })
  presente: boolean;

  @Column({ default: 0, type: "smallint" })
  gols: number;

  @Column({ default: 0, type: "smallint" })
  assistencias: number;

  @Column({ nullable: true, type: "jsonb" })
  cartoes: { amarelo: number; vermelho: number } | null;

  @Column({ nullable: true, type: "text" })
  notas: string | null;

  @Column({ nullable: true, type: "smallint" })
  avaliacao: number | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Jogo, (j) => j.presencas)
  @JoinColumn({ name: "jogo_id" })
  jogo: Jogo;

  @ManyToOne(() => Jogador, (j) => j.presencas)
  @JoinColumn({ name: "jogador_id" })
  jogador: Jogador;
}
