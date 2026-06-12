import type { Request, Response } from "express";
import { upsertPagamento } from "../../shared/services";

export async function upsert(req: Request, res: Response) {
  const { perfilId, jogadorId, mes, ano, valor, status, dataVencimento, dataPagamento } = req.body;
  if (!perfilId || !jogadorId || !mes || !ano) {
    return res.status(400).json({ error: "perfilId, jogadorId, mes e ano são obrigatórios" });
  }

  const pagamento = await upsertPagamento(Number(perfilId), {
    jogadorId: Number(jogadorId),
    mes: Number(mes),
    ano: Number(ano),
    valor: Number(valor),
    status,
    dataVencimento,
    dataPagamento,
  });
  res.json(pagamento);
}
