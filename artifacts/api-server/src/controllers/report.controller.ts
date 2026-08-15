import type { Request, Response } from "express";
import * as reportService from "../services/report.service";
import * as settingsService from "../services/settings.service";

export async function getStatsHandler(_req: Request, res: Response) {
  const settings = await settingsService.getSettings();
  res.json(await reportService.getStats(settings.lowStockThreshold));
}

export async function getSalesReportHandler(req: Request, res: Response) {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  res.json(await reportService.getSalesReport(from, to));
}

export async function getTopProductsHandler(req: Request, res: Response) {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  res.json(await reportService.getTopProducts(limit));
}

export async function getInventoryReportHandler(_req: Request, res: Response) {
  const settings = await settingsService.getSettings();
  res.json(await reportService.getLowStockProducts(settings.lowStockThreshold));
}
