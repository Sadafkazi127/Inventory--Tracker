import type { Request, Response } from "express";
import * as saleService from "../services/sale.service";
import { createSaleBodySchema } from "../schemas/sale.schema";

export async function listSalesHandler(
  _req: Request,
  res: Response
) {
  res.json(await saleService.listSales());
}

export async function getSaleHandler(
  req: Request,
  res: Response
) {
  const saleId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json(await saleService.getSale(saleId));
}

export async function createSaleHandler(
  req: Request,
  res: Response
) {
  console.log("🔥 CREATE SALE HANDLER REACHED");
  console.log("🔥 REQUEST BODY:", req.body);

  const input = createSaleBodySchema.parse(req.body);

  console.log("🔥 CALLING completeSale()");

  const sale = await saleService.completeSale(input);

  console.log("🔥 SALE CREATED:", sale.id);

  res.status(201).json(sale);
}
