import type { Request, Response } from "express";
import { createMembro } from "../../shared/services";

export async function create(req: Request, res: Response) {
  const { perfilId, usuarioId, papel } = req.body;
  if (!perfilId || !usuarioId) return res.status(400).json({ error: "perfilId e usuarioId são obrigatórios" });

  const membro = await createMembro(Number(perfilId), { usuarioId, papel: papel ?? "jogador" });
  res.status(201).json(membro);
}
