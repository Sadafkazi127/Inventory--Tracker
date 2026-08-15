import { Router, type IRouter } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import {
  listProductsHandler,
  getProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from "../controllers/product.controller";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listProductsHandler));
router.get("/:id", asyncHandler(getProductHandler));
router.post("/", asyncHandler(createProductHandler));
router.put("/:id", asyncHandler(updateProductHandler));
router.delete("/:id", asyncHandler(deleteProductHandler));

export default router;
