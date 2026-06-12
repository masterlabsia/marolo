import type { Request, Response } from "express";
import { upsertPresenca } from "../../shared/services";

export async function upsert(req: Request, res: Response) {
  const { jogoId, jogadorId, presente, gols, assistencias, cartoes, notas, avaliacao } = req.body;
  if (!jogoId || !jogadorId) {
    return res.status(400).json({ error: "jogoId e jogadorId são obrigatórios" });
  }

  const presenca = await upsertPresenca({ jogoId, jogadorId, presente, gols, assistencias, cartoes, notas, avaliacao });
  res.json(presenca);
}
