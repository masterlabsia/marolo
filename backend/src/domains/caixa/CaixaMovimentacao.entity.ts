import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Perfil } from "../perfis/Perfil.entity";

export type CaixaTipo = "entrada" | "saida";

@Entity("caixa")
export class CaixaMovimentacao {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "perfil_id", type: "bigint" })
  perfilId: number;

  @Column()
  tipo: CaixaTipo;

  @Column({ nullable: true, type: "text" })
  categoria: string | null;

  @Column()
  descricao: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  valor: number;

  @Column({ name: "data_movimento", type: "date" })
  dataMovimento: string;

  @Column({ name: "metodo_pagamento", nullable: true, type: "text" })
  metodoPagamento: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Perfil, (p) => p.caixaMovimentacoes)
  @JoinColumn({ name: "perfil_id" })
  perfil: Perfil;
}
