import { JogadorRepository } from "../JogadorRepository";
import type { Jogador } from "../Jogador.entity";

export function listJogadores(perfilId: number) {
  return JogadorRepository.find({
    where: { perfilId },
    order: { nome: "ASC" },
  });
}

export function findJogador(id: number) {
  return JogadorRepository.findOneBy({ id });
}

export function createJogador(perfilId: number, payload: Pick<Jogador, "nome" | "posicao" | "numeroCamisa" | "telefone" | "email" | "tags">) {
  const jogador = JogadorRepository.create({ ...payload, perfilId });
  return JogadorRepository.save(jogador);
}

export async function updateJogador(id: number, payload: Partial<Jogador>) {
  await JogadorRepository.update(id, payload);
  return JogadorRepository.findOneByOrFail({ id });
}

export function removeJogador(id: number) {
  return JogadorRepository.delete(id);
}
