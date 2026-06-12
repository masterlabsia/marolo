import type { Request, Response } from "express";
import { getTopScorers } from "../../shared/services";

export async function topScorers(req: Request, res: Response) {
  const perfilId = Number(req.query.perfilId);
  const limit = Number(req.query.limit) || 10;
  if (!perfilId) return res.status(400).json({ error: "perfilId é obrigatório" });

  const artilheiros = await getTopScorers(perfilId, limit);
  res.json(artilheiros);
}
