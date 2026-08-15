import { Router, type IRouter } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { getSettingsHandler, updateSettingsHandler } from "../controllers/settings.controller";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/", asyncHandler(getSettingsHandler));
router.put("/", asyncHandler(updateSettingsHandler));

export default router;
