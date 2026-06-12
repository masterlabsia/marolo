import { Router } from "express";
import jogadoresRouter from "../domains/jogadores/shared/routes";
import jogosRouter from "../domains/jogos/shared/routes";
import presencasRouter from "../domains/presencas/shared/routes";
import pagamentosRouter from "../domains/pagamentos/shared/routes";
import caixaRouter from "../domains/caixa/shared/routes";
import statsRouter from "../domains/stats/shared/routes";

export const router = Router();

router.use("/jogadores", jogadoresRouter);
router.use("/jogos", jogosRouter);
router.use("/presencas", presencasRouter);
router.use("/pagamentos", pagamentosRouter);
router.use("/caixa", caixaRouter);
router.use("/stats", statsRouter);
