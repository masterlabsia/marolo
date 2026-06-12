import type { Request, Response } from "express";
import { getStatsJogadores } from "../../shared/services";

export async function playerStats(req: Request, res: Response) {
  const perfilId = Number(req.query.perfilId);
  if (!perfilId) return res.status(400).json({ error: "perfilId é obrigatório" });

  const stats = await getStatsJogadores(perfilId);
  res.json(stats);
}
