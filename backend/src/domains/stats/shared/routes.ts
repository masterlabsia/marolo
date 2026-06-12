import { Router } from "express";
import { playerStats } from "../cases/playerStats/controller";
import { topScorers } from "../cases/topScorers/controller";

const router = Router();

router.get("/jogadores", playerStats);
router.get("/artilheiros", topScorers);

export default router;
