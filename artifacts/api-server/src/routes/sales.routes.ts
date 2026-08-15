import { Router, type IRouter } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { listSalesHandler, getSaleHandler, createSaleHandler } from "../controllers/sale.controller";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listSalesHandler));
router.get("/:id", asyncHandler(getSaleHandler));
router.post("/", asyncHandler(createSaleHandler));

export default router;
