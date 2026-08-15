import type { Request, Response } from "express";
import { adjustStockBodySchema } from "../schemas/inventory.schema";
import * as inventoryService from "../services/inventory.service";

export async function listInventoryLogsHandler(_req: Request, res: Response) {
  res.json(await inventoryService.listInventoryLogs());
}

export async function adjustStockHandler(req: Request, res: Response) {
  const input = adjustStockBodySchema.parse(req.body);
  res.status(201).json(await inventoryService.adjustStock(input));
}
