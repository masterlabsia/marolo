import type { Request, Response } from "express";
import { listMembros } from "../../shared/services";

export async function list(req: Request, res: Response) {
  const perfilId = Number(req.query.perfilId);
  if (!perfilId) return res.status(400).json({ error: "perfilId é obrigatório" });

  const membros = await listMembros(perfilId);
  res.json(membros);
}
