import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Perfil } from "../perfis/Perfil.entity";

export type PapelTipo = "admin" | "jogador" | "diarista";

@Entity("membros")
export class Membro {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "perfil_id", type: "bigint" })
  perfilId: number;

  @Column({ name: "usuario_id", type: "uuid" })
  usuarioId: string;

  @Column({ type: "enum", enum: ["admin", "jogador", "diarista"], default: "jogador" })
  papel: PapelTipo;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => Perfil)
  @JoinColumn({ name: "perfil_id" })
  perfil: Perfil;
}
