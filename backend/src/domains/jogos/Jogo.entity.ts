import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Perfil } from "../perfis/Perfil.entity";
import { Presenca } from "../presencas/Presenca.entity";

export type JogoStatus = "agendado" | "realizado" | "cancelado";

@Entity("jogos")
export class Jogo {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "perfil_id", type: "bigint" })
  perfilId: number;

  @Column({ name: "data_hora", type: "timestamptz" })
  dataHora: Date;

  @Column()
  adversario: string;

  @Column({ nullable: true, type: "text" })
  local: string | null;

  @Column({ nullable: true, type: "jsonb" })
  resultado: { gols_nossos: number; gols_adversario: number } | null;

  @Column({ nullable: true, type: "text" })
  formacao: string | null;

  @Column({ nullable: true, type: "text" })
  notas: string | null;

  @Column({ default: "agendado" })
  status: JogoStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Perfil, (p) => p.jogos)
  @JoinColumn({ name: "perfil_id" })
  perfil: Perfil;

  @OneToMany(() => Presenca, (p) => p.jogo)
  presencas: Presenca[];
}
