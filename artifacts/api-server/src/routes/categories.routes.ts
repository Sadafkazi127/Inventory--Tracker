import { Router, type IRouter } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import {
  listCategoriesHandler,
  createCategoryHandler,
  deleteCategoryHandler,
} from "../controllers/product.controller";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listCategoriesHandler));
router.post("/", asyncHandler(createCategoryHandler));
router.delete("/:id", asyncHandler(deleteCategoryHandler));

export default router;
