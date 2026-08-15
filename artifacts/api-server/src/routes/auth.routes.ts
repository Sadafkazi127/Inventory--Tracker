import { Router, type IRouter } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import { loginHandler, meHandler, changePasswordHandler } from "../controllers/auth.controller";

const router: IRouter = Router();

router.post("/login", asyncHandler(loginHandler));
router.get("/me", requireAuth, meHandler);
router.put("/password", requireAuth, asyncHandler(changePasswordHandler));

export default router;
