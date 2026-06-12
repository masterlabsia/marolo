import type { Request, Response } from "express";
import { createJogo } from "../../shared/services";

export async function create(req: Request, res: Response) {
  const { perfilId, dataHora, adversario, local, formacao, notas } = req.body;
  if (!perfilId || !dataHora || !adversario) {
    return res.status(400).json({ error: "perfilId, dataHora e adversario são obrigatórios" });
  }

  const jogo = await createJogo(Number(perfilId), { dataHora, adversario, local, formacao, notas });
  res.status(201).json(jogo);
}
