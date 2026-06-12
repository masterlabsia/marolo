import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn } from "typeorm";
import { Perfil } from "../perfis/Perfil.entity";
import { Presenca } from "../presencas/Presenca.entity";
import { Pagamento } from "../pagamentos/Pagamento.entity";

@Entity("jogadores")
export class Jogador {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "perfil_id", type: "bigint" })
  perfilId: number;

  @Column()
  nome: string;

  @Column({ nullable: true, type: "text" })
  posicao: string | null;

  @Column({ name: "numero_camisa", nullable: true, type: "smallint" })
  numeroCamisa: number | null;

  @Column({ nullable: true, type: "text" })
  telefone: string | null;

  @Column({ nullable: true, type: "text" })
  email: string | null;

  @Column({ nullable: true, type: "jsonb" })
  tags: string[] | null;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Perfil, (p) => p.jogadores)
  @JoinColumn({ name: "perfil_id" })
  perfil: Perfil;

  @OneToMany(() => Presenca, (p) => p.jogador)
  presencas: Presenca[];

  @OneToMany(() => Pagamento, (p) => p.jogador)
  pagamentos: Pagamento[];
}
