import type { Request, Response } from "express";
import { updateJogador } from "../../shared/services";

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const jogador = await updateJogador(id, req.body);
  res.json(jogador);
}
