import { Router, type IRouter } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import {
  getStatsHandler,
  getSalesReportHandler,
  getTopProductsHandler,
  getInventoryReportHandler,
} from "../controllers/report.controller";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/stats", asyncHandler(getStatsHandler));
router.get("/sales", asyncHandler(getSalesReportHandler));
router.get("/top-products", asyncHandler(getTopProductsHandler));
router.get("/inventory", asyncHandler(getInventoryReportHandler));

export default router;
