import type { Request, Response } from "express";
import { removeMovimentacao } from "../../shared/services";

export async function remove(req: Request, res: Response) {
  await removeMovimentacao(Number(req.params.id));
  res.status(204).send();
}
