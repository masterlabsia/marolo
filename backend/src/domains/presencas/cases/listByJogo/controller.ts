import type { Request, Response } from "express";
import { listPresencasByJogo } from "../../shared/services";

export async function listByJogo(req: Request, res: Response) {
  const presencas = await listPresencasByJogo(Number(req.params.jogoId));
  res.json(presencas);
}
