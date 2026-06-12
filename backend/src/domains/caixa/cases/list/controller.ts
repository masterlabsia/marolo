import type { Request, Response } from "express";
import { listCaixa } from "../../shared/services";

export async function list(req: Request, res: Response) {
  const perfilId = Number(req.query.perfilId);
  if (!perfilId) return res.status(400).json({ error: "perfilId é obrigatório" });

  const movimentacoes = await listCaixa(perfilId);
  res.json(movimentacoes);
}
