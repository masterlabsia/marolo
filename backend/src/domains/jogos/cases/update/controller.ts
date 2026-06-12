import type { Request, Response } from "express";
import { updateJogo } from "../../shared/services";

export async function update(req: Request, res: Response) {
  const jogo = await updateJogo(Number(req.params.id), req.body);
  res.json(jogo);
}
