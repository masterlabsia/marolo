import { MembroRepository } from "../MembroRepository";
import type { Membro, PapelTipo } from "../Membro.entity";

export function listMembros(perfilId: number) {
  return MembroRepository.find({
    where: { perfilId },
    order: { createdAt: "ASC" },
  });
}

export function findMembro(id: number) {
  return MembroRepository.findOneBy({ id });
}

export function createMembro(perfilId: number, payload: Pick<Membro, "usuarioId" | "papel">) {
  const membro = MembroRepository.create({ ...payload, perfilId });
  return MembroRepository.save(membro);
}

export async function updateMembro(id: number, payload: { papel: PapelTipo }) {
  await MembroRepository.update(id, payload);
  return MembroRepository.findOneByOrFail({ id });
}

export function removeMembro(id: number) {
  return MembroRepository.delete(id);
}
