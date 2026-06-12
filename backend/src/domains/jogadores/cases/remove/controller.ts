import type { Request, Response } from "express";
import { removeJogador } from "../../shared/services";

export async function remove(req: Request, res: Response) {
  await removeJogador(Number(req.params.id));
  res.status(204).send();
}
