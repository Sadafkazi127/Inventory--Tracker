import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth.routes";
import productsRouter from "./products.routes";
import categoriesRouter from "./categories.routes";
import customersRouter from "./customers.routes";
import salesRouter from "./sales.routes";
import inventoryRouter from "./inventory.routes";
import settingsRouter from "./settings.routes";
import reportsRouter from "./reports.routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/categories", categoriesRouter);
router.use("/customers", customersRouter);
router.use("/sales", salesRouter);
router.use("/inventory", inventoryRouter);
router.use("/settings", settingsRouter);
router.use("/reports", reportsRouter);

export default router;
