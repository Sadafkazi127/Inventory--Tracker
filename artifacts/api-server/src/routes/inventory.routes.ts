import { Router, type IRouter } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { listInventoryLogsHandler, adjustStockHandler } from "../controllers/inventory.controller";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/logs", asyncHandler(listInventoryLogsHandler));
router.post("/adjust", asyncHandler(adjustStockHandler));

export default router;
