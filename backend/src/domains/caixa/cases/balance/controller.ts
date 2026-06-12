import type { Request, Response } from "express";
import { getSaldo } from "../../shared/services";

export async function balance(req: Request, res: Response) {
  const perfilId = Number(req.query.perfilId);
  if (!perfilId) return res.status(400).json({ error: "perfilId é obrigatório" });

  const saldo = await getSaldo(perfilId);
  res.json({ saldo: parseFloat(saldo.toFixed(2)) });
}
