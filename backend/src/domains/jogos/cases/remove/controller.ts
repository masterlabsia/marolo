import type { Request, Response } from "express";
import { removeJogo } from "../../shared/services";

export async function remove(req: Request, res: Response) {
  await removeJogo(Number(req.params.id));
  res.status(204).send();
}
