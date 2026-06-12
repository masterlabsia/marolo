import { CaixaRepository } from "../CaixaRepository";
import type { CaixaMovimentacao } from "../CaixaMovimentacao.entity";

export function listCaixa(perfilId: number) {
  return CaixaRepository.find({
    where: { perfilId },
    order: { dataMovimento: "DESC" },
  });
}

export async function getSaldo(perfilId: number) {
  const movimentacoes = await CaixaRepository.find({ where: { perfilId }, select: ["tipo", "valor"] });
  return movimentacoes.reduce((saldo, m) => {
    return m.tipo === "entrada" ? saldo + Number(m.valor) : saldo - Number(m.valor);
  }, 0);
}

export function createMovimentacao(
  perfilId: number,
  payload: Pick<CaixaMovimentacao, "tipo" | "categoria" | "descricao" | "valor" | "dataMovimento" | "metodoPagamento">,
) {
  const movimentacao = CaixaRepository.create({ ...payload, perfilId });
  return CaixaRepository.save(movimentacao);
}

export async function updateMovimentacao(id: number, payload: Partial<CaixaMovimentacao>) {
  await CaixaRepository.update(id, payload);
  return CaixaRepository.findOneByOrFail({ id });
}

export function removeMovimentacao(id: number) {
  return CaixaRepository.delete(id);
}
