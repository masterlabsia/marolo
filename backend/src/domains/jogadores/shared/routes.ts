import { Router } from "express";
import { list } from "../cases/list/controller";
import { create } from "../cases/create/controller";
import { update } from "../cases/update/controller";
import { remove } from "../cases/remove/controller";

const router = Router();

router.get("/", list);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
