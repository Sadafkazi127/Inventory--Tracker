import { Router, type IRouter } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../middlewares/auth";
import {
  listCustomersHandler,
  getCustomerHandler,
  createCustomerHandler,
  updateCustomerHandler,
  deleteCustomerHandler,
} from "../controllers/customer.controller";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listCustomersHandler));
router.get("/:id", asyncHandler(getCustomerHandler));
router.post("/", asyncHandler(createCustomerHandler));
router.put("/:id", asyncHandler(updateCustomerHandler));
router.delete("/:id", asyncHandler(deleteCustomerHandler));

export default router;
