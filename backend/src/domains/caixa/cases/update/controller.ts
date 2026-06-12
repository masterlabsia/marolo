import type { Request, Response } from "express";
import { updateMovimentacao } from "../../shared/services";

export async function update(req: Request, res: Response) {
  const movimentacao = await updateMovimentacao(Number(req.params.id), req.body);
  res.json(movimentacao);
}
