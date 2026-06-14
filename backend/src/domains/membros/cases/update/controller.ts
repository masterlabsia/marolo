import type { Request, Response } from "express";
import { updateMembro } from "../../shared/services";

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { papel } = req.body;
  if (!papel) return res.status(400).json({ error: "papel é obrigatório" });

  const membro = await updateMembro(id, { papel });
  res.json(membro);
}
