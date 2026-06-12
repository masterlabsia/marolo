import { PresencaRepository } from "../PresencaRepository";
import type { Presenca } from "../Presenca.entity";

export function listPresencasByJogo(jogoId: number) {
  return PresencaRepository.find({
    where: { jogoId },
    relations: { jogador: true },
    order: { createdAt: "ASC" },
  });
}

export async function upsertPresenca(
  payload: Pick<Presenca, "jogoId" | "jogadorId" | "presente" | "gols" | "assistencias" | "cartoes" | "notas" | "avaliacao">,
) {
  const existing = await PresencaRepository.findOneBy({
    jogoId: payload.jogoId,
    jogadorId: payload.jogadorId,
  });

  if (existing) {
    await PresencaRepository.update(existing.id, payload);
    return PresencaRepository.findOneByOrFail({ id: existing.id });
  }

  const presenca = PresencaRepository.create(payload);
  return PresencaRepository.save(presenca);
}
