import { Router } from "express";
import { listByJogo } from "../cases/listByJogo/controller";
import { upsert } from "../cases/upsert/controller";

const router = Router();

router.get("/jogo/:jogoId", listByJogo);
router.put("/", upsert);

export default router;
