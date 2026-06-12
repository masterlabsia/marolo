import type { Request, Response } from "express";
import { listJogadores } from "../../shared/services";

export async function list(req: Request, res: Response) {
  const perfilId = Number(req.query.perfilId);
  if (!perfilId) return res.status(400).json({ error: "perfilId é obrigatório" });

  const jogadores = await listJogadores(perfilId);
  res.json(jogadores);
}
