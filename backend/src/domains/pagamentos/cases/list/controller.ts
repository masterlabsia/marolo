import type { Request, Response } from "express";
import { listPagamentos } from "../../shared/services";

export async function list(req: Request, res: Response) {
  const perfilId = Number(req.query.perfilId);
  const mes = Number(req.query.mes);
  const ano = Number(req.query.ano);

  if (!perfilId || !mes || !ano) {
    return res.status(400).json({ error: "perfilId, mes e ano são obrigatórios" });
  }

  const pagamentos = await listPagamentos(perfilId, mes, ano);
  res.json(pagamentos);
}
