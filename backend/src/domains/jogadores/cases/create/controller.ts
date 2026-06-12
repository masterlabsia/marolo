import type { Request, Response } from "express";
import { createJogador } from "../../shared/services";

export async function create(req: Request, res: Response) {
  const { perfilId, nome, posicao, numeroCamisa, telefone, email, tags } = req.body;
  if (!perfilId || !nome) return res.status(400).json({ error: "perfilId e nome são obrigatórios" });

  const jogador = await createJogador(Number(perfilId), { nome, posicao, numeroCamisa, telefone, email, tags });
  res.status(201).json(jogador);
}
