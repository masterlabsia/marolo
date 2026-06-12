import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Perfil } from "../perfis/Perfil.entity";
import { Jogador } from "../jogadores/Jogador.entity";

export type PagamentoStatus = "pendente" | "pago" | "vencido";

@Entity("pagamentos")
export class Pagamento {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "perfil_id", type: "bigint" })
  perfilId: number;

  @Column({ name: "jogador_id", type: "bigint" })
  jogadorId: number;

  @Column({ type: "smallint" })
  mes: number;

  @Column({ type: "smallint" })
  ano: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  valor: number;

  @Column({ default: "pendente" })
  status: PagamentoStatus;

  @Column({ name: "data_vencimento", nullable: true, type: "date" })
  dataVencimento: string | null;

  @Column({ name: "data_pagamento", nullable: true, type: "date" })
  dataPagamento: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Perfil, (p) => p.pagamentos)
  @JoinColumn({ name: "perfil_id" })
  perfil: Perfil;

  @ManyToOne(() => Jogador, (j) => j.pagamentos)
  @JoinColumn({ name: "jogador_id" })
  jogador: Jogador;
}
