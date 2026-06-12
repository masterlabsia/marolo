import { JogoRepository } from "../JogoRepository";
import type { Jogo, JogoStatus } from "../Jogo.entity";

export function listJogos(perfilId: number) {
  return JogoRepository.find({
    where: { perfilId },
    order: { dataHora: "DESC" },
  });
}

export function createJogo(
  perfilId: number,
  payload: Pick<Jogo, "dataHora" | "adversario" | "local" | "formacao" | "notas">,
) {
  const jogo = JogoRepository.create({ ...payload, perfilId, status: "agendado" });
  return JogoRepository.save(jogo);
}

export async function updateJogo(id: number, payload: Partial<Jogo>) {
  await JogoRepository.update(id, payload);
  return JogoRepository.findOneByOrFail({ id });
}

export function removeJogo(id: number) {
  return JogoRepository.delete(id);
}
