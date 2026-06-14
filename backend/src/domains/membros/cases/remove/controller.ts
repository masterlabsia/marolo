import type { Request, Response } from "express";
import { removeMembro } from "../../shared/services";

export async function remove(req: Request, res: Response) {
  await removeMembro(Number(req.params.id));
  res.status(204).send();
}
