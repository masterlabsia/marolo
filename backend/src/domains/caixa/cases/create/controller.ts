import type { Request, Response } from "express";
import { createMovimentacao } from "../../shared/services";

export async function create(req: Request, res: Response) {
  const { perfilId, tipo, categoria, descricao, valor, dataMovimento, metodoPagamento } = req.body;
  if (!perfilId || !tipo || !descricao || !valor || !dataMovimento) {
    return res.status(400).json({ error: "perfilId, tipo, descricao, valor e dataMovimento são obrigatórios" });
  }

  const movimentacao = await createMovimentacao(Number(perfilId), {
    tipo,
    categoria,
    descricao,
    valor: Number(valor),
    dataMovimento,
    metodoPagamento,
  });
  res.status(201).json(movimentacao);
}
