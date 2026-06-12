import { PagamentoRepository } from "../PagamentoRepository";
import type { Pagamento, PagamentoStatus } from "../Pagamento.entity";

export function listPagamentos(perfilId: number, mes: number, ano: number) {
  return PagamentoRepository.find({
    where: { perfilId, mes, ano },
    relations: { jogador: true },
    order: { createdAt: "DESC" },
  });
}

export async function upsertPagamento(
  perfilId: number,
  payload: Pick<Pagamento, "jogadorId" | "mes" | "ano" | "valor" | "status" | "dataVencimento" | "dataPagamento">,
) {
  const existing = await PagamentoRepository.findOneBy({
    perfilId,
    jogadorId: payload.jogadorId,
    mes: payload.mes,
    ano: payload.ano,
  });

  if (existing) {
    await PagamentoRepository.update(existing.id, payload);
    return PagamentoRepository.findOneOrFail({ where: { id: existing.id }, relations: { jogador: true } });
  }

  const pagamento = PagamentoRepository.create({ ...payload, perfilId });
  return PagamentoRepository.save(pagamento);
}

export async function bulkCreateMensalidades(
  perfilId: number,
  jogadorIds: number[],
  mes: number,
  ano: number,
  valor = 130,
) {
  const dataVencimento = `${ano}-${String(mes).padStart(2, "0")}-10`;
  const status: PagamentoStatus = "pendente";

  for (const jogadorId of jogadorIds) {
    const existing = await PagamentoRepository.findOneBy({ perfilId, jogadorId, mes, ano });
    if (!existing) {
      const p = PagamentoRepository.create({ perfilId, jogadorId, mes, ano, valor, status, dataVencimento });
      await PagamentoRepository.save(p);
    }
  }
}
