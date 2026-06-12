import { Router } from "express";
import { list } from "../cases/list/controller";
import { upsert } from "../cases/upsert/controller";

const router = Router();

router.get("/", list);
router.put("/", upsert);

export default router;
